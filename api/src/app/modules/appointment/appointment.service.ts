import mongoose from "mongoose";
import httpStatus from "http-status";
import moment from "moment";
import * as path from "path";
import ApiError from "../../../errors/apiError";
import config from "../../../config";
import { EmailtTransporter } from "../../../helpers/emailTransporter";
import { paymentStatus } from "../../../shared/enums";
import {
    Appointments as AppointmentModel,
    Doctor as DoctorModel,
    Patient as PatientModel,
    Payment as PaymentModel,
} from "../../../shared/models";
import { Appointments, Patient } from "../../../shared/types";
import { TimeSlotService, parseTime } from "../doctorTimeSlot/doctorTimeSlot.service";

type AnyRecord = Record<string, any>;

const isId = (id: any) => typeof id === "string" && mongoose.isValidObjectId(id);

// Only these fields may be written by a patient while booking
const BOOKING_FIELDS = [
    "patientId", "doctorId", "firstName", "lastName", "email", "phone", "address",
    "description", "scheduleDate", "scheduleTime", "reasonForVisit", "patientType",
];
const pickBookingFields = (source: AnyRecord = {}) => {
    const out: AnyRecord = {};
    for (const key of BOOKING_FIELDS) {
        if (source[key] !== undefined && source[key] !== null && source[key] !== "") out[key] = source[key];
    }
    return out;
};

// Remove Mongo operators / identity fields from client supplied update bodies
const sanitiseUpdate = (payload: AnyRecord = {}) => {
    const out: AnyRecord = { ...payload };
    for (const key of Object.keys(out)) {
        if (key.startsWith("$") || key === "id" || key === "_id") delete out[key];
    }
    return out;
};

// <3 letters> + year + month + day-of-year + 3 random digits, e.g. AMI20261133280
const buildTrackingId = (prefix: string) => {
    const now = moment();
    const day = String(now.dayOfYear()).padStart(2, "0");
    const suffix = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
    return `${prefix}${now.year()}${String(now.month() + 1).padStart(2, "0")}${day}${suffix}`;
};

// Create the appointment, retrying with a new tracking id on a (rare) collision
const insertAppointment = async (info: AnyRecord, prefix: string) => {
    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            return await AppointmentModel.create({ ...info, trackingId: buildTrackingId(prefix) });
        } catch (error: any) {
            if (error?.code !== 11000) throw error;
        }
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Could not generate a tracking id, please try again");
};

// The requested date + time must be one of the doctor's currently free slots
const assertSlotIsFree = async (doctorId: string, scheduleDate: string, scheduleTime: string) => {
    const date = moment(scheduleDate);
    if (!scheduleDate || !date.isValid()) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Please select a valid appointment date");
    }
    if (date.isBefore(moment().startOf("day"))) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Appointment date can not be in the past");
    }
    const time = parseTime(scheduleTime);
    if (!time.isValid()) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Please select a valid appointment time");
    }

    const free = await TimeSlotService.getAppointmentTimeOfEachDoctor(doctorId, {
        day: date.format("dddd").toLowerCase(),
        date: date.format("YYYY-MM-DD"),
    });
    const wanted = time.format("hh:mm a");
    if (!free.some((item: any) => item.slot.time === wanted)) {
        throw new ApiError(
            httpStatus.CONFLICT,
            "This time slot is not available any more. Please choose another slot."
        );
    }
};

const sendAppointmentMail = (template: string, obj: AnyRecord, toMail: string, subject: string) => {
    const pathName = path.join(__dirname, "../../../../template/" + template);
    // e-mail problems must never fail a booking that is already saved
    EmailtTransporter({ pathName, replacementObj: obj, toMail, subject }).catch((e: any) =>
        console.log("Email skipped:", e?.message)
    );
};

