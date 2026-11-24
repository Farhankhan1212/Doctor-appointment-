import httpStatus from "http-status";
import mongoose from "mongoose";
import moment from "moment";
import ApiError from "../../../errors/apiError";
import {
    Appointments,
    Doctor,
    DoctorTimeSlot as DoctorTimeSlotModel,
} from "../../../shared/models";

// Frontend time pickers have sent "9:00 am", "09:00 AM" and "09:00" over time,
// so accept all of them instead of one strict format.
const TIME_FORMATS = ["h:mm a", "hh:mm a", "h:mm A", "hh:mm A", "h:mma", "H:mm", "HH:mm"];
const SLOT_MINUTES = 30;

export const parseTime = (value: any) => moment(String(value ?? "").trim(), TIME_FORMATS, true);

// Used when a doctor has not configured any schedule yet, so the booking
// page is never empty for a freshly registered / seeded doctor.
export const DEFAULT_WORKING_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
export const DEFAULT_WORKING_HOURS = [
    { startTime: "09:00 am", endTime: "01:00 pm" },
    { startTime: "02:00 pm", endTime: "06:00 pm" },
];

const normaliseDay = (day: any) => String(day ?? "").trim().toLowerCase();
const isId = (id: any) => typeof id === "string" && mongoose.isValidObjectId(id);

const requireDoctor = async (userId: string) => {
    const doctor = isId(userId) ? await Doctor.findById(userId) : null;
    if (!doctor) {
        throw new ApiError(httpStatus.NOT_FOUND, "Doctor Account is not found !!");
    }
    return doctor;
};

// Create Time Slot
const createTimeSlot = async (user: any, payload: any): Promise<any> => {
    const doctor = await requireDoctor(user.userId);

    if (!payload.day) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Day is required !!");
    }
    const day = normaliseDay(payload.day);

    const isAlreadyExist = await DoctorTimeSlotModel.findOne({ doctorId: doctor._id, day });
    if (isAlreadyExist) {
        throw new ApiError(
            httpStatus.CONFLICT,
            "Time Slot Already Exist Please update or try another day"
        );
    }

    return DoctorTimeSlotModel.create({
        day,
        doctorId: doctor._id,
        maximumPatient: payload.maximumPatient,
        weekDay: payload.weekDay,
        timeSlot: (payload.timeSlot || []).map((item: any) => ({
            startTime: item.startTime,
            endTime: item.endTime,
        })),
    });
};

// Delete Time Slot (whole day schedule)
const deleteTimeSlot = async (id: string): Promise<any> => {
    const result = isId(id) ? await DoctorTimeSlotModel.findByIdAndDelete(id) : null;
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Time Slot is not found !!");
    }
    return result;
};

// Get Single Time Slot
const getTimeSlot = async (id: string): Promise<any> => {
    const result = isId(id) ? await DoctorTimeSlotModel.findById(id) : null;
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Time Slot is not found !!");
    }
    return result;
};

// Get Logged-in Doctor Time Slots
const getMyTimeSlot = async (user: any, filter: any): Promise<any> => {
    const doctor = await requireDoctor(user.userId);

    const whereCondition: any = { doctorId: doctor._id };
    if (filter.day) {
        whereCondition.day = normaliseDay(filter.day);
    }
    return DoctorTimeSlotModel.find(whereCondition);
};

// Get All Doctors Time Slots
const getAllTimeSlot = async (): Promise<any> => {
    return DoctorTimeSlotModel.find().populate("doctor", "firstName lastName");
};

