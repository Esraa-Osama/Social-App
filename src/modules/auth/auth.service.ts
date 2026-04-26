//~ Assignment 16 ~//

import type { Request, Response, NextFunction } from "express";
import { APPError } from "../../common/utils/global-error-handler";
import {
  IConfirmEmailType,
  IForgotPasswordType,
  IResendOTPType,
  IResetPasswordType,
  ISignInType,
  ISignUpAndSignInWithGmailType,
  ISignUpType,
} from "./auth.validation";
import { IUser } from "../../DB/models/user.model";
import { HydratedDocument } from "mongoose";
import UserRepository from "../../DB/repositories/user.repository";
import { applyHash, compareHash } from "../../common/security/hash.security";
import { encrypt } from "../../common/security/encrypt.security";
import { generateOTP, sendEmail } from "../../common/utils/email/send.email";
import { emailTemplate } from "../../common/utils/email/template.email";
import { ProviderEnum, RoleEnum } from "../../common/enum/user.enum";
import { randomUUID } from "node:crypto";
import tokenService from "../../common/services/token.service";
import {
  CLIENT_ID,
  JWT_ACCESS_SECRET_KEY_USER,
  JWT_REFRESH_SECRET_KEY_USER,
  JWT_ACCESS_SECRET_KEY_ADMIN,
  JWT_REFRESH_SECRET_KEY_ADMIN,
  ACCESS_EXPIRES_IN,
  REFRESH_EXPIRES_IN,
  OTP_EXPIRE,
} from "../../config/config.service";
import redisService from "../../common/services/redis.service";
import { event } from "../../common/utils/email/event.email";
import { emailEnum } from "../../common/enum/email.enum";
import { LoginTicket, OAuth2Client, TokenPayload } from "google-auth-library";
import { OTPKeyEnum, subjectEnum } from "../../common/enum/otpKey.enum";
import { JwtPayload } from "jsonwebtoken";
import { successResponse } from "../../common/utils/response.success";

class AuthService {
  private readonly _userModel = new UserRepository();
  private readonly _redisService = redisService;
  private readonly _tokenService = tokenService;
  constructor() {}

  sendEmailOtp = async ({
    email,
    type,
  }: {
    email: string;
    type: OTPKeyEnum;
  }) => {
    const isBlocked = await this._redisService.ttl(
      this._redisService.blockOtpKey({ email, type }),
    );
    if (isBlocked > 0) {
      throw new APPError(
        `you are blocked, please try again after ${isBlocked} seconds`,
        400,
      );
    }

    const otpTtl = await this._redisService.ttl(
      this._redisService.otpKey({ email, type }),
    );
    if (otpTtl > 0) {
      throw new APPError(`you can resend otp after ${otpTtl} seconds`, 400);
    }

    let max_otp = await this._redisService.get(
      this._redisService.maxOtpKey({ email, type }),
    );
    let maxOtp = Number(max_otp ?? 0);
    if (maxOtp >= 3) {
      await this._redisService.set({
        key: this._redisService.blockOtpKey({ email, type }),
        value: "true",
        ttl: 60,
      });
      await this._redisService.deleteKey(
        this._redisService.maxOtpKey({ email, type }),
      );
      throw new APPError("you have exceeded the maximum number of tries", 400);
    }

    const otp = generateOTP();

    event.emit(
      type == OTPKeyEnum.signUp
        ? emailEnum.confirmEmail
        : emailEnum.forgetPassword,
      async () => {
        await sendEmail({
          to: email,
          subject: `Social App ${type == OTPKeyEnum.signUp ? subjectEnum.signUp : subjectEnum.resetPassword}`,
          html: emailTemplate({ otp, type }),
        });
        await this._redisService.set({
          key: this._redisService.otpKey({ email, type }),
          value: applyHash({ plainText: `${otp}` }),
          ttl: OTP_EXPIRE,
        });
        await this._redisService.incr(
          this._redisService.maxOtpKey({ email, type }),
        );
      },
    );
  };

