import mongoose from "mongoose";
import httpStatus from "http-status";
import ApiError from "../../../errors/apiError";
import {
    Doctor as DoctorModel,
    Patient as PatientModel,
    Reviews as ReviewModel,
} from "../../../shared/models";
import { Reviews } from "../../../shared/types";
import { IOption } from "../../../shared/paginationHelper";

const isId = (id: any) => typeof id === "string" && mongoose.isValidObjectId(id);

const WITH_NAMES_AND_IMG = [
    { path: "doctor", select: "firstName lastName img" },
    { path: "patient", select: "firstName lastName img" },
];
const WITH_NAMES = [
    { path: "doctor", select: "firstName lastName" },
    { path: "patient", select: "firstName lastName" },
];

const stripIdentity = (data: Record<string, any> = {}) => {
    const out = { ...data };
    for (const key of Object.keys(out)) {
        if (key.startsWith("$") || key === "id" || key === "_id") delete out[key];
    }
    return out;
};

const create = async (user: any, payload: Reviews): Promise<Reviews> => {
    const patient = isId(user.userId) ? await PatientModel.findById(user.userId) : null;
    if (!patient) {
        throw new ApiError(httpStatus.NOT_FOUND, "Patient Account is not found !!");
    }
    const doctor = isId(payload?.doctorId) ? await DoctorModel.findById(payload.doctorId) : null;
    if (!doctor) {
        throw new ApiError(httpStatus.NOT_FOUND, "Doctor Account is not found !!");
    }
    return ReviewModel.create({ ...stripIdentity(payload), doctorId: doctor._id, patientId: patient._id });
};

const getAllReviews = async (options: IOption): Promise<Reviews[] | null> => {
    const limit = Number(options.limit) || 10;
    return ReviewModel.find().sort({ createdAt: -1 }).limit(limit).populate(WITH_NAMES_AND_IMG) as any;
};

const getSingleReview = async (id: string): Promise<Reviews | null> => {
    if (!isId(id)) return null;
    return ReviewModel.findById(id).populate(WITH_NAMES) as any;
};

const getDoctorReviews = async (id: string): Promise<Reviews[] | null> => {
    const doctor = isId(id) ? await DoctorModel.findById(id) : null;
    if (!doctor) {
        throw new ApiError(httpStatus.NOT_FOUND, "Doctor Account is not found !!");
    }
    return ReviewModel.find({ doctorId: doctor._id }).sort({ createdAt: -1 }).populate(WITH_NAMES) as any;
};

const deleteReviews = async (id: string): Promise<Reviews> => {
    const result = isId(id) ? await ReviewModel.findByIdAndDelete(id) : null;
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Review not found !!");
    }
    return result as any;
};

const updateReview = async (id: string, payload: Partial<Reviews>): Promise<Reviews> => {
    const result = isId(id)
        ? await ReviewModel.findByIdAndUpdate(id, stripIdentity(payload), { new: true, runValidators: true })
        : null;
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Review not found !!");
    }
    return result as any;
};

const replyReviewByDoctor = async (user: any, id: string, payload: Partial<Reviews>): Promise<Reviews> => {
    const doctor = isId(user.userId) ? await DoctorModel.findById(user.userId) : null;
    if (!doctor) {
        throw new ApiError(httpStatus.NOT_FOUND, "Doctor Account is not found !!");
    }
    // a doctor can only reply to reviews written about them
    const result = isId(id)
        ? await ReviewModel.findOneAndUpdate(
              { _id: id, doctorId: doctor._id },
              { response: payload.response },
              { new: true }
          )
        : null;
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Review not found !!");
    }
    return result as any;
};

export const ReviewService = {
    create,
    getAllReviews,
    getDoctorReviews,
    deleteReviews,
    updateReview,
    getSingleReview,
    replyReviewByDoctor,
};
