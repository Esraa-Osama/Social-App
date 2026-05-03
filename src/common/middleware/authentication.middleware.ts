//~ Assignment 17 ~//

import type { Request, Response, NextFunction } from "express";
import {
  JWT_ACCESS_SECRET_KEY_ADMIN,
  JWT_ACCESS_SECRET_KEY_USER,
  PREFIX_ADMIN,
  PREFIX_USER,
} from "../../config/config.service";
import tokenService from "../services/token.service";
import UserRepository from "../../DB/repositories/user.repository";
import { Types } from "mongoose";
import { JwtPayload } from "jsonwebtoken";
import redisService from "../services/redis.service";
import { APPError } from "../utils/global-error-handler";

const userModel = new UserRepository();

export const authentication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { authorization } = req.headers;
  if (!authorization) {
    throw new APPError(
      "token required, you must login to do this process",
      401,
    );
  }

  const [prefix, token]: string[] = authorization.split(" ");

  if (!token) {
    throw new APPError("token not found", 404);
  }

  let ACCESS_SECRET_KEY = "";
  if (prefix == PREFIX_USER) {
    ACCESS_SECRET_KEY = JWT_ACCESS_SECRET_KEY_USER;
  } else if (prefix == PREFIX_ADMIN) {
    ACCESS_SECRET_KEY = JWT_ACCESS_SECRET_KEY_ADMIN;
  } else {
    throw new APPError("invalid token prefix", 401);
  }

  const decoded = tokenService.verifyToken({
    token: token,
    secret_key: ACCESS_SECRET_KEY,
  }) as JwtPayload;

  if (!decoded || !decoded?.id) {
    throw new APPError("you are not allowed, invalid token", 401);
  }
  const user = await userModel.findOne({
    filter: { _id: new Types.ObjectId(decoded.id) },
  });
  if (!user) {
    throw new APPError("user not found", 404);
  }

  if (
    user?.changeCredential &&
    user?.changeCredential.getTime() > decoded.iat! * 1000
  ) {
    throw new APPError("invalid token", 404);
  }

  let revokeToken = await redisService.get(
    redisService.revokedKey({ userId: user._id, jti: decoded.jti! }),
  );
  if (revokeToken) {
    throw new APPError("token is already revoked", 404);
  }

  req.user = user;
  req.decoded = decoded;
  next();
};
