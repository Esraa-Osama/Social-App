//~ Assignment 20 ~//

import express from "express";
import type { Request, Response, NextFunction } from "express";
import { ORIGINS, PORT } from "./config/config.service";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import {
  APPError,
  globalErrorHandler,
} from "./common/utils/global-error-handler";
import authRouter from "./modules/auth/auth.controller";
import { checkCBConnection } from "./DB/dbConnection";
import userRouter from "./modules/users/user.controller";
import { successResponse } from "./common/utils/response.success";
import redisService from "./common/services/redis.service";
import postRouter from "./modules/posts/post.controller";
import { graphQLSchema } from "./modules/graphql/graphql.schema";
import { createHandler } from "graphql-http/lib/use/express";

const app: express.Application = express();
const port: number = PORT;

const bootstrap = async () => {
  checkCBConnection();
  await redisService.connect();
  app.use(express.json());

  const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 50,
    statusCode: 400,
    message: "to many requests from this IP, please try again later",
    handler: (req: Request, res: Response, next: NextFunction) => {
      throw new APPError(
        "to many requests from this IP, please try again later",
        429,
      );
    },
  });

  const whiteList = [...ORIGINS, undefined];
  const corsOptions: CorsOptions = {
    origin: function (origin, callback) {
      if (!origin || whiteList.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("you are not allowed by CORS"));
      }
    },
  };

  app.use(cors(corsOptions), helmet(), limiter);

  app.get("/", (req: Request, res: Response, next: NextFunction) => {
    successResponse({
      res,
      message: "WELCOME TO SOCIAL APP...",
    });
  });

  app.use(
    "/graphql",
    createHandler({
      schema: graphQLSchema,
      context: (req) => {
        {
          req;
        }
      },
    }),
  );

  app.use("/auth", authRouter);
  app.use("/users", userRouter);
  app.use("/posts", postRouter);

  app.use("{/*demo}", (req: Request, res: Response, next: NextFunction) => {
    throw new APPError(`404 page ${req.originalUrl} not found`, 404);
  });

  app.use(globalErrorHandler);

  app.listen(port, () => {
    console.log(`server is running on port ${port}`);
  });
};

export default bootstrap;
