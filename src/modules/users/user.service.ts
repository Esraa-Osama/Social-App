//~ Assignment 17 ~//

import type { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import UserRepository from "../../DB/repositories/user.repository";
import { applyHash, compareHash } from "../../common/security/hash.security";
import { IUpdatePasswordType } from "./user.validation";
import { successResponse } from "../../common/utils/response.success";
import { S3Service } from "../../common/services/s3.service";

class UserService {
  private readonly _userModel = new UserRepository();
  private readonly _s3Service = new S3Service();

  constructor() {}

  updatePassword = async (req: Request, res: Response, next: NextFunction) => {
    const { oldPassword, newPassword }: IUpdatePasswordType = req.body;

    if (
      !compareHash({ plainText: oldPassword, hashedText: req.user!.password! })
    ) {
      throw new Error("invalid old password");
    }

    const user = await this._userModel.findOneAndUpdate({
      filter: { _id: new Types.ObjectId(req.user!._id) },
      updates: {
        password: applyHash({ plainText: newPassword }),
        changeCredential: new Date(),
      },
    });
    if (!user) {
      throw new Error("user not found", { cause: 404 });
    }
    successResponse({
      res,
      message: "password updated successfully",
    });
  };

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    successResponse({
      res,
      data: { user: req.user },
    });
  };

  updateProfilePicture = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const key = await this._s3Service.uploadFile({
      file: req.file!,
      path: "users",
    });
    successResponse({
      res,
      data: key,
    });
  };

  updateBigProfilePicture = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const key = await this._s3Service.uploadLargeFile({
      file: req.file!,
      path: "users/large",
    });
    successResponse({
      res,
      data: key,
    });
  };

  updateCoverPictures = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const urls = await this._s3Service.uploadFiles({
      files: req.files as Express.Multer.File[],
      path: "user/covers",
    });
    successResponse({
      res,
      data: urls,
    });
  };
}

export default new UserService();
