import httpStatus from "http-status";
import bcrypt from "bcrypt";
import ApiError from "../../../errors/apiError";
import { Auth, Patient } from "../../../shared/models";
import { UserRole } from "../../../shared/enums";

export const create = async (payload: any): Promise<any> => {
    const { password, ...othersData } = payload || {};

    // role / identity fields are never taken from the sign-up form
    for (const key of Object.keys(othersData)) {
        if (key.startsWith("$") || key === "id" || key === "_id") delete othersData[key];
    }

    if (!password) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Password is required !!");
    }
    if (!othersData.email) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Email is required !!");
    }

    // check the e-mail first so nothing is created for a duplicate
    if (await Auth.findOne({ email: othersData.email })) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Email Already Exist !!");
    }

    let patient: any;
    try {
        patient = await Patient.create(othersData);
        const auth = await Auth.create({
            email: patient.email,
            password: await bcrypt.hash(password, 12),
            role: UserRole.patient,
            userId: patient._id,
        });
        return { patient, auth };
    } catch (error: any) {
        // undo the patient record (replaces the old transaction rollback)
        if (patient) await Patient.deleteOne({ _id: patient._id });
        throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }
};
