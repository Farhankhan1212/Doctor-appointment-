import { Request, Response } from "express";
import mongoose from "mongoose";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AuthService } from "./auth.service";
import config from "../../../config";
import path from 'path';
import { Doctor, UserVerfication } from "../../../shared/models";
import ApiError from "../../../errors/apiError";
import httpStatus from "http-status";
import moment from "moment";

const Login = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.loginUser(req.body);
    const { accessToken } = result;

    const cookieOptions = {
        secure: config.env === 'production',
        httpOnly: true
    }
    res.cookie('accessToken', accessToken, cookieOptions)
    sendResponse(res, {
        statusCode: 200,
        message: 'Successfully Logged !!',
        success: true,
        data: result,
    })
})
const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.resetPassword(req.body);
    sendResponse(res, {
        statusCode: 200,
        message: 'Successfully Passwrod Reset!!',
        success: true,
        data: result,
    })
})

const PasswordResetConfirm = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.PassworResetConfirm(req.body);
    sendResponse(res, {
        statusCode: 200,
        message: 'Successfully Passwrod Changed!!',
        success: true,
        data: result,
    })
})

const VerifyUser = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(httpStatus.NOT_FOUND, "User is not found !!");
    }
    const isUserExist = await Doctor.findById(userId);
    if (!isUserExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "User is not found !!");
    }
    const getVerficationUser = await UserVerfication.findOne({ userId: userId });
    if (getVerficationUser) {
        const expiresAt = moment(getVerficationUser.expiresAt);
        const currentTime = moment();
        const isWithinNext6Hours = currentTime.isBefore(expiresAt);

        if (isWithinNext6Hours) {
            await Doctor.updateOne({ _id: isUserExist._id }, { verified: true });
            await UserVerfication.deleteOne({ _id: getVerficationUser._id });
            res.redirect('/api/v1/auth/verified');
        } else {
            res.redirect('/api/v1/auth/expired/link');
        }
    } else {
        res.redirect(isUserExist.verified ? '/api/v1/auth/verified' : '/api/v1/auth/expired/link');
    }
})

const Verified = catchAsync(async (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../../../../template/verfied.html"))
})

const VerficationExpired = catchAsync(async (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../../../../template/expiredVarification.html"))
})

export const AuthController = {
    Login,
    VerifyUser,
    Verified,
    VerficationExpired,
    resetPassword,
    PasswordResetConfirm
}
