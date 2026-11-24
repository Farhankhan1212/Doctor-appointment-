import mongoose from "mongoose";
import httpStatus from "http-status";
import ApiError from "../../../errors/apiError";
import { Favourites as FavouritesModel, Patient as PatientModel } from "../../../shared/models";
import { Favourites } from "../../../shared/types";

const requirePatient = async (userId: string) => {
    const patient = mongoose.isValidObjectId(userId) ? await PatientModel.findById(userId) : null;
    if (!patient) {
        throw new ApiError(httpStatus.NOT_FOUND, "Patient Account is not found !!");
    }
    return patient;
};

const validDoctorId = (payload: Favourites) => {
    if (!payload?.doctorId || !mongoose.isValidObjectId(payload.doctorId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Valid doctorId is required !!");
    }
    return payload.doctorId as string;
};

const createFavourite = async (user: any, payload: Favourites): Promise<Favourites> => {
    const patient = await requirePatient(user.userId);
    const doctorId = validDoctorId(payload);

    // favourites are per patient (one patient liking a doctor must not block the others)
    const already = await FavouritesModel.findOne({ doctorId, patientId: patient._id });
    if (already) {
        throw new ApiError(httpStatus.CONFLICT, "AllReady doctor is Favourite !!");
    }
    return FavouritesModel.create({ doctorId, patientId: patient._id });
};

const removeFavourite = async (user: any, payload: Favourites): Promise<Favourites> => {
    const patient = await requirePatient(user.userId);
    const doctorId = validDoctorId(payload);

    const removed = await FavouritesModel.findOneAndDelete({ doctorId, patientId: patient._id });
    if (!removed) {
        throw new ApiError(httpStatus.NOT_FOUND, "Doctor is not in Favourite !!");
    }
    return removed;
};

const getPatientFavourites = async (user: any): Promise<Favourites[]> => {
    const patient = await requirePatient(user.userId);
    return FavouritesModel.find({ patientId: patient._id }).populate("doctor") as any;
};

export const FavouritesService = {
    createFavourite,
    removeFavourite,
    getPatientFavourites,
};