  signup = async (req: Request, res: Response, next: NextFunction) => {
    let {
      userName,
      email,
      password,
      age,
      phone,
      address,
      gender,
    }: ISignUpType = req.body;

    await this._userModel.checkUserExists(email);

    const user: HydratedDocument<IUser> = await this._userModel.create({
      userName,
      email,
      password: applyHash({ plainText: password }),
      age,
      phone: phone ? encrypt(phone) : null,
      address,
      gender,
    } as Partial<IUser>);

    const otp = generateOTP();
    event.emit(emailEnum.confirmEmail, async () => {
      await sendEmail({
        to: email,
        subject: `Social App ${subjectEnum.signUp}`,
        html: emailTemplate({ otp, type: OTPKeyEnum.signUp }),
      });

      await this._redisService.set({
        key: this._redisService.otpKey({ email, type: OTPKeyEnum.signUp }),
        value: applyHash({ plainText: otp }),
        ttl: OTP_EXPIRE,
      });

      await this._redisService.set({
        key: this._redisService.maxOtpKey({ email, type: OTPKeyEnum.signUp }),
        value: 1,
      });
    });

    successResponse({ res, status: 201, message: "OTP sent to your email" });
  };

  signin = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password }: ISignInType = req.body;

    const user = await this._userModel.checkUserNotExists({
      email,
      provider: ProviderEnum.system,
    });

    if (!user.confirmed) {
      throw new APPError("please verify your email first", 403);
    }

    if (!compareHash({ plainText: password, hashedText: user.password! })) {
      throw new APPError("incorrect password", 404);
    }

    const jwtid = randomUUID();

    const access_token = this._tokenService.generateToken({
      payload: { id: user._id },
      secret_key:
        user?.role == RoleEnum.user
          ? JWT_ACCESS_SECRET_KEY_USER
          : JWT_ACCESS_SECRET_KEY_ADMIN,
      options: { expiresIn: ACCESS_EXPIRES_IN, jwtid },
    });

    const refresh_token = this._tokenService.generateToken({
      payload: { id: user._id },
      secret_key:
        user?.role == RoleEnum.user
          ? JWT_REFRESH_SECRET_KEY_USER
          : JWT_REFRESH_SECRET_KEY_ADMIN,
      options: {
        expiresIn: REFRESH_EXPIRES_IN!,
        jwtid,
      },
    });

    successResponse({
      res,
      message: "signed in successfully",
      data: { access_token, refresh_token },
    });
  };

  confirmEmail = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp }: IConfirmEmailType = req.body;

    const otpExists = await this._redisService.get(
      this._redisService.otpKey({ email, type: OTPKeyEnum.signUp }),
    );
    if (!otpExists) {
      throw new Error("otp expired");
    }

    if (
      !compareHash({
        plainText: otp,
        hashedText: otpExists,
      })
    ) {
      throw new APPError("invalid otp", 400);
    }

    const user = await this._userModel.findOneAndUpdate({
      filter: {
        email,
        confirmed: { $exists: false },
        provider: ProviderEnum.system,
      },
      updates: { confirmed: true },
    });

    if (!user) {
      throw new Error("user not found", { cause: 404 });
    }

    await this._redisService.deleteKey(
      this._redisService.otpKey({ email, type: OTPKeyEnum.signUp }),
    );
    await this._redisService.deleteKey(
      this._redisService.maxOtpKey({ email, type: OTPKeyEnum.signUp }),
    );

    successResponse({
      res,
      message: "email confirmed successfully",
    });
  };

  resendOTP = async (req: Request, res: Response, next: NextFunction) => {
    const { email }: IResendOTPType = req.body;

    const user = await this._userModel.findOne({
      filter: {
        email,
        confirmed: { $exists: false },
        provider: ProviderEnum.system,
      },
    });
    if (!user) {
      throw new APPError(
        "user not found or already confirmed or invalid provider",
        404,
      );
    }
    await this.sendEmailOtp({ email, type: OTPKeyEnum.signUp });
    successResponse({
      res,
      status: 201,
      message: "OTP sent to your email",
    });
  };

  signupAndSignInWithGmail = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { idToken }: ISignUpAndSignInWithGmailType = req.body;
    const client: OAuth2Client = new OAuth2Client();
    const ticket: LoginTicket = await client.verifyIdToken({
      idToken,
      audience: CLIENT_ID,
    });
    const payload: TokenPayload | undefined = ticket.getPayload();
    if (!payload) {
      throw new Error("invalid google token");
    }
    const { name, email, email_verified } = payload;
    if (!email) {
      throw new APPError("email is required", 400);
    }

    let user = await this._userModel.findOne({ filter: { email } });
    if (!user) {
      user = await this._userModel.create({
        userName: name!,
        email,
        confirmed: email_verified!,
        provider: ProviderEnum.google,
      });
    }

    if (user.provider == ProviderEnum.system) {
      throw new Error("sorry, you can sign in using system only", {
        cause: 400,
      });
    }

    const jwtid: string = randomUUID();

    const access_token: string = this._tokenService.generateToken({
      payload: { id: user._id, email: user.email },
      secret_key:
        user?.role == RoleEnum.user
          ? JWT_ACCESS_SECRET_KEY_USER
          : JWT_ACCESS_SECRET_KEY_ADMIN,
      options: { expiresIn: ACCESS_EXPIRES_IN },
    });

    const refresh_token: string = this._tokenService.generateToken({
      payload: { id: user._id, email: user.email },
      secret_key:
        user?.role == RoleEnum.user
          ? JWT_REFRESH_SECRET_KEY_USER
          : JWT_REFRESH_SECRET_KEY_ADMIN,
      options: { expiresIn: REFRESH_EXPIRES_IN!, jwtid },
    });

    successResponse({
      res,
      data: { access_token, refresh_token },
    });
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email }: IForgotPasswordType = req.body;
    const user = await this._userModel.findOne({
      filter: {
        email,
        provider: ProviderEnum.system,
        confirmed: { $exists: true },
      },
    });
    if (!user) {
      throw new APPError(
        "user not found or invalid provider or unconfirmed",
        404,
      );
    }

    await this.sendEmailOtp({ email, type: OTPKeyEnum.forgotPassword });
    successResponse({
      res,
      message: "otp sent to your email",
    });
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { code, email, newPassword }: IResetPasswordType = req.body;

    const otpExists = await this._redisService.get(
      this._redisService.otpKey({ email, type: OTPKeyEnum.forgotPassword }),
    );
    if (!otpExists) {
      throw new APPError("otp expired", 400);
    }

    if (
      !compareHash({
        plainText: code,
        hashedText: otpExists,
      })
    ) {
      throw new APPError("invalid otp", 400);
    }

    const user = await this._userModel.findOneAndUpdate({
      filter: {
        email,
        provider: ProviderEnum.system,
        confirmed: { $exists: true },
      },
      updates: {
        password: applyHash({ plainText: newPassword }),
        changeCredential: new Date(),
      },
    });
    if (!user) {
      throw new Error("user not found or invalid provider or unconfirmed", {
        cause: 404,
      });
    }
    await this._redisService.deleteKey(
      this._redisService.otpKey({ email, type: OTPKeyEnum.forgotPassword }),
    );
    await this._redisService.deleteKey(
      this._redisService.maxOtpKey({ email, type: OTPKeyEnum.forgotPassword }),
    );
    successResponse({
      res,
      message: "password was reset successfully",
    });
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    const { flag } = req.query;
    if (flag === "all") {
      req.user!.changeCredential = new Date();
      await req.user!.save();
      await this._redisService.deleteKey(
        await this._redisService.keys(this._redisService.getKey(req.user!._id)),
      );
    } else {
      await this._redisService.set({
        key: this._redisService.revokedKey({
          userId: req.user!._id,
          jti: req.decoded!.jti!,
        }),
        value: `${req.decoded!.jti}`,
        ttl: req.decoded!.exp! - Math.floor(Date.now() / 1000),
      });
    }
    successResponse({
      res,
      message: "done",
    });
  };
}

export default new AuthService();
