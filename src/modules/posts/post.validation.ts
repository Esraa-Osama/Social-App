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