// Update Time Slot: add new ranges and/or edit existing ranges
const updateTimeSlot = async (
    user: any,
    id: string | undefined,
    payload: any
): Promise<{ message: string }> => {
    const doctor = await requireDoctor(user.userId);
    const { timeSlot, create } = payload;

    // Add new ranges. The day document is found by id, or by the day name the
    // frontend sends with each new range (the PATCH route has no :id).
    if (create && create.length > 0) {
        const where: any = { doctorId: doctor._id };
        if (isId(id as string)) where._id = id;
        else where.day = normaliseDay(create[0].day);

        const doctorTimeSlot = await DoctorTimeSlotModel.findOne(where);
        if (!doctorTimeSlot) {
            throw new ApiError(httpStatus.NOT_FOUND, "Time Slot is not found !!");
        }

        for (const item of create) {
            doctorTimeSlot.timeSlot.push({
                startTime: item.startTime,
                endTime: item.endTime,
            } as any);
        }
        await doctorTimeSlot.save();
    }

    // Edit existing ranges
    if (timeSlot && timeSlot.length > 0) {
        for (const item of timeSlot) {
            const slotId = item.id || item._id;
            const doctorTimeSlot = await DoctorTimeSlotModel.findOne(
                isId(item.doctorTimeSlotId)
                    ? { _id: item.doctorTimeSlotId, doctorId: doctor._id }
                    : { "timeSlot._id": slotId, doctorId: doctor._id }
            );
            if (!doctorTimeSlot) {
                throw new ApiError(httpStatus.NOT_FOUND, "Time Slot is not found !!");
            }

            const existingSlot = doctorTimeSlot.timeSlot.id(slotId);
            if (!existingSlot) {
                throw new ApiError(httpStatus.NOT_FOUND, "Schedule Day is not found !!");
            }

            existingSlot.startTime = item.startTime;
            existingSlot.endTime = item.endTime;
            await doctorTimeSlot.save();
        }
    }

    return { message: "Successfully Updated" };
};

// Expand "09:00 am - 01:00 pm" style ranges into 30 minute slots.
const expandRanges = (ranges: { startTime: any; endTime: any }[]) => {
    const times: string[] = [];
    for (const range of ranges) {
        const start = parseTime(range.startTime);
        const end = parseTime(range.endTime);
        if (!start.isValid() || !end.isValid()) continue;

        const cursor = start.clone();
        while (cursor.isBefore(end)) {
            times.push(cursor.format("hh:mm a"));
            cursor.add(SLOT_MINUTES, "minutes");
        }
    }
    return times;
};

// Slots a patient can still book for a doctor.
//   day  -> weekday name ("monday"). Derived from `date` when only the date is sent.
//   date -> optional calendar date; when present, already booked times are removed.
const getAppointmentTimeOfEachDoctor = async (id: string, filter: any): Promise<any> => {
    const doctor = isId(id) ? await Doctor.findById(id) : null;
    if (!doctor) {
        throw new ApiError(httpStatus.NOT_FOUND, "Doctor Account is not found !!");
    }

    const date = filter.date && moment(String(filter.date)).isValid() ? moment(String(filter.date)) : null;
    const selectedDay = filter.day
        ? normaliseDay(filter.day)
        : date
            ? date.format("dddd").toLowerCase()
            : null;

    const doctorTimeSlots = await DoctorTimeSlotModel.find({ doctorId: doctor._id });

    // Day-wise schedule the doctor has configured
    const ranges: { startTime: any; endTime: any }[] = [];
    doctorTimeSlots.forEach((item: any) => {
        if (selectedDay && normaliseDay(item.day) !== selectedDay) return;
        item.timeSlot.forEach((slot: any) => ranges.push(slot));
    });

    // A doctor with no schedule at all gets the default working hours
    const hasAnySchedule = doctorTimeSlots.length > 0;
    if (!hasAnySchedule && selectedDay && DEFAULT_WORKING_DAYS.includes(selectedDay)) {
        ranges.push(...DEFAULT_WORKING_HOURS);
    }

    let times = Array.from(new Set(expandRanges(ranges)));

    // Remove slots that are already taken on that date
    if (date) {
        const booked = await Appointments.find({
            doctorId: doctor._id,
            scheduleDate: new RegExp("^" + date.format("YYYY-MM-DD")),
            status: { $not: /^cancel/i },
        }).select("scheduleTime");

        const taken = new Set(
            booked
                .map((a: any) => parseTime(a.scheduleTime))
                .filter((t: any) => t.isValid())
                .map((t: any) => t.format("hh:mm a"))
        );
        times = times.filter((t) => !taken.has(t));
    }

    times.sort((a, b) => parseTime(a).valueOf() - parseTime(b).valueOf());

    return times.map((time, index) => ({
        day: selectedDay,
        slot: { id: index + 1, time },
    }));
};

export const TimeSlotService = {
    updateTimeSlot,
    getAllTimeSlot,
    getTimeSlot,
    createTimeSlot,
    deleteTimeSlot,
    getMyTimeSlot,
    getAppointmentTimeOfEachDoctor,
};
