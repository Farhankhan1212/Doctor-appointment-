import mongoose from "mongoose";
import { UserRole } from "../../../shared/enums";
import { Doctor as DoctorModel, Auth, UserVerfication } from "../../../shared/models";
import bcrypt from 'bcrypt';
import ApiError from "../../../errors/apiError";
import httpStatus from "http-status";
import { DoctorSearchableFields, IDoctorFilters } from "./doctor.interface";
import calculatePagination, { IOption } from "../../../shared/paginationHelper";
import { IGenericResponse } from "../../../interfaces/common";
import { Request } from "express";
import { IUpload } from "../../../interfaces/file";
import { CloudinaryHelper } from "../../../helpers/uploadHelper";
import moment from "moment";
import { EmailtTransporter } from "../../../helpers/emailTransporter";
import * as path from "path";
import config from "../../../config";
const { v4: uuidv4 } = require('uuid');

type Doctor = Record<string, any>;

// user input is never trusted as a regex or as a Mongo operator
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stripOperators = (obj: Record<string, any>) => {
    for (const k of Object.keys(obj)) {
        if (k.startsWith('$') || k === 'id' || k === '_id') delete obj[k];
    }
    return obj;
};

const sendVerificationEmail = async (data: Doctor) => {
    const currentUrl = process.env.NODE_ENV === 'production' ? config.backendLiveUrl : config.backendLocalUrl;
    const uniqueString = uuidv4() + data.id;
    const uniqueStringHashed = await bcrypt.hash(uniqueString, 12);
    const url = `${currentUrl}user/verify/${data.id}/${uniqueString}`
    const expiresDate = moment().add(6, 'hours')
    const verficationData = await UserVerfication.create({
        userId: data._id,
        expiresAt: expiresDate.toDate(),
        uniqueString: uniqueStringHashed
    })
    if (verficationData) {
        const pathName = path.join(__dirname, '../../../../template/verify.html',)
        const obj = { link: url };
        const subject = "Email Verification"
        const toMail = data.email;
        try {
            await EmailtTransporter({ pathName, replacementObj: obj, toMail, subject })
        } catch (err) {
            console.log(err);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Unable to send email !');
        }
    }
}

const create = async (payload: any): Promise<any> => {
    // approved / verified can never be set by the person signing up
    const { password, approved, verified, ...othersData } = payload;
    if (!password) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Password is required !");
    }
    const existEmail = await Auth.findOne({ email: othersData.email });
    if (existEmail) {
        throw new Error("Email Already Exist !!")
    }
    const doctor = await DoctorModel.create(stripOperators(othersData));
    try {
        await Auth.create({
            email: doctor.email,
            password: await bcrypt.hash(password, 12),
            role: UserRole.doctor,
            userId: doctor._id
        });
    } catch (error) {
        // undo the doctor record (replaces the old transaction rollback)
        await DoctorModel.deleteOne({ _id: doctor._id });
        throw error;
    }

    if (doctor.id) {
        await sendVerificationEmail(doctor)
    }
    return doctor;
}

const getAllDoctors = async (filters: IDoctorFilters, options: IOption, includeUnapproved = false): Promise<IGenericResponse<Doctor[]>> => {
    const { limit, page, skip } = calculatePagination(options);
    const { searchTerm, max, min, specialist, ...filterData } = filters;

    const andCondition: any[] = [];
    // public list shows only admin-approved doctors
    if (!includeUnapproved) {
        andCondition.push({ approved: true });
    }
    if (searchTerm) {
        const rx = new RegExp(escapeRegex(String(searchTerm)), 'i');
        andCondition.push({
            $or: DoctorSearchableFields.map((field: string) => ({ [field]: rx }))
        })
    }

    // exact-match filters, only for real Doctor fields and plain values
    for (const [key, value] of Object.entries(filterData)) {
        if (!DoctorModel.schema.path(key)) continue;
        if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') continue;
        andCondition.push({ [key]: value });
    }

    // price is stored as text, so compare it as a number
    const bounds: any[] = [];
    const priceNum = { $convert: { input: '$price', to: 'double', onError: 0, onNull: 0 } };
    if (min && !Number.isNaN(Number(min))) bounds.push({ $gte: [priceNum, Number(min)] });
    if (max && !Number.isNaN(Number(max))) bounds.push({ $lte: [priceNum, Number(max)] });
    if (bounds.length) {
        andCondition.push({ $expr: { $and: bounds } });
    }

    if (specialist) {
        // match the doctor's speciality (e.g. "Dentist", "Cardiologist") or the services they list
        const rx = new RegExp(escapeRegex(String(specialist)), 'i');
        andCondition.push({
            $or: [{ specialization: rx }, { services: rx }]
        })
    }

    const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

    const [result, total] = await Promise.all([
        DoctorModel.find(whereCondition)
            // admin list: pending doctors first, then newest
            .sort(includeUnapproved ? { approved: 1, createdAt: -1 } : { createdAt: 1 })
            .skip(skip)
            .limit(limit)
            // real rating numbers for the doctor cards (doctorId is needed to link the reviews)
            .populate({ path: 'reviews', select: 'star isRecommended doctorId' })
            .exec(),
        DoctorModel.countDocuments(whereCondition).exec(),
    ]);

    return {
        meta: {
            page,
            limit,
            total,
        },
        data: result
    }
}

const getDoctor = async (id: string): Promise<Doctor | null> => {
    if (!mongoose.isValidObjectId(id)) return null;
    const result = await DoctorModel.findById(id);
    return result;
}

const deleteDoctor = async (id: string): Promise<any> => {
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Doctor not found !");
    }
    const doctor = await DoctorModel.findByIdAndDelete(id);
    if (!doctor) {
        throw new ApiError(httpStatus.NOT_FOUND, "Doctor not found !");
    }
    await Auth.deleteOne({ email: doctor.email });
    return doctor;
}

const updateDoctor = async (req: Request): Promise<Doctor> => {
    const file = req.file as IUpload;
    const id = req.params.id as string;
    const user = JSON.parse(req.body.data);
    // a doctor must never approve or verify themselves
    delete user.approved;
    delete user.verified;
    stripOperators(user);

    if (file) {
        const uploadImage = await CloudinaryHelper.uploadFile(file);
        if (uploadImage) {
            user.img = uploadImage.secure_url
        } else {
            throw new ApiError(httpStatus.EXPECTATION_FAILED, 'Failed to Upload Image');
        }
    }
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Doctor not found !");
    }
    const result = await DoctorModel.findByIdAndUpdate(id, user, { new: true, runValidators: true });
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Doctor not found !");
    }
    return result;
}

const setApproval = async (id: string, approved: boolean): Promise<Doctor> => {
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(httpStatus.NOT_FOUND, "Doctor not found !");
    }
    const result = await DoctorModel.findByIdAndUpdate(id, { approved }, { new: true });
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Doctor not found !");
    }
    return result;
}

export const DoctorService = {
    setApproval,
    create,
    updateDoctor,
    deleteDoctor,
    getAllDoctors,
    getDoctor
}