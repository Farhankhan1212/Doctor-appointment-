import mongoose from "mongoose";
import httpStatus from "http-status";
import ApiError from "../../../errors/apiError";
import {
    Appointments as AppointmentModel,
    Doctor as DoctorModel,
    Patient as PatientModel,
    Prescription as PrescriptionModel,
} from "../../../shared/models";
import { Prescription } from "../../../shared/types";

const isId = (id: any) => typeof id === "string" && mongoose.isValidObjectId(id);

const requireDoctor = async (userId: string) => {
    const doctor = isId(userId) ? await DoctorModel.findById(userId) : null;
    if (!doctor) {
        throw new ApiError(httpStatus.NOT_FOUND, "Doctor Account is not found !!");
    }
    return doctor;
};

const stripIdentity = (data: Record<string, any> = {}) => {
    const out = { ...data };
    for (const key of Object.keys(out)) {
        if (key.startsWith("$") || key === "id" || key === "_id") delete out[key];
    }
    return out;
};

const medicineFields = (m: any) => ({
    dosage: m.dosage,
    duration: m.duration,
    frequency: m.frequency,
    medicine: m.medicine,
});

const createPrescription = async (user: any, payload: any): Promise<{ message: string }> => {
    const { medicine, status, patientType, ...rest } = payload || {};
    const doctor = await requireDoctor(user.userId);

    const appointment = isId(payload?.appointmentId) ? await AppointmentModel.findById(payload.appointmentId) : null;
    if (!appointment) {
        throw new ApiError(httpStatus.NOT_FOUND, "Appopintment is not found !!");
    }
    if (!appointment.patientId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "This appointment has no registered patient to prescribe for !!");
    }

    const prescription = await PrescriptionModel.create({
        ...stripIdentity(rest),
        doctorId: doctor._id,
        patientId: appointment.patientId,
        medicines: (Array.isArray(medicine) ? medicine : []).map(medicineFields),
    });

    try {
        // frontend sends `followUpdate`; older callers sent `followUpDate`
        await AppointmentModel.updateOne(
            { _id: appointment._id },
            {
                isFollowUp: !!(payload.followUpdate || payload.followUpDate),
                ...(status ? { status } : {}),
                ...(patientType ? { patientType } : {}),
                prescriptionStatus: "issued",
            }
        );
    } catch (error) {
        await PrescriptionModel.deleteOne({ _id: prescription._id });
        throw error;
    }

    return { message: "Successfully Prescription Created" };
};

// Update Prescription and Appointment together
const updatePrescriptionAndAppointment = async (user: any, payload: any): Promise<{ message: string }> => {
    const { status, patientType, followUpdate, prescriptionId, ...others } = payload || {};
    const doctor = await requireDoctor(user.userId);

    const prescription = isId(prescriptionId)
        ? await PrescriptionModel.findOne({ _id: prescriptionId, doctorId: doctor._id })
        : null;
    if (!prescription) {
        throw new ApiError(httpStatus.NOT_FOUND, "Prescription is not found !!");
    }

    await AppointmentModel.updateOne(
        { _id: prescription.appointmentId },
        {
            isFollowUp: !!followUpdate,
            ...(status !== undefined ? { status } : {}),
            ...(patientType !== undefined ? { patientType } : {}),
        }
    );

    const { medicine, medicines, ...prescriptionFields } = stripIdentity(others);
    prescription.set({ ...prescriptionFields, followUpdate });
    await prescription.save();

    return { message: "Successfully Prescription Updated" };
};

const getAllPrescriptions = async (): Promise<Prescription[] | null> => {
    return PrescriptionModel.find()
        .sort({ createdAt: -1 })
        .populate({ path: "appointment", select: "trackingId" }) as any;
};

const getPrescriptionById = async (id: string): Promise<Prescription | null> => {
    if (!isId(id)) return null;
    return PrescriptionModel.findById(id)
        .populate({ path: "appointment", select: "scheduleDate scheduleTime status trackingId" })
        .populate({
            path: "doctor",
            select: "firstName lastName designation email college address country state specialization",
        })
        .populate({
            path: "patient",
            select: "firstName lastName gender dateOfBirth email bloodGroup address img city",
        }) as any;
};

const getPatientPrescriptionById = async (user: any): Promise<Prescription[] | null> => {
    const patient = isId(user.userId) ? await PatientModel.findById(user.userId) : null;
    if (!patient) {
        throw new ApiError(httpStatus.NOT_FOUND, "Patient Account is not found !!");
    }
    return PrescriptionModel.find({ patientId: patient._id })
        .sort({ createdAt: -1 })
        .populate({ path: "doctor", select: "firstName lastName designation" })
        .populate({ path: "appointment", select: "scheduleDate scheduleTime status trackingId" }) as any;
};

const getDoctorPrescriptionById = async (user: any): Promise<Prescription[] | null> => {
    const doctor = await requireDoctor(user.userId);
    return PrescriptionModel.find({ doctorId: doctor._id }).sort({ createdAt: -1 }).populate("patient") as any;
};

const deletePrescription = async (id: string): Promise<any> => {
    const result = isId(id) ? await PrescriptionModel.findByIdAndDelete(id) : null;
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Prescription is not found !!");
    }
    return result;
};

const updatePrescription = async (id: string, payload: Partial<Prescription>): Promise<Prescription> => {
    const result = isId(id)
        ? await PrescriptionModel.findByIdAndUpdate(id, stripIdentity(payload), { new: true, runValidators: true })
        : null;
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Prescription is not found !!");
    }
    return result as any;
};

export const PrescriptionService = {
    createPrescription,
    getDoctorPrescriptionById,
    updatePrescription,
    getPatientPrescriptionById,
    deletePrescription,
    getPrescriptionById,
    getAllPrescriptions,
    updatePrescriptionAndAppointment,
};
