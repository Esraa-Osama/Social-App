//~ Assignment 19 ~//

import type { Request, Response, NextFunction } from "express";
import { successResponse } from "../../common/utils/response.success";
import { S3Service } from "../../common/services/s3.service";
import { APPError } from "../../common/utils/global-error-handler";
import CommentRepository from "../../DB/repositories/comment.repository";
import {
  ICreateCommentParamType,
  ICreateCommentType,
  ICreateReplyType,
} from "./comment.validation";
import UserRepository from "../../DB/repositories/user.repository";
import { Types } from "mongoose";
import notificationService from "../../common/services/notification.service";
import redisService from "../../common/services/redis.service";
import { randomUUID } from "node:crypto";
import PostRepository from "../../DB/repositories/post.repository";
import { postAvailability } from "../../common/utils/post.utils";
import { Allow_Comment_Enum } from "../../common/enum/post.enum";

class commentService {
  private readonly _commentModel = new CommentRepository();
  private readonly _postModel = new PostRepository();
  private readonly _userModel = new UserRepository();
  private readonly _s3Service = new S3Service();
  private readonly _redisService = redisService;
  private readonly _notificationService = notificationService;
  constructor() {}

  createComment = async (req: Request, res: Response, next: NextFunction) => {
    const { content, attachments, tags }: ICreateCommentType = req.body;
    const { postId } = req.params;

    const post = await this._postModel.findOne({
      filter: {
        _id: postId,
        ...postAvailability(req),
        allowComment: Allow_Comment_Enum.allow,
      },
    });

    if (!post) {
      throw new APPError(
        "post not found or you are not allowed to comment on this post",
      );
    }

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
        path: `users/${req.user?._id}/posts/${post.folderId}/comments/${folderId}`,
        files: req.files as Express.Multer.File[],
      });
    }
    const comment = await this._commentModel.create({
      content: content! || "",
      attachments: urls,
      createdBy: req.user?._id!,
      tags: mentions,
      folderId,
      postId: post._id,
    });

    if (!comment) {
      await this._s3Service.deleteFiles(urls);
      throw new APPError("failed to create comment");
    }

    if (fcmTokens.length > 0) {
      await this._notificationService.sendNotifications({
        tokens: fcmTokens,
        data: {
          title: `you are mentioned in ${req.user?.userName}'s comment`,
          body: content || "new mention",
        },
      });
    }
    successResponse({ res, data: comment });
  };

  createReply = async (req: Request, res: Response, next: NextFunction) => {
    const { content, attachments, tags }: ICreateReplyType = req.body;
    const { postId, commentId } = req.params;

    const post = await this._postModel.findOne({
      filter: {
        _id: postId,
        ...postAvailability(req),
        allowComment: Allow_Comment_Enum.allow,
      },
    });

    if (!post) {
      throw new APPError(
        "post not found or you are not allowed to comment on this post",
      );
    }

    const comment = await this._commentModel.findOne({
      filter: {
        _id: commentId,
        postId: postId!,
      },
    });

    if (!comment) {
      throw new APPError("comment not found");
    }

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
        path: `users/${req.user?._id}/posts/${post.folderId}/comments/${comment.folderId}/replies/${folderId}`,
        files: req.files as Express.Multer.File[],
      });
    }
    const reply = await this._commentModel.create({
      content: content! || "",
      attachments: urls,
      createdBy: req.user?._id!,
      tags: mentions,
      folderId,
      postId: post._id,
      commentId: comment._id,
    });

    if (!reply) {
      await this._s3Service.deleteFiles(urls);
      throw new APPError("failed to create reply");
    }

    if (fcmTokens.length > 0) {
      await this._notificationService.sendNotifications({
        tokens: fcmTokens,
        data: {
          title: `you are mentioned in ${req.user?.userName}'s reply`,
          body: content || "new mention",
        },
      });
    }
    successResponse({ res, data: reply });
  };
}

export default new commentService();
