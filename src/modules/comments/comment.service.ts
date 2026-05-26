//~ Assignment 20 ~//

import type { Request, Response, NextFunction } from "express";
import { successResponse } from "../../common/utils/response.success";
import { S3Service } from "../../common/services/s3.service";
import { APPError } from "../../common/utils/global-error-handler";
import CommentRepository from "../../DB/repositories/comment.repository";
import {
  ICreateCommentOrReplyType,
  IUpdateCommentOrReplyType,
} from "./comment.validation";
import UserRepository from "../../DB/repositories/user.repository";
import { HydratedDocument, Types } from "mongoose";
import notificationService from "../../common/services/notification.service";
import redisService from "../../common/services/redis.service";
import { randomUUID } from "node:crypto";
import PostRepository from "../../DB/repositories/post.repository";
import { postAvailability } from "../../common/utils/post.utils";
import {
  Allow_Comment_Enum,
  Like_Post_Enum,
  On_Model_Enum,
} from "../../common/enum/post.enum";
import { IPost } from "../../DB/models/post.model";
import { IComment } from "../../DB/models/comment.model";

class commentService {
  private readonly _commentModel = new CommentRepository();
  private readonly _postModel = new PostRepository();
  private readonly _userModel = new UserRepository();
  private readonly _s3Service = new S3Service();
  private readonly _redisService = redisService;
  private readonly _notificationService = notificationService;
  constructor() {}

  createCommentOrReply = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { content, attachments, tags, onModel }: ICreateCommentOrReplyType =
      req.body;
    const { postId, commentId } = req.params;
    let postDoc: HydratedDocument<IPost> | null = null;
    let commentDoc: HydratedDocument<IComment> | null = null;

    if (onModel == On_Model_Enum.post && !commentId) {
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
      postDoc = post;
    } else if (onModel == On_Model_Enum.comment && commentId) {
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
      postDoc = post;

      const comment = await this._commentModel.findOne({
        filter: {
          _id: commentId,
          refId: postId!,
        },
      });

      if (!comment) {
        throw new APPError("comment not found");
      }
      commentDoc = comment;
    }

