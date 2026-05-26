//~ Assignment 20 ~//

import * as z from "zod";
import { general_rules } from "../../common/utils/general-rules";
import { On_Model_Enum } from "../../common/enum/post.enum";

export const createCommentOrReplySchema = {
  body: z
    .object({
      content: z.string().optional(),
      attachments: z.array(general_rules.file).optional(),
      tags: z.array(general_rules.id).optional(),
      onModel: z.enum(On_Model_Enum),
    })
    .superRefine((args, ctx) => {
      if (!args.content && !args.attachments?.length) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "content is required",
        });
      }

      if (args.tags) {
        const uniqueTags = new Set(args.tags);
        if (args.tags.length !== uniqueTags.size) {
          ctx.addIssue({
            code: "custom",
            path: ["tags"],
            message: "duplicated tags",
          });
        }
      }
    }),
  params: z.object({
    postId: general_rules.id,
    commentId: general_rules.id.optional(),
  }),
};
export type ICreateCommentOrReplyType = z.infer<
  typeof createCommentOrReplySchema.body
>;
export type ICreateCommentOrReplyParamType = z.infer<
  typeof createCommentOrReplySchema.params
>;

export const updateCommentOrReplySchema = {
  body: z
    .object({
      content: z.string().optional(),
      attachments: z.array(general_rules.file).optional(),
      removeAttachments: z.array(z.string()).optional(),
      tags: z.array(general_rules.id).optional(),
      removeTags: z.array(z.string()).optional(),
    })
    .superRefine((args, ctx) => {
      if (!args.content && !args.attachments?.length) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "content is required",
        });
      }

      if (args.tags) {
        const uniqueTags = new Set(args.tags);
        if (args.tags.length !== uniqueTags.size) {
          ctx.addIssue({
            code: "custom",
            path: ["tags"],
            message: "duplicated tags",
          });
        }
      }
    }),
  params: z.object({
    postId: general_rules.id,
    commentId: general_rules.id,
    replyId: general_rules.id.optional(),
  }),
};
export type IUpdateCommentOrReplyType = z.infer<
  typeof updateCommentOrReplySchema.body
>;
export type IUpdateCommentOrReplyParamType = z.infer<
  typeof updateCommentOrReplySchema.params
>;

export const likeAndDislikeCommentOrReplySchema = {
  params: z.object({
    postId: general_rules.id,
    commentId: general_rules.id,
    replyId: general_rules.id.optional(),
  }),
};
export type ILikeCommentOrReplyType = z.infer<
  typeof likeAndDislikeCommentOrReplySchema.params
>;
