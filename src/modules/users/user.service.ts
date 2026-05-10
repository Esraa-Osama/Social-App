//~ Assignment 18 ~//

import type { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import UserRepository from "../../DB/repositories/user.repository";
import { applyHash, compareHash } from "../../common/security/hash.security";
import { IUpdatePasswordType } from "./user.validation";
import { successResponse } from "../../common/utils/response.success";
import { S3Service } from "../../common/services/s3.service";
import { pipeline } from "node:stream/promises";

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

  upload = async (req: Request, res: Response, next: NextFunction) => {
    const { fileName, ContentType } = req.body;
    const { url, Key } = await this._s3Service.createPreSignedUrl({
      path: `users/${req.user?._id}`,
      fileName,
      ContentType,
    });

    await this._userModel.findOneAndUpdate({
      filter: { _id: req.user?._id },
      updates: { profilePicture: Key },
    });

    successResponse({
      res,
      data: { Key, url },
    });
  };

  getAndDownloadProfilePicture = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { path } = req.params as { path: string[] };
    const { download } = req.query;

    const Key = path.join("/");
    const result = await this._s3Service.getFile(Key);
    const stream = result.Body as NodeJS.ReadableStream;
    res.setHeader("Content-Type", result.ContentType!);
    if (download && download === "true") {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${path.pop()}"`,
      );
    }
    await pipeline(stream, res);
  };

  getProfilePicture = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { path } = req.params as { path: string[] };
    const { download } = req.query as { download: string };
    const Key = path.join("/");
    const url = await this._s3Service.getPreSignedUrl({
      Key,
      download: download ? download : undefined,
    });
    successResponse({ res, data: url });
  };

  getFiles = async (req: Request, res: Response, next: NextFunction) => {
    const { path } = req.query as { path: string };
    const { Contents } = await this._s3Service.getFiles(path);

    const urls = [];
    for (const content of Contents!) {
      urls.push({ Key: content.Key });
    }
    successResponse({ res, data: urls });
  };

  deleteFile = async (req: Request, res: Response, next: NextFunction) => {
    const { Key } = req.query as { Key: string };
    const result = await this._s3Service.deleteFile(Key);

    successResponse({ res, data: result });
  };

  deleteFiles = async (req: Request, res: Response, next: NextFunction) => {
    const { Keys } = req.body as { Keys: string[] };
    const result = await this._s3Service.deleteFiles(Keys);

    successResponse({ res, data: result });
  };

  deleteFolder = async (req: Request, res: Response, next: NextFunction) => {
    const { folderName } = req.query as { folderName: string };
    const result = await this._s3Service.deleteFolder(folderName);

    successResponse({ res, data: result });
  };
}

export default new UserService();