    if (
      (onModel === On_Model_Enum.post && !postDoc) ||
      (onModel === On_Model_Enum.comment && (!postDoc || !commentDoc))
    ) {
      throw new APPError("invalid onModel value");
    }
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
        path: On_Model_Enum.post
          ? `users/${req.user?._id}/posts/${postDoc?.folderId}/comments/${folderId}`
          : `users/${req.user?._id}/posts/${postDoc?.folderId}/comments/${commentDoc?.folderId}/replies/${folderId}`,
        files: req.files as Express.Multer.File[],
      });
    }
    const commentOrReply = await this._commentModel.create({
      content: content! || "",
      attachments: urls,
      createdBy: req.user?._id!,
      tags: mentions,
      folderId,
      refId: onModel == On_Model_Enum.post ? postDoc?._id! : commentDoc?._id!,
      onModel,
    });

    if (!commentOrReply) {
      await this._s3Service.deleteFiles(urls);
      throw new APPError(
        `failed to create ${On_Model_Enum.post ? On_Model_Enum.post : On_Model_Enum.comment}`,
      );
    }

    if (fcmTokens.length > 0) {
      await this._notificationService.sendNotifications({
        tokens: fcmTokens,
        data: {
          title: `you are mentioned in ${req.user?.userName}'s ${On_Model_Enum.post ? On_Model_Enum.post : On_Model_Enum.comment}`,
          body: content || "new mention",
        },
      });
    }
    successResponse({ res, data: commentOrReply });
  };

  getCommentOrReply = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { postId, commentId, replyId } = req.params;

    if (postId && commentId && !replyId) {
      const comment = await this._commentModel.findOne({
        filter: { _id: commentId, refId: postId! },
      });

      if (!comment) {
        throw new APPError("comment not found");
      }

      successResponse({ res, data: comment });
    } else if (!postId && commentId && replyId) {
      const reply = await this._commentModel.findOne({
        filter: { _id: replyId, refId: commentId! },
      });

      if (!reply) {
        throw new APPError("reply not found");
      }

      successResponse({ res, data: reply });
    }
  };

  getCommentsOrReplies = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { postId, commentId } = req.params;

    if (postId && !commentId) {
      const comments = await this._commentModel.paginate({
        page: +req.query?.page!,
        limit: +req.query?.limit!,
        search: {
          ...(req.query?.search
            ? {
                content: { $regex: req.query?.search, $options: "i" },
              }
            : {}),
        },
        populate: {
          path: "replies",
        },
      });

      successResponse({ res, data: comments });
    } else if (postId && commentId) {
      const replies = await this._commentModel.paginate({
        page: +req.query?.page!,
        limit: +req.query?.limit!,
        search: {
          ...(req.query?.search
            ? {
                content: { $regex: req.query?.search, $options: "i" },
              }
            : {}),
        },
      });

      successResponse({ res, data: replies });
    }
  };

  updateCommentOrReply = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { postId, commentId, replyId } = req.params;

    const {
      content,
      attachments,
      removeAttachments,
      tags,
      removeTags,
    }: IUpdateCommentOrReplyType = req.body;

    const post = await this._postModel.findOne({
      filter: { _id: postId, ...postAvailability(req) },
    });

    if (!post) {
      throw new APPError("post not found or not authorized");
    }

    const comment = await this._commentModel.findOne({
      filter: { _id: commentId, refId: postId!, createdBy: req.user?._id! },
    });

    if (!comment) {
      throw new APPError("comment not found or not authorized");
    }

    if (postId && commentId && !replyId) {
      if (removeAttachments?.length) {
        const invalidFiles = removeAttachments.filter((file: string) => {
          return !comment.attachments?.includes(file);
        });

        if (invalidFiles.length) {
          throw new APPError(
            "some files you try to remove already don't exist",
          );
        }

        await this._s3Service.deleteFiles(removeAttachments);
        comment.attachments = comment.attachments?.filter(
          (attachment: string) => {
            return !removeAttachments.includes(attachment);
          },
        ) as string[];
      }

      const updateTags = new Set(
        comment?.tags?.map((tag) => {
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
        comment.tags = [...updateTags].map((tag: string) => {
          return new Types.ObjectId(tag);
        });
      }

      if (req?.files) {
        let urls: string[] = await this._s3Service.uploadFiles({
          path: `users/${req.user?._id}/posts/${post.folderId}/comments/${comment.folderId}`,
          files: req.files as Express.Multer.File[],
        });
        comment.attachments?.push(...urls);
      }

      if (content) {
        comment.content = content;
      }

      await comment.save();

      if (fcmTokens.length > 0) {
        await this._notificationService.sendNotifications({
          tokens: fcmTokens,
          data: {
            title: `you are mentioned in ${req.user?.userName}'s comment`,
            body: content || "comment updated",
          },
        });
      }

      successResponse({ res, data: comment });
    } else if (postId && commentId && replyId) {
      const reply = await this._commentModel.findOne({
        filter: { _id: replyId, refId: commentId, createdBy: req.user?._id! },
      });

      if (!reply) {
        throw new APPError("reply not found or not authorized");
      }

      if (removeAttachments?.length) {
        const invalidFiles = removeAttachments.filter((file: string) => {
          return !reply.attachments?.includes(file);
        });

        if (invalidFiles.length) {
          throw new APPError(
            "some files you try to remove already don't exist",
          );
        }

        await this._s3Service.deleteFiles(removeAttachments);
        reply.attachments = reply.attachments?.filter((attachment: string) => {
          return !removeAttachments.includes(attachment);
        }) as string[];
      }

      const updateTags = new Set(
        reply?.tags?.map((tag) => {
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
        reply.tags = [...updateTags].map((tag: string) => {
          return new Types.ObjectId(tag);
        });
      }

      if (req?.files) {
        let urls: string[] = await this._s3Service.uploadFiles({
          path: `users/${req.user?._id}/posts/${post.folderId}/comments/${comment.folderId}/replies/${reply.folderId}`,
          files: req.files as Express.Multer.File[],
        });
        reply.attachments?.push(...urls);
      }

      if (content) {
        reply.content = content;
      }

      await reply.save();

      if (fcmTokens.length > 0) {
        await this._notificationService.sendNotifications({
          tokens: fcmTokens,
          data: {
            title: `you are mentioned in ${req.user?.userName}'s reply`,
            body: content || "reply updated",
          },
        });
      }

      successResponse({ res, data: reply });
    }
  };

  likeAndDislikeCommentOrReply = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { postId, commentId, replyId } = req.params;
    const { flag } = req.query;

    let updateQuery: any = { $addToSet: { likes: req.user?._id } };

    if (flag && flag === Like_Post_Enum.disLike) {
      updateQuery = { $pull: { likes: req.user?._id } };
    }

    if (postId && commentId && !replyId) {
      const likeAndDislikeComment = await this._commentModel.findOneAndUpdate({
        filter: {
          _id: commentId,
          refId: postId,
          createdBy: req.user?._id!,
        },
        updates: updateQuery,
      });

      if (!likeAndDislikeComment) {
        throw new APPError("comment not found or not authorized");
      }

      successResponse({ res, data: likeAndDislikeComment });
    } else if (postId && commentId && replyId) {
      const likeAndDislikeReply = await this._commentModel.findOneAndUpdate({
        filter: {
          _id: replyId,
          refId: commentId,
          createdBy: req.user?._id!,
        },
        updates: updateQuery,
      });

      if (!likeAndDislikeReply) {
        throw new APPError("reply not found or not authorized");
      }

      successResponse({ res, data: likeAndDislikeReply });
    }
  };

  deleteCommentOrReply = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { postId, commentId, replyId } = req.params;

    if (postId && commentId && !replyId) {
      const deletedComment = await this._commentModel.findOneAndUpdate({
        filter: {
          _id: commentId,
          refId: postId,
          createdBy: req.user?._id!,
          paranoid: true,
        },
        updates: {
          deletedAt: Date.now(),
        },
      });

      if (!deletedComment) {
        throw new APPError("comment not found or not authorized");
      }

      const deletedReplies = await this._commentModel.updateMany({
        filter: {
          refId: deletedComment._id,
          onModel: On_Model_Enum.comment,
        },
        updates: {
          deletedAt: Date.now(),
        },
      });

      if (deletedReplies.modifiedCount == 0) {
        throw new APPError("failed to delete comment replies");
      }

      successResponse({ res, data: "comment deleted successfully" });
    } else if (postId && commentId && replyId) {
      const deletedReply = await this._commentModel.findOneAndUpdate({
        filter: {
          _id: replyId,
          refId: commentId,
          createdBy: req.user?._id!,
          paranoid: true,
        },
        updates: {
          deletedAt: Date.now(),
        },
      });

      if (!deletedReply) {
        throw new APPError("reply not found or not authorized");
      }

      successResponse({ res, data: "reply deleted successfully" });
    }
  };
}

export default new commentService();
