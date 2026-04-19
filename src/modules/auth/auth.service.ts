//~ Assignment 15 ~//

import type { Request, Response, NextFunction } from "express";
import { APPError } from "../../common/utils/global-error-handler";
import { ISignUpType } from "./auth.validation";
import { IUser } from "../../DB/models/user.model";
import { HydratedDocument } from "mongoose";
import UserRepository from "../../DB/repositories/user.repository";
import { applyHash, compareHash } from "../../common/security/hash.security";
import { encrypt } from "../../common/security/encrypt.security";
import { generateOTP, sendEmail } from "../../common/utils/email/send.email";
import { emailTemplate } from "../../common/utils/email/template.email";
import { ProviderEnum } from "../../common/enum/user.enum";
import { randomUUID } from "node:crypto";
import { generateToken } from "../../common/services/token.service";
import {
  ACCESS_EXPIRES_IN,
  CLIENT_ID,
  JWT_ACCESS_SECRET_KEY,
  JWT_REFRESH_SECRET_KEY,
  OTP_EXPIRE,
  REFRESH_EXPIRES_IN,
} from "../../config/config.service";
import redisService from "../../DB/redis/redis.service";
import { event } from "../../common/utils/email/event.email";
import { emailEnum } from "../../common/enum/email.enum";
import { OAuth2Client, TokenPayload } from "google-auth-library";

class AuthService {
  private readonly _userModel = new UserRepository();
  constructor() {}

  sendEmailOtp = async (email: string) => {
    const isBlocked = await redisService.ttl(redisService.blockOtpKey(email));
    if (isBlocked > 0) {
      throw new APPError(
        `you are blocked, please try again after ${isBlocked} seconds`,
        400,
      );
    }

    const otpTtl = await redisService.ttl(redisService.otpKey(email));
    if (otpTtl > 0) {
      throw new APPError(`you can resend otp after ${otpTtl} seconds`, 400);
    }

    let max_otp = await redisService.get(redisService.maxOtpKey(email));
    let maxOtp = Number(max_otp ?? 0);
    if (maxOtp >= 3) {
      await redisService.set({
        key: redisService.blockOtpKey(email),
        value: "true",
        ttl: 60,
      });
      await redisService.update({
        key: redisService.maxOtpKey(email),
        value: "0",
      });
      throw new APPError("you have exceeded the maximum number of tries", 400);
    }

    const otp = generateOTP();

    event.emit(emailEnum.confirmEmail, async () => {
      await sendEmail({
        to: email,
        subject: "Social App Email Confirmation",
        html: emailTemplate(otp),
      });
      await redisService.set({
        key: redisService.otpKey(email),
        value: applyHash({ plainText: `${otp}` }),
        ttl: OTP_EXPIRE,
      });
      await redisService.incr(redisService.maxOtpKey(email));
    });
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
        subject: "Social App Email Confirmation",
        html: emailTemplate(otp),
      });

      await redisService.set({
        key: redisService.otpKey(email),
        value: applyHash({ plainText: otp }),
        ttl: OTP_EXPIRE,
      });

      await redisService.set({
        key: redisService.maxOtpKey(email),
        value: 1,
      });
    });

    return res.status(201).json({
      message: "OTP sent to your email",
    });
  };

  signin = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const user = await this._userModel.checkUserNotExists({
      email,
      provider: ProviderEnum.system,
    });

    if (!user.confirmed) {
      throw new APPError("please verify your email first", 403);
    }

    if (!compareHash({ plainText: password, hashedText: user.password })) {
      throw new APPError("incorrect password", 404);
    }

    const jwtid = randomUUID();

    const access_token = generateToken({
      payload: { id: user._id },
      secret_key: JWT_ACCESS_SECRET_KEY,
      options: { expiresIn: ACCESS_EXPIRES_IN, jwtid },
    });

    const refresh_token = generateToken({
      payload: { id: user._id },
      secret_key: JWT_REFRESH_SECRET_KEY,
      options: {
        expiresIn: REFRESH_EXPIRES_IN!,
        jwtid,
      },
    });

    return res.status(200).json({
      message: "signed in successfully",
      data: { access_token, refresh_token },
    });
  };

  confirmEmail = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;

    const otpExists = await redisService.get(redisService.otpKey(email));
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

    await redisService.deleteKey(redisService.otpKey(email));
    return res.status(200).json({ message: "email confirmed successfully" });
  };

  resendOTP = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

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
    await this.sendEmailOtp(email);
    return res.status(201).json({
      message: "OTP sent to your email",
    });
  };

  signupAndSignInWithGmail = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { idToken } = req.body;
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
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

    const access_token = generateToken({
      payload: { id: user._id, email: user.email },
      secret_key: JWT_ACCESS_SECRET_KEY,
      options: { expiresIn: ACCESS_EXPIRES_IN },
    });
    return res.status(200).json({ data: { access_token } });
  };
}

export default new AuthService();
