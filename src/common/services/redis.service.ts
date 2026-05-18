//~ Assignment 19 ~//

import { createClient, RedisClientType } from "redis";
import { REDIS_URL } from "../../config/config.service";
import { APPError } from "../utils/global-error-handler";
import { Types } from "mongoose";
import { OTPKeyEnum } from "../enum/otpKey.enum";

class RedisService {
  private readonly client: RedisClientType;
  constructor() {
    this.client = createClient({
      url: REDIS_URL,
    });
    this.handleEvents();
  }

  handleEvents() {
    this.client.on("error", (error) => {
      console.log("failed to connect to redis", error);
    });
  }

  async connect() {
    await this.client.connect();
    console.log("connected to redis successfully");
  }

  async set({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: string | number | boolean | object;
    ttl?: number;
  }): Promise<string | null> {
    try {
      const data = typeof value === "string" ? value : JSON.stringify(value);
      return ttl
        ? await this.client.set(key, data, { EX: ttl })
        : await this.client.set(key, data);
    } catch (error) {
      console.log("error to set data in redis", error);
      throw new APPError("error to set data in redis");
    }
  }

  async update({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: string | number | boolean | object;
    ttl?: number;
  }): Promise<string | null> {
    try {
      return await this.set(
        ttl !== undefined ? { key, value, ttl } : { key, value },
      );
    } catch (error) {
      console.log("error to update data in redis", error);
      throw new APPError("error to update data in redis");
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      try {
        return JSON.parse((await this.client.get(key)) as string);
      } catch (error) {
        return await this.client.get(key);
      }
    } catch (error) {
      console.log("error to get data from redis", error);
      throw new APPError("error to get data from redis");
    }
  }

  async exists(key: string): Promise<number> {
    try {
      return await this.client.exists(key);
    } catch (error) {
      console.log("error to check data exists in redis", error);
      throw new APPError("error to check data exists in redis");
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.log("error to get ttl from redis", error);
      throw new APPError("error to get ttl from redis");
    }
  }

  async expire({ key, ttl }: { key: string; ttl: number }): Promise<number> {
    try {
      return await this.client.expire(key, ttl);
    } catch (error) {
      console.log("error to set expire in redis", error);
      throw new APPError("error to set expire in redis");
    }
  }

  async deleteKey(key: string[] | string): Promise<number> {
    try {
      if (!key.length) {
        return 0;
      }
      return await this.client.del(key);
    } catch (error) {
      console.log("error to delete data from redis", error);
      throw new APPError("error to delete data from redis");
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(`${pattern}*`);
    } catch (error) {
      console.log("error to get keys from redis", error);
      throw new APPError("error to get keys from redis");
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      console.log("error to increment key in redis", error);
      throw new APPError("error to increment key in redis");
    }
  }

  revokedKey({ userId, jti }: { userId: Types.ObjectId; jti: string }): string {
    return `revokeToken::${userId}::${jti}`;
  }

  getKey(userId: Types.ObjectId): string {
    return `revokeToken::${userId}::`;
  }

  otpKey({ email, type }: { email: string; type: OTPKeyEnum }): string {
    return `otp:${email}::${type}`;
  }

  maxOtpKey({ email, type }: { email: string; type: OTPKeyEnum }): string {
    return `otp:${email}::${type}::max-tries`;
  }

  blockOtpKey({ email, type }: { email: string; type: OTPKeyEnum }): string {
    return `otp:${email}::${type}::block`;
  }

  key(userId: Types.ObjectId) {
    return `user:FCM:${userId}`;
  }

  async addFCM({
    userId,
    FCMToken,
  }: {
    userId: Types.ObjectId;
    FCMToken: string;
  }) {
    return await this.client.sAdd(this.key(userId), FCMToken);
  }

  async removeFCM({
    userId,
    FCMToken,
  }: {
    userId: Types.ObjectId;
    FCMToken: string;
  }) {
    return await this.client.sRem(this.key(userId), FCMToken);
  }

  async getFCMs(userId: Types.ObjectId) {
    return await this.client.sMembers(this.key(userId));
  }

  async hasFCMs(userId: Types.ObjectId) {
    return await this.client.sCard(this.key(userId));
  }

  async removeFCMUser(userId: Types.ObjectId) {
    return await this.client.del(this.key(userId));
  }
}
export default new RedisService();
