//~ Assignment 16 ~//

import * as z from "zod";

export const updatePasswordSchema = {
  body: z
    .object({
      oldPassword: z.string({ message: "oldPassword is required" }).min(6, {
        message:
          "oldPassword length must be greater than or equal 6 characters",
      }),
      newPassword: z.string({ message: "newPassword is required" }).min(6, {
        message:
          "newPassword length must be greater than or equal 6 characters",
      }),
      confirmNewPassword: z
        .string({ message: "confirmNewPassword is required" })
        .min(6, {
          message:
            "confirmNewPassword length must be greater than or equal 6 characters",
        }),
    })
    .refine(
      (data) => {
        return data.newPassword === data.confirmNewPassword;
      },
      { message: "passwords don't match", path: ["confirmNewPassword"] },
    ),
};
export type IUpdatePasswordType = z.infer<typeof updatePasswordSchema.body>;