const createAppointment = async (payload: AnyRecord): Promise<Appointments> => {
    const { patientInfo, payment } = payload || {};
    if (!patientInfo || !payment) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Appointment and payment details are required");
    }
    const info = pickBookingFields(patientInfo);

    if (!isId(info.doctorId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Doctor Account is not found !!");
    }
    const doctor = await DoctorModel.findById(info.doctorId);
    if (!doctor) {
        throw new ApiError(httpStatus.NOT_FOUND, "Doctor Account is not found !!");
    }
    if (!info.firstName || !info.lastName || !info.email) {
        throw new ApiError(httpStatus.BAD_REQUEST, "First name, last name and email are required");
    }

    // a stale / unknown patient id just means "guest booking"
    if (info.patientId && !(isId(info.patientId) && (await PatientModel.exists({ _id: info.patientId })))) {
        delete info.patientId;
    }

    await assertSlotIsFree(info.doctorId, info.scheduleDate, info.scheduleTime);

    info.paymentStatus = paymentStatus.paid;
    const appointment = await insertAppointment(info, info.firstName.slice(0, 3).toUpperCase());

    try {
        const docFee = Math.round(Number(doctor.price) || 0);
        const vat = Math.round((15 / 100) * (docFee + 10));
        await PaymentModel.create({
            appointmentId: appointment._id,
            bookingFee: 10,
            paymentMethod: payment.paymentMethod,
            paymentType: payment.paymentType,
            vat,
            DoctorFee: docFee,
            totalAmount: vat + docFee,
        });
    } catch (error) {
        // no half-saved bookings (replaces the old DB transaction)
        await AppointmentModel.deleteOne({ _id: appointment._id });
        throw error;
    }

    const saved = await AppointmentModel.findById(appointment._id).populate("doctor").populate("patient");
    const doc: any = saved?.doctor;
    const pat: any = saved?.patient;
    const subject = `Appointment Confirm With Dr ${doc?.firstName} ${doc?.lastName} at ${appointment.scheduleDate} ${appointment.scheduleTime}`;
    sendAppointmentMail(
        "appointment.html",
        {
            created: moment(appointment.createdAt).format("LL"),
            trackingId: appointment.trackingId,
            patientType: appointment.patientType,
            status: appointment.status,
            paymentStatus: appointment.paymentStatus,
            prescriptionStatus: appointment.prescriptionStatus,
            scheduleDate: moment(appointment.scheduleDate).format("LL"),
            scheduleTime: appointment.scheduleTime,
            doctorImg: doc?.img,
            doctorFirstName: doc?.firstName,
            doctorLastName: doc?.lastName,
            specialization: doc?.specialization,
            designation: doc?.designation,
            college: doc?.college,
            patientImg: pat?.img,
            patientfirstName: pat?.firstName,
            patientLastName: pat?.lastName,
            dateOfBirth: pat?.dateOfBirth ? moment().diff(moment(pat.dateOfBirth), "years") : "",
            bloodGroup: pat?.bloodGroup,
            city: pat?.city,
            state: pat?.state,
            country: pat?.country,
        },
        [appointment.email, doc?.email].filter(Boolean).join(","),
        subject
    );
    return saved as any;
};

const createAppointmentByUnAuthenticateUser = async (payload: AnyRecord): Promise<Appointments | null> => {
    const { patientInfo, payment } = payload || {};
    if (!patientInfo || !payment) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Appointment and payment details are required");
    }
    const info = pickBookingFields(patientInfo);
    if (info.patientId && !(isId(info.patientId) && (await PatientModel.exists({ _id: info.patientId })))) {
        delete info.patientId;
    }
    if (config.defaultAdminDoctor && isId(config.defaultAdminDoctor)) {
        info.doctorId = config.defaultAdminDoctor;
    } else {
        delete info.doctorId;
    }

    const appointment = await insertAppointment(info, "UNU");

    try {
        const vat = Math.round((15 / 100) * (60 + 10));
        await PaymentModel.create({
            appointmentId: appointment._id,
            bookingFee: 10,
            paymentMethod: payment.paymentMethod,
            paymentType: payment.paymentType,
            vat,
            DoctorFee: 60,
            totalAmount: vat + 60,
        });
    } catch (error) {
        await AppointmentModel.deleteOne({ _id: appointment._id });
        throw error;
    }

    if (appointment.email) {
        sendAppointmentMail(
            "meeting.html",
            {
                created: moment(appointment.createdAt).format("LL"),
                trackingId: appointment.trackingId,
                patientType: appointment.patientType,
                status: appointment.status,
                paymentStatus: appointment.paymentStatus,
                prescriptionStatus: appointment.prescriptionStatus,
                scheduleDate: moment(appointment.scheduleDate).format("LL"),
                scheduleTime: appointment.scheduleTime,
            },
            appointment.email,
            `Appointment Confirm at ${appointment.scheduleDate} ${appointment.scheduleTime}`
        );
    }
    return appointment as any;
};

const getAllAppointments = async (): Promise<Appointments[] | null> => {
    return AppointmentModel.find().sort({ createdAt: -1 }).populate("doctor").populate("patient") as any;
};

const getAppointment = async (id: string): Promise<Appointments | null> => {
    if (!isId(id)) return null;
    return AppointmentModel.findById(id).populate("doctor").populate("patient") as any;
};

const getAppointmentByTrackingId = async (data: AnyRecord): Promise<Appointments | null> => {
    const id = data?.id;
    if (typeof id !== "string" || !id) return null;

    return AppointmentModel.findOne({ trackingId: id })
        .populate({ path: "doctor", select: "firstName lastName designation college degree img" })
        .populate({ path: "patient", select: "firstName lastName address city country state img" }) as any;
};

