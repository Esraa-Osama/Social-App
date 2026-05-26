//~ Assignment 20 ~//

import * as z from "zod";
import { GenderEnum } from "../../common/enum/user.enum";
import { general_rules } from "../../common/utils/general-rules";

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

export const updateProfileSchema = {
  body: z.object({
    userName: z
      .string({ message: "userName is required" })
      .min(3, {
        message: "userName length must be between 3 and 25 characters",
      })
      .max(25, {
        message: "userName length must be between 3 and 25 characters",
      })
      .optional(),
    age: z
      .number({ message: "age is required" })
      .min(18, {
        message: "age must be between 18 and 60 years",
      })
      .max(60, {
        message: "age must be between 18 and 60 years",
      })
      .optional(),
    phone: z
      .string()
      .regex(/^(?:\+20|20|0)?1[0125][0-9]{8}$/, "invalid phone number")
      .optional(),
    address: z
      .string()
      .min(3, {
        message: "address length must be between 10 and 40 characters",
      })
      .max(30, {
        message: "address length must be between 10 and 40 characters",
      })
      .optional(),
    gender: z
      .enum(GenderEnum, {
        message: `gender must be ${GenderEnum.male} or ${GenderEnum.female}`,
      })
      .optional(),
  }),
};
export type IUpdateProfileType = z.infer<typeof updateProfileSchema.body>;

export const updateProfilePictureSchema = {
  body: z.object({
    file: general_rules.file,
  }),
};
export type IUpdateProfilePictureType = z.infer<
  typeof updateProfilePictureSchema.body
>;

export const updateCoverPicturesSchema = {
  body: z.object({
    attachments: z.array(general_rules.file),
  }),
};
export type IUpdateCoverPicturesType = z.infer<
  typeof updateCoverPicturesSchema.body
>;
