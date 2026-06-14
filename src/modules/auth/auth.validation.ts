//~ Assignment 21 ~//

import * as z from "zod";
import { GenderEnum } from "../../common/enum/user.enum";

export const signUpSchema = {
  body: z
    .object({
      userName: z
        .string({ message: "userName is required" })
        .min(3, {
          message: "userName length must be between 3 and 25 characters",
        })
        .max(25, {
          message: "userName length must be between 3 and 25 characters",
        }),
      email: z
        .string({ message: "email is required" })
        .email({ message: "invalid email format" }),
      password: z.string({ message: "password is required" }).min(6, {
        message: "password length must be greater than or equal 6 characters",
      }),
      confirmPassword: z
        .string({ message: "confirmPassword is required" })
        .min(6, {
          message:
            "confirmPassword length must be greater than or equal 6 characters",
        }),
      age: z
        .number({ message: "age is required" })
        .min(18, {
          message: "age must be between 18 and 60 years",
        })
        .max(60, {
          message: "age must be between 18 and 60 years",
        }),
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
    })
    .refine(
      (data) => {
        return data.password === data.confirmPassword;
      },
      { message: "passwords don't match", path: ["confirmPassword"] },
    ),
};
export type ISignUpType = z.infer<typeof signUpSchema.body>;

export const signInSchema = {
  body: z.object({
    email: z
      .string({ message: "email is required" })
      .email({ message: "invalid email format" }),
    password: z.string({ message: "password is required" }).min(6, {
      message: "password length must be greater than or equal 6 characters",
    }),
    fcm: z.string(),
  }),
};
export type ISignInType = z.infer<typeof signInSchema.body>;

export const confirmEmailSchema = {
  body: z.object({
    email: z
      .string({ message: "email is required" })
      .email({ message: "invalid email format" }),
    otp: z.string({ message: "otp is required" }).length(6, {
      message: "otp length must be 6 digits",
    }),
  }),
};
export type IConfirmEmailType = z.infer<typeof confirmEmailSchema.body>;

export const resendOTPSchema = {
  body: z.object({
    email: z
      .string({ message: "email is required" })
      .email({ message: "invalid email format" }),
  }),
};
export type IResendOTPType = z.infer<typeof resendOTPSchema.body>;

export const signUpAndSignInWithGmailSchema = {
  body: z.object({
    idToken: z
      .string({ message: "idToken is required" })
      .min(10, { message: "invalid idToken" }),
  }),
};
export type ISignUpAndSignInWithGmailType = z.infer<
  typeof signUpAndSignInWithGmailSchema.body
>;

export const forgotPasswordSchema = {
  body: z.object({
    email: z
      .string({ message: "email is required" })
      .email({ message: "invalid email format" }),
  }),
};
export type IForgotPasswordType = z.infer<typeof forgotPasswordSchema.body>;

export const resetPasswordSchema = {
  body: z
    .object({
      code: z.string({ message: "code is required" }).length(6, {
        message: "code length must be 6 digits",
      }),
      email: z
        .string({ message: "email is required" })
        .email({ message: "invalid email format" }),
      newPassword: z.string({ message: "new password is required" }).min(6, {
        message:
          "new password length must be greater than or equal 6 characters",
      }),
      confirmPassword: z
        .string({ message: "confirmPassword is required" })
        .min(6, {
          message:
            "confirmPassword length must be greater than or equal 6 characters",
        }),
    })
    .refine(
      (data) => {
        return data.newPassword === data.confirmPassword;
      },
      { message: "passwords don't match", path: ["confirmPassword"] },
    ),
};
export type IResetPasswordType = z.infer<typeof resetPasswordSchema.body>;

export const getUserSchema = z.object({
  token: z.string(),
});