const requirePatient = async (userId: string) => {
    const patient = isId(userId) ? await PatientModel.findById(userId) : null;
    if (!patient) {
        throw new ApiError(httpStatus.NOT_FOUND, "Patient Account is not found !!");
    }
    return patient;
};

const requireDoctor = async (userId: string) => {
    const doctor = isId(userId) ? await DoctorModel.findById(userId) : null;
    if (!doctor) {
        throw new ApiError(httpStatus.NOT_FOUND, "Doctor Account is not found !!");
    }
    return doctor;
};

const getPatientAppointmentById = async (user: any): Promise<Appointments[] | null> => {
    const patient = await requirePatient(user.userId);
    return AppointmentModel.find({ patientId: patient._id })
        .sort({ createdAt: -1 })
        .populate("doctor") as any;
};

const getPaymentInfoViaAppintmentId = async (id: string): Promise<any> => {
    if (!isId(id)) return null;
    return PaymentModel.findOne({ appointmentId: id }).populate({
        path: "appointment",
        populate: [
            { path: "patient", select: "firstName lastName address country city" },
            { path: "doctor", select: "firstName lastName address country city" },
        ],
    });
};

const getPatientPaymentInfo = async (user: any): Promise<any[]> => {
    const patient = await requirePatient(user.userId);
    const ids = await AppointmentModel.distinct("_id", { patientId: patient._id });
    return PaymentModel.find({ appointmentId: { $in: ids } }).populate({
        path: "appointment",
        populate: { path: "doctor", select: "firstName lastName designation" },
    });
};

const getDoctorInvoices = async (user: any): Promise<any[] | null> => {
    const doctor = await requireDoctor(user.userId);
    const ids = await AppointmentModel.distinct("_id", { doctorId: doctor._id });
    return PaymentModel.find({ appointmentId: { $in: ids } }).populate({
        path: "appointment",
        populate: { path: "patient", select: "firstName lastName" },
    });
};

const deleteAppointment = async (id: string): Promise<any> => {
    const result = isId(id) ? await AppointmentModel.findByIdAndDelete(id) : null;
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Appointment is not found !!");
    }
    await PaymentModel.deleteMany({ appointmentId: result._id });
    return result;
};

const updateAppointment = async (id: string, payload: Partial<Appointments>): Promise<Appointments> => {
    const result = isId(id)
        ? await AppointmentModel.findByIdAndUpdate(id, sanitiseUpdate(payload), { new: true, runValidators: true })
        : null;
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Appointment is not found !!");
    }
    return result as any;
};

// doctor side
const getDoctorAppointmentsById = async (user: any, filter: AnyRecord): Promise<Appointments[] | null> => {
    const doctor = await requireDoctor(user.userId);

    const where: AnyRecord = { doctorId: doctor._id };

    // scheduleDate is stored as "YYYY-MM-DD HH:mm:ss", so string comparison is date comparison
    if (filter.sortBy == "today") {
        const today = moment().startOf("day");
        where.scheduleDate = {
            $gte: today.format("YYYY-MM-DD HH:mm:ss"),
            $lt: today.clone().add(1, "days").format("YYYY-MM-DD HH:mm:ss"),
        };
    }
    if (filter.sortBy == "upcoming") {
        where.scheduleDate = {
            $gte: moment().startOf("day").add(1, "days").format("YYYY-MM-DD HH:mm:ss"),
        };
    }

    return AppointmentModel.find(where)
        .sort({ createdAt: -1 })
        .populate("patient")
        .populate({ path: "prescription", select: "_id" }) as any;
};

const getDoctorPatients = async (user: any): Promise<Patient[]> => {
    const doctor = await requireDoctor(user.userId);
    const patientIds = await AppointmentModel.distinct("patientId", {
        doctorId: doctor._id,
        patientId: { $ne: null },
    });
    return PatientModel.find({ _id: { $in: patientIds } }) as any;
};

const updateAppointmentByDoctor = async (user: any, payload: AnyRecord): Promise<Appointments | null> => {
    const doctor = await requireDoctor(user.userId);
    const id = payload?.id || payload?._id;
    const result = isId(id)
        ? await AppointmentModel.findOneAndUpdate(
              { _id: id, doctorId: doctor._id },
              sanitiseUpdate(payload),
              { new: true, runValidators: true }
          )
        : null;
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Appointment is not found !!");
    }
    return result as any;
};

export const AppointmentService = {
    createAppointment,
    getAllAppointments,
    getAppointment,
    deleteAppointment,
    updateAppointment,
    getPatientAppointmentById,
    getDoctorAppointmentsById,
    updateAppointmentByDoctor,
    getDoctorPatients,
    getPaymentInfoViaAppintmentId,
    getPatientPaymentInfo,
    getDoctorInvoices,
    createAppointmentByUnAuthenticateUser,
    getAppointmentByTrackingId,
};

