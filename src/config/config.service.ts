//~ Assignment 16 ~//

import { resolve } from "node:path";
import { config } from "dotenv";
import { SignOptions } from "jsonwebtoken";

const NODE_ENV = process.env.NODE_ENV;

config({ path: resolve(__dirname, `../../.env.${NODE_ENV}`) });

export const PORT: number = Number(process.env.PORT) || 8000;
export const ORIGINS: string[] | [] = process.env.ORIGINS?.split(",") || [];
export const DB_URI: string = process.env.DB_URI!;
export const SALT_ROUNDS: number = Number(process.env.SALT_ROUNDS);
export const SYMMETRIC_ENCRYPTION_KEY: string =
  process.env.SYMMETRIC_ENCRYPTION_KEY!;
export const IV_LENGTH: number = Number(process.env.IV_LENGTH);
export const EMAIL_USER: string = process.env.EMAIL_USER!;
export const EMAIL_PASS: string = process.env.EMAIL_PASS!;
export const OTP_EXPIRE: number = Number(process.env.OTP_EXPIRE);
export const REDIS_URL: string = process.env.REDIS_URL!;
export const JWT_ACCESS_SECRET_KEY_USER: string =
  process.env.JWT_ACCESS_SECRET_KEY_USER!;
export const JWT_REFRESH_SECRET_KEY_USER: string =
  process.env.JWT_REFRESH_SECRET_KEY_USER!;
export const PREFIX_USER: string = process.env.PREFIX_USER!;
export const JWT_ACCESS_SECRET_KEY_ADMIN: string =
  process.env.JWT_ACCESS_SECRET_KEY_ADMIN!;
export const JWT_REFRESH_SECRET_KEY_ADMIN: string =
  process.env.JWT_REFRESH_SECRET_KEY_ADMIN!;
export const PREFIX_ADMIN: string = process.env.PREFIX_ADMIN!;
export const ACCESS_EXPIRES_IN: number = Number(process.env.ACCESS_EXPIRES_IN);
export const REFRESH_EXPIRES_IN: SignOptions["expiresIn"] =
  (process.env.REFRESH_EXPIRES_IN as SignOptions["expiresIn"]) || "1y";
export const CLIENT_ID: string = process.env.CLIENT_ID!;
export const CLOUD_NAME: string = process.env.CLOUD_NAME!;
export const API_KEY: string = process.env.API_KEY!;
export const API_SECRET: string = process.env.API_SECRET!;
