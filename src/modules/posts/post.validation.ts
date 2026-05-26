//~ Assignment 20 ~//

import * as z from "zod";
import {
  Allow_Comment_Enum,
  Availability_Enum,
} from "../../common/enum/post.enum";
import { general_rules } from "../../common/utils/general-rules";

export const createPostSchema = {
  body: z
    .object({
      content: z.string().optional(),
      attachments: z.array(general_rules.file).optional(),
      tags: z.array(general_rules.id).optional(),
      allowComment: z
        .enum(Allow_Comment_Enum)
        .default(Allow_Comment_Enum.allow),
      availability: z.enum(Availability_Enum).default(Availability_Enum.public),
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
};
export type ICreatePostType = z.infer<typeof createPostSchema.body>;

export const likePostSchema = {
  params: z.object({
    postId: general_rules.id,
  }),
};
export type ILikePostType = z.infer<typeof likePostSchema.params>;

export const updatePostSchema = {
  body: z
    .object({
      content: z.string().optional(),
      attachments: z.array(general_rules.file).optional(),
      removeAttachments: z.array(z.string()).optional(),
      tags: z.array(general_rules.id).optional(),
      removeTags: z.array(z.string()).optional(),
      allowComment: z
        .enum(Allow_Comment_Enum)
        .default(Allow_Comment_Enum.allow),
      availability: z.enum(Availability_Enum).default(Availability_Enum.public),
    })
    .superRefine((args, ctx) => {
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
export type IUpdatePostType = z.infer<typeof updatePostSchema.body>;
export type IUpdatePostIdType = z.infer<typeof updatePostSchema.params>;
