//~ Assignment 15 ~//

import { RedisClientType } from "redis";
import { redisClient } from "./redis.db";
import { APPError } from "../../common/utils/global-error-handler";

class RedisService {
  private _redisClient: RedisClientType;
  constructor() {
    this._redisClient = redisClient;
  }

  async set({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: string | number | boolean | object;
    ttl?: number;
  }): Promise<"OK" | null> {
    try {
      const data = typeof value === "string" ? value : JSON.stringify(value);
      return ttl
        ? await this._redisClient.set(key, data, { EX: ttl })
        : await this._redisClient.set(key, data);
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
        return JSON.parse(await this._redisClient.get(key));
      } catch (error) {
        return await this._redisClient.get(key);
      }
    } catch (error) {
      console.log("error to get data from redis", error);
      throw new APPError("error to get data from redis");
    }
  }

  async exists(key: string): Promise<number> {
    try {
      return await this._redisClient.exists(key);
    } catch (error) {
      console.log("error to check data exists in redis", error);
      throw new APPError("error to check data exists in redis");
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this._redisClient.ttl(key);
    } catch (error) {
      console.log("error to get ttl from redis", error);
      throw new APPError("error to get ttl from redis");
    }
  }

  async expire({ key, ttl }: { key: string; ttl: number }): Promise<boolean> {
    try {
      return await this._redisClient.expire(key, ttl);
    } catch (error) {
      console.log("error to set expire in redis", error);
      throw new APPError("error to set expire in redis");
    }
  }

  async deleteKey(key: string): Promise<number> {
    try {
      if (!key.length) {
        return 0;
      }
      return await this._redisClient.del(key);
    } catch (error) {
      console.log("error to delete data from redis", error);
      throw new APPError("error to delete data from redis");
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await redisClient.keys(`${pattern}*`);
    } catch (error) {
      console.log("error to get keys from redis", error);
      throw new APPError("error to get keys from redis");
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await redisClient.incr(key);
    } catch (error) {
      console.log("error to increment key in redis", error);
      throw new APPError("error to increment key in redis");
    }
  }

  revokedKey({ userId, jti }: { userId: string; jti: string }): string {
    return `revokeToken::${userId}::${jti}`;
  }

  getKey(userId: string): string {
    return `revokeToken::${userId}::`;
  }

  getProfileKey(userId: string): string {
    return `profile::${userId}`;
  }

  otpKey(email: string): string {
    return `otp:${email}`;
  }

  maxOtpKey(email: string): string {
    return `otp:${email}::max-tries`;
  }

  blockOtpKey(email: string): string {
    return `otp:${email}::block`;
  }

  banKey(email: string): string {
    return `ban::${email}`;
  }

  maxPasswordTries(email: string): string {
    return `max-password-tries::${email}`;
  }
}

export default new RedisService();
