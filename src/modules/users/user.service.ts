//~ Assignment 20 ~//

import type { Request, Response, NextFunction } from "express";
import { HydratedDocument, Types } from "mongoose";
import UserRepository from "../../DB/repositories/user.repository";
import { applyHash, compareHash } from "../../common/security/hash.security";
import { IUpdatePasswordType, IUpdateProfileType } from "./user.validation";
import { successResponse } from "../../common/utils/response.success";
import { S3Service } from "../../common/services/s3.service";
import { IUser } from "../../DB/models/user.model";
import { encrypt } from "../../common/security/encrypt.security";
import redisService from "../../common/services/redis.service";
import { APPError } from "../../common/utils/global-error-handler";
import PostRepository from "../../DB/repositories/post.repository";
import CommentRepository from "../../DB/repositories/comment.repository";

class UserService {
  private readonly _userModel = new UserRepository();
  private readonly _postModel = new PostRepository();
  private readonly _commentModel = new CommentRepository();
  private readonly _s3Service = new S3Service();
  private readonly _redisService = redisService;

  constructor() {}

  updatePassword = async (req: Request, res: Response, next: NextFunction) => {
    const { oldPassword, newPassword }: IUpdatePasswordType = req.body;

    if (
      !compareHash({ plainText: oldPassword, hashedText: req.user!.password! })
    ) {
      throw new APPError("invalid old password");
    }

    const user = await this._userModel.findOneAndUpdate({
      filter: { _id: new Types.ObjectId(req.user!._id), paranoid: true },
      updates: {
        password: applyHash({ plainText: newPassword }),
        changeCredential: new Date(),
      },
    });
    if (!user) {
      throw new APPError("user not found", 404);
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

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    let { userName, age, phone, address, gender }: IUpdateProfileType =
      req.body;

    const user: HydratedDocument<IUser> | null =
      await this._userModel.findOneAndUpdate({
        filter: {
          _id: req.user?._id,
          paranoid: true,
        },
        updates: {
          userName: userName
            ? userName
            : `${req.user?.firstName} ${req.user?.lastName}`,
          age: age ? age : req.user?.age,
          phone: phone ? encrypt(phone) : req.user?.phone,
          address: address ? address : req.user?.address,
          gender: gender ? gender : req.user?.gender,
        },
      });

    if (!user) {
      throw new APPError("failed to update profile");
    }

    successResponse({
      res,
      status: 201,
      message: "profile updated successfully",
    });
  };

  updateProfilePicture = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const key = this._s3Service.uploadFile({
      file: req.file!,
      path: `users/${req.user?._id}/profile`,
    });

    const profilePicture = await this._userModel.findOneAndUpdate({
      filter: {
        _id: req.user?._id,
        paranoid: true,
      },
      updates: {
        profilePicture: key,
      },
    });

    if (!profilePicture) {
      throw new APPError("failed to update profile picture");
    }
    successResponse({ res, message: "profile picture updated successfully" });
  };

  updateCoverPictures = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const urls = this._s3Service.uploadFiles({
      files: req.files as Express.Multer.File[],
      path: `users/${req.user?._id}/cover`,
    });

    const coverPictures = await this._userModel.findOneAndUpdate({
      filter: {
        _id: req.user?._id,
        paranoid: true,
      },
      updates: {
        coverPictures: urls,
      },
    });

    if (!coverPictures) {
      throw new APPError("failed to update cover pictures");
    }
    successResponse({ res, message: "cover pictures updated successfully" });
  };

  deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
    const deleteUser = await this._userModel.findOneAndUpdate({
      filter: {
        _id: req.user?._id,
        paranoid: true,
      },
      updates: {
        deletedAt: Date.now(),
      },
    });

    if (!deleteUser) {
      throw new APPError("failed to delete account");
    }

    const deletePosts = await this._postModel.updateMany({
      filter: { createdBy: req.user?._id! },
      updates: {
        deletedAt: Date.now(),
      },
    });

    if (!deletePosts) {
      throw new APPError("failed to delete user posts");
    }

    const deleteCommentsAndReplies = await this._commentModel.updateMany({
      filter: { createdBy: req.user?._id! },
      updates: {
        deletedAt: Date.now(),
      },
    });

    if (!deleteCommentsAndReplies) {
      throw new APPError("failed to delete user comments and replies");
    }

    successResponse({ res, message: "account deleted successfully" });
  };
}

export default new UserService();
