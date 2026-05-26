//~ Assignment 20 ~//

import type { Request, Response, NextFunction } from "express";
import { successResponse } from "../../common/utils/response.success";
import { S3Service } from "../../common/services/s3.service";
import { APPError } from "../../common/utils/global-error-handler";
import PostRepository from "../../DB/repositories/post.repository";
import { ICreatePostType, IUpdatePostType } from "./post.validation";
import UserRepository from "../../DB/repositories/user.repository";
import { Types } from "mongoose";
import notificationService from "../../common/services/notification.service";
import redisService from "../../common/services/redis.service";
import { randomUUID } from "node:crypto";
import { Like_Post_Enum, On_Model_Enum } from "../../common/enum/post.enum";
import { postAvailability } from "../../common/utils/post.utils";
import CommentRepository from "../../DB/repositories/comment.repository";

class PostService {
  private readonly _postModel = new PostRepository();
  private readonly _userModel = new UserRepository();
  private readonly _commentModel = new CommentRepository();
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
        filter: { _id: { $in: tags }, paranoid: true },
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
      content: content! || "",
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

  getPost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params;

    const post = await this._postModel.findOne({
      filter: { _id: postId, ...postAvailability(req) },
    });

    if (!post) {
      throw new APPError("post not found");
    }

    successResponse({ res, data: post });
  };

  getPosts = async (req: Request, res: Response, next: NextFunction) => {
    const posts = await this._postModel.paginate({
      page: +req.query?.page!,
      limit: +req.query?.limit!,
      search: {
        ...postAvailability(req),
        ...(req.query?.search
          ? {
              content: { $regex: req.query?.search, $options: "i" },
            }
          : {}),
      },
      populate: {
        path: "comments",
        match: { commentId: { $exists: false } },
        populate: { path: "replies" },
      },
    });

    successResponse({ res, data: posts });
  };

  likeAndDislikePost = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { postId } = req.params;
    const { flag } = req.query;

    let updateQuery: any = { $addToSet: { likes: req.user?._id } };

    if (flag && flag === Like_Post_Enum.disLike) {
      updateQuery = { $pull: { likes: req.user?._id } };
    }

    const likeAndDislikePost = await this._postModel.findOneAndUpdate({
      filter: {
        _id: postId,
        ...postAvailability(req),
      },
      updates: updateQuery,
    });

    if (!likeAndDislikePost) {
      throw new APPError("post not found or not authorized");
    }

    successResponse({ res, data: likeAndDislikePost });
  };

  updatePost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params;

    const {
      content,
      attachments,
      removeAttachments,
      tags,
      removeTags,
      allowComment,
      availability,
    }: IUpdatePostType = req.body;

    const post = await this._postModel.findOne({
      filter: { _id: postId, createdBy: req.user?._id! },
    });

    if (!post) {
      throw new APPError("post not found or not authorized");
    }

    if (removeAttachments?.length) {
      const invalidFiles = removeAttachments.filter((file: string) => {
        return !post.attachments?.includes(file);
      });

      if (invalidFiles.length) {
        throw new APPError("some files you try to remove already don't exist");
      }

      await this._s3Service.deleteFiles(removeAttachments);
      post.attachments = post.attachments?.filter((attachment: string) => {
        return !removeAttachments.includes(attachment);
      }) as string[];
    }

    const updateTags = new Set(
      post?.tags?.map((tag) => {
        return tag.toString();
      }),
    );

    removeTags?.forEach((tag: string) => {
      return updateTags.delete(tag);
    });

    let fcmTokens: string[] = [];
    if (tags?.length) {
      const mentionsTags = await this._userModel.find({
        filter: { _id: { $in: tags }, paranoid: true },
      });

      if (tags.length !== mentionsTags.length) {
        throw new APPError("invalid tag id");
      }

      for (const tag of mentionsTags) {
        updateTags.add(tag._id.toString());
        (await this._redisService.getFCMs(tag._id)).map((token) => {
          fcmTokens.push(token);
        });
      }
      post.tags = [...updateTags].map((tag: string) => {
        return new Types.ObjectId(tag);
      });
    }

    if (req?.files) {
      let urls: string[] = await this._s3Service.uploadFiles({
        path: `users/${req.user?._id}/posts/${post.folderId}`,
        files: req.files as Express.Multer.File[],
      });
      post.attachments?.push(...urls);
    }

    if (content) {
      post.content = content;
    }
    if (allowComment) {
      post.allowComment = allowComment;
    }
    if (availability) {
      post.availability = availability;
    }

    await post.save();

    if (fcmTokens.length > 0) {
      await this._notificationService.sendNotifications({
        tokens: fcmTokens,
        data: {
          title: `you are mentioned in ${req.user?.userName}'s post`,
          body: content || "post updated",
        },
      });
    }

    successResponse({ res, data: post });
  };

  deletePost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params;

    const deletedPost = await this._postModel.findOneAndUpdate({
      filter: { _id: postId, ...postAvailability(req), paranoid: true },
      updates: {
        deletedAt: Date.now(),
      },
    });

    if (!deletedPost) {
      throw new APPError("post not found or not authorized");
    }

    const comments = await this._commentModel.find({
      filter: { refId: postId!, onModel: On_Model_Enum.post, paranoid: true },
    });

    if (!comments.length) {
      throw new APPError("no comments found");
    }

    const deletedCommentsAndReplies = await this._commentModel.updateMany({
      filter: {
        $or: [
          { refId: postId!, onModel: On_Model_Enum.post },
          {
            refId: {
              $in: comments.map((c) => {
                return c._id;
              }),
            },
            onModel: On_Model_Enum.comment,
          },
        ],
      },
      updates: {
        deletedAt: Date.now(),
      },
    });

    if (deletedCommentsAndReplies.modifiedCount == 0) {
      throw new APPError("failed to delete post comments and replies");
    }

    successResponse({ res, data: "post deleted successfully" });
  };
}

export default new PostService();
