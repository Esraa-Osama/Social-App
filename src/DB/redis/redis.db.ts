//~ Assignment 15 ~//

import { RedisClientType, createClient } from "redis";
import { REDIS_URL } from "../../config/config.service";

export const redisClient: RedisClientType = createClient({
  url: REDIS_URL,
});

export const redisConnection = async () => {
  try {
    await redisClient.connect();
    console.log("connected to redis successfully");
  } catch (error) {
    console.log("failed to connect to redis", error);
  }
};
