import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { Auth, Doctor, ForgotPassword } from '../../../shared/models';
import ApiError from '../../../errors/apiError';
import httpStatus from 'http-status';
import { JwtHelper } from '../../../helpers/jwtHelper';
import config from '../../../config';
import { Secret } from 'jsonwebtoken';
import moment from 'moment';
import { EmailtTransporter } from '../../../helpers/emailTransporter';
const { v4: uuidv4 } = require('uuid');
import * as path from 'path';

type ILginResponse = {
    accessToken?: string;
    user: {}
}

const loginUser = async (user: any): Promise<ILginResponse> => {
    const { email: IEmail, password } = user;
    const isUserExist = await Auth.findOne({ email: IEmail });

    if (!isUserExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "User is not Exist !");
    }
    // check Verified doctor or not
    if (isUserExist.role === 'doctor') {
        const getDoctorInfo = await Doctor.findOne({ email: isUserExist.email });
        if (getDoctorInfo && getDoctorInfo.verified === false) {
            throw new ApiError(httpStatus.NOT_FOUND, "Please Verify Your Email First !");
        }
    }
    const isPasswordMatched = await bcrypt.compare(password, isUserExist.password);

    if (!isPasswordMatched) {
        throw new ApiError(httpStatus.NOT_FOUND, "Password is not Matched !");
    }
    const role = isUserExist.role;
    const userId = isUserExist.userId?.toString();
    const accessToken = JwtHelper.createToken(
        { role, userId },
        config.jwt.secret as Secret,
        config.jwt.JWT_EXPIRES_IN as string
    )
    return { accessToken, user: { role, userId } }
}

const VerificationUser = async (user: any): Promise<ILginResponse> => {
    const { email: IEmail, password } = user;
    const isUserExist = await Auth.findOne({ email: IEmail });

    if (!isUserExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "User is not Exist !");
    }
    const isPasswordMatched = await bcrypt.compare(password, isUserExist.password);

    if (!isPasswordMatched) {
        throw new ApiError(httpStatus.NOT_FOUND, "Password is not Matched !");
    }
    const role = isUserExist.role;
    const userId = isUserExist.userId?.toString();
    const accessToken = JwtHelper.createToken(
        { role, userId },
        config.jwt.secret as Secret,
        config.jwt.JWT_EXPIRES_IN as string
    )
    return { accessToken, user: { role, userId } }
}

const resetPassword = async (payload: any): Promise<{ message: string }> => {
    const { email } = payload;
    const isUserExist = await Auth.findOne({ email: email });
    if (!isUserExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "User is not Exist !");
    }
    const clientUrl = `${config.clientUrl}/reset-password/`
    const uniqueString = uuidv4() + isUserExist.id;
    const uniqueStringHashed = await bcrypt.hash(uniqueString, 12);
    const encodedUniqueStringHashed = uniqueStringHashed.replace(/\//g, '-');

    const resetLink = clientUrl + isUserExist.id + '/' + encodedUniqueStringHashed;
    const expiresTime = moment().add(4, 'hours');

    // remove any older reset request of this user
    await ForgotPassword.deleteMany({ userId: isUserExist._id });

    const forgotPassword = await ForgotPassword.create({
        userId: isUserExist._id,
        expiresAt: expiresTime.toDate(),
        uniqueString: resetLink
    });

    const pathName = path.join(__dirname, '../../../../template/resetPassword.html')
    const obj = {
        link: resetLink
    };
    const subject = "Request to Reset Password";
    const toMail = isUserExist.email;
    try {
        await EmailtTransporter({ pathName, replacementObj: obj, toMail, subject })
    } catch (error) {
        console.log("Error reset password email", error);
        // email failed: undo the saved request
        await ForgotPassword.deleteOne({ _id: forgotPassword._id });
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Unable to send reset email!")
    }

    return {
        message: "Password Reset Successfully !!"
    };
}

const PassworResetConfirm = async (payload: any): Promise<any> => {
    const { userId, uniqueString, password } = payload;

    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "User is not Exist !");
    }
    const isUserExist = await Auth.findById(userId);
    if (!isUserExist) { throw new ApiError(httpStatus.NOT_FOUND, "User is not Exist !") };

    const resetLink = `${config.clientUrl}/reset-password/${isUserExist.id}/${uniqueString}`
    const getForgotRequest = await ForgotPassword.findOne({
        userId: userId,
        uniqueString: resetLink
    });
    if (!getForgotRequest) { throw new ApiError(httpStatus.NOT_FOUND, "Forgot Request was not found or Invalid !") };

    const expiresAt = moment(getForgotRequest.expiresAt);
    if (expiresAt.isBefore(moment())) {
        throw new ApiError(httpStatus.NOT_FOUND, "Forgot Request has been expired !")
    }
    if (!password) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Password is required !")
    }

    await Auth.updateOne({ _id: userId }, { password: await bcrypt.hash(password, 12) });
    await ForgotPassword.deleteOne({ _id: getForgotRequest._id });

    return {
        message: "Password Changed Successfully !!"
    }
}

export const AuthService = {
    loginUser,
    VerificationUser,
    resetPassword,
    PassworResetConfirm
}