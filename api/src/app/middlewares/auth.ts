import { NextFunction, Request, Response } from "express";
import ApiError from "../../errors/apiError";
import { JwtHelper } from "../../helpers/jwtHelper";
import config from "../../config";
import { Secret } from "jsonwebtoken";

export const auth = (...rules: string[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            throw new ApiError(401, "Authentication token is required");
        }

        let verifiedUser;
        try {
            verifiedUser = await JwtHelper.verifyToken(token, config.jwt.secret as Secret);
        } catch (error) {
            throw new ApiError(401, "Invalid or expired authentication token");
        }

        req.user = verifiedUser;

        if (rules.length && !rules.includes(verifiedUser.role)) {
            throw new ApiError(403, "You are not authorised to access this resource");
        }

        return next();
    } catch (error) {
        return next(error);
    }
};
