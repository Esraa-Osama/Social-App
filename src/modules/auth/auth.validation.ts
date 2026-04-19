//~ Assignment 15 ~//

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
  }),
};

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

export const resendOTPSchema = {
  body: z.object({
    email: z
      .string({ message: "email is required" })
      .email({ message: "invalid email format" }),
  }),
};
