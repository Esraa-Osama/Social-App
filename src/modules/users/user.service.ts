//~ Assignment 16 ~//

import type { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import UserRepository from "../../DB/repositories/user.repository";
import { applyHash, compareHash } from "../../common/security/hash.security";
import { IUpdatePasswordType } from "./user.validation";
import { successResponse } from "../../common/utils/response.success";

class UserService {
  private readonly _userModel = new UserRepository();
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
}

export default new UserService();
