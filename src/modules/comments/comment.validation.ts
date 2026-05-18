//~ Assignment 19 ~//

import * as z from "zod";
import { general_rules } from "../../common/utils/general-rules";

export const createCommentSchema = {
  body: z
    .object({
      content: z.string().optional(),
      attachments: z.array(general_rules.file).optional(),
      tags: z.array(general_rules.id).optional(),
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
  }),
};
export type ICreateCommentType = z.infer<typeof createCommentSchema.body>;
export type ICreateCommentParamType = z.infer<
  typeof createCommentSchema.params
>;

export const createReplySchema = {
  body: z
    .object({
      content: z.string().optional(),
      attachments: z.array(general_rules.file).optional(),
      tags: z.array(general_rules.id).optional(),
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
export type ICreateReplyType = z.infer<typeof createReplySchema.body>;
export type ICreateReplyParamType = z.infer<typeof createReplySchema.params>;
