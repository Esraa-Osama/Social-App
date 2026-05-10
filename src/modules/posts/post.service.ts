import type { Request, Response, NextFunction } from "express";
import { successResponse } from "../../common/utils/response.success";
import { S3Service } from "../../common/services/s3.service";
import { APPError } from "../../common/utils/global-error-handler";
import PostRepository from "../../DB/repositories/post.repository";
import { ICreatePostType } from "./post.validation";
import UserRepository from "../../DB/repositories/user.repository";
import { Types } from "mongoose";
import notificationService from "../../common/services/notification.service";
import redisService from "../../common/services/redis.service";
import { randomUUID } from "node:crypto";

class PostService {
  private readonly _postModel = new PostRepository();
  private readonly _userModel = new UserRepository();
  private readonly _s3Service = new S3Service();
  private readonly _redisService = redisService;
  private readonly _notificationService = notificationService;
  constructor() {}

  createPost = async (req: Request, res: Response, next: NextFunction) => {
    const {
      content,
      attachments,
      tags,
      allowComment,
      availability,
    }: ICreatePostType = req.body;

    let mentions: Types.ObjectId[] = [];
    let fcmTokens: string[] = [];
    if (tags?.length) {
      const mentionsTags = await this._userModel.find({
        filter: { _id: { $in: tags } },
      });

      if (tags.length !== mentionsTags.length) {
        throw new APPError("invalid tag id");
      }

      for (const tag of mentionsTags) {
        mentions.push(tag._id);
        (await this._redisService.getFCMs(tag._id)).map((token) => {
          fcmTokens.push(token);
        });
      }
    }

    let urls: string[] = [];
    let folderId = randomUUID();
    if (req?.files) {
      urls = await this._s3Service.uploadFiles({
        path: `users/${req.user?._id}/posts/${folderId}`,
        files: req.files as Express.Multer.File[],
      });
    }
    const post = await this._postModel.create({
      content: content!,
      attachments: urls,
      createdBy: req.user?._id!,
      tags: mentions,
      folderId,
      allowComment,
      availability,
    });

    if (!post) {
      await this._s3Service.deleteFiles(urls);
      throw new APPError("failed to create post");
    }

    if (fcmTokens.length > 0) {
      await this._notificationService.sendNotifications({
        tokens: fcmTokens,
        data: {
          title: `you are mentioned in ${req.user?.userName}'s post`,
          body: content || "new post",
        },
      });
    }
    successResponse({ res, data: post });
  };
}

export default new PostService();
