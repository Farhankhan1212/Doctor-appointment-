import mongoose from "mongoose";
import { Patient as PatientModel, Auth } from "../../../shared/models";
import { create } from "./patientService";
import { IUpload } from "../../../interfaces/file";
import { Request } from "express";
import { CloudinaryHelper } from "../../../helpers/uploadHelper";
import ApiError from "../../../errors/apiError";
import httpStatus from "http-status";

type Patient = Record<string, any>;

const createPatient = async (payload: any): Promise<any> => {
    const result = await create(payload)
    return result;
}

const getAllPatients = async (): Promise<Patient[] | null> => {
    const result = await PatientModel.find();
    return result;
}

const getPatient = async (id: string): Promise<Patient | null> => {
    if (!mongoose.isValidObjectId(id)) return null;
    const result = await PatientModel.findById(id);
    return result;
}

const deletePatient = async (id: string): Promise<any> => {
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Patient not found !");
    }
    const patient = await PatientModel.findByIdAndDelete(id);
    if (!patient) {
        throw new ApiError(httpStatus.NOT_FOUND, "Patient not found !");
    }
    await Auth.deleteOne({ email: patient.email });
    return patient;
}

const updatePatient = async (req: Request): Promise<Patient | null> => {
    const file = req.file as IUpload;
    const id = req.params.id as string;
    const user = JSON.parse(req.body.data)
    // never let user input carry Mongo operators or ids
    for (const k of Object.keys(user)) {
        if (k.startsWith('$') || k === 'id' || k === '_id') delete user[k];
    }
    if (file) {
        const uploadImage = await CloudinaryHelper.uploadFile(file);
        if (uploadImage) {
            user.img = uploadImage.secure_url
        } else {
            throw new ApiError(httpStatus.EXPECTATION_FAILED, 'Failed to updateImage !!')
        }
    }
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Patient not found !");
    }
    const result = await PatientModel.findByIdAndUpdate(id, user, { new: true, runValidators: true });
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Patient not found !");
    }
    return result;
}

export const PatientService = {
    createPatient,
    updatePatient,
    getPatient,
    getAllPatients,
    deletePatient
}