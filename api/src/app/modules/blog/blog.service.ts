import mongoose from "mongoose";
import httpStatus from "http-status";
import { Request } from "express";
import ApiError from "../../../errors/apiError";
import { Blogs as BlogModel, Doctor as DoctorModel } from "../../../shared/models";
import { Blogs } from "../../../shared/types";
import { IBlogFilters, blogSearchablFields } from "./blog.interface";
import calculatePagination, { IOption } from "../../../shared/paginationHelper";
import { IGenericResponse } from "../../../interfaces/common";
import { IUpload } from "../../../interfaces/file";
import { CloudinaryHelper } from "../../../helpers/uploadHelper";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isId = (id: any) => typeof id === "string" && mongoose.isValidObjectId(id);
const AUTHOR = { path: "user", select: "firstName lastName designation" };

const withUpload = async (file: IUpload | undefined, data: Record<string, any>) => {
    if (!file) return;
    const uploadImage = await CloudinaryHelper.uploadFile(file);
    if (!uploadImage) {
        throw new ApiError(httpStatus.EXPECTATION_FAILED, "Failed to Updated Image");
    }
    data.img = uploadImage.secure_url;
};

const stripIdentity = (data: Record<string, any>) => {
    for (const key of Object.keys(data)) {
        if (key.startsWith("$") || key === "id" || key === "_id") delete data[key];
    }
    return data;
};

const createBlog = async (req: Request): Promise<Blogs> => {
    const user = req.user as any;
    const data = stripIdentity(JSON.parse(req.body.data));

    const doctor = isId(user.userId) ? await DoctorModel.findById(user.userId) : null;
    if (!doctor) {
        throw new ApiError(httpStatus.NOT_FOUND, "Doctor Account is not found !!");
    }
    data.userId = doctor._id;
    await withUpload(req.file as IUpload, data);

    return BlogModel.create(data);
};

const getAllBlogs = async (filters: IBlogFilters, options: IOption): Promise<IGenericResponse<Blogs[]>> => {
    const { limit, page, skip } = calculatePagination(options);
    const { searchTerm, ...filterData } = filters;

    const and: any[] = [];
    if (searchTerm) {
        const rx = new RegExp(escapeRegex(String(searchTerm)), "i");
        and.push({ $or: blogSearchablFields.map((field) => ({ [field]: rx })) });
    }
    for (const [key, value] of Object.entries(filterData)) {
        if (!BlogModel.schema.path(key)) continue;
        if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") continue;
        and.push({ [key]: value });
    }
    const where = and.length ? { $and: and } : {};

    const sort: any =
        options.sortBy && options.sortOrder
            ? { [options.sortBy]: options.sortOrder === "asc" ? 1 : -1 }
            : { createdAt: -1 };

    const [result, total] = await Promise.all([
        BlogModel.find(where).sort(sort).skip(skip).limit(limit).populate(AUTHOR),
        BlogModel.countDocuments(where),
    ]);

    return { meta: { page, limit, total }, data: result as any };
};

const getBlog = async (id: string): Promise<Blogs | null> => {
    if (!isId(id)) return null;
    return BlogModel.findById(id).populate(AUTHOR) as any;
};

const deleteBlog = async (id: string): Promise<Blogs | null> => {
    const result = isId(id) ? await BlogModel.findByIdAndDelete(id) : null;
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Blog not found !!");
    }
    return result as any;
};

const updateBlog = async (req: Request): Promise<Blogs | null> => {
    const id = req.params.id as string;
    const blogData = stripIdentity(JSON.parse(req.body.data));
    delete blogData.userId;
    await withUpload(req.file as IUpload, blogData);

    const result = isId(id)
        ? await BlogModel.findByIdAndUpdate(id, blogData, { new: true, runValidators: true })
        : null;
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Blog not found !!");
    }
    return result as any;
};

export const BlogService = {
    createBlog,
    getAllBlogs,
    getBlog,
    deleteBlog,
    updateBlog,
};
