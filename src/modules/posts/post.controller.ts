//~ Assignment 19 ~//

import { Router } from "express";
import { authentication } from "../../common/middleware/authentication.middleware";
import multerCloud from "../../common/middleware/multerCloud.middleware";
import postService from "./post.service";
import { validation } from "../../common/middleware/validation.middleware";
import * as postValidation from "./post.validation";
import commentRouter from "../comments/comment.controller";

const postRouter = Router();

postRouter.use("/:postId/comments", commentRouter);

postRouter.post(
  "/create-post",
  authentication,
  multerCloud().array("attachments"),
  validation(postValidation.createPostSchema),
  postService.createPost,
);

postRouter.get("/get-posts", authentication, postService.getPosts);

postRouter.patch(
  "/like-post/:postId",
  authentication,
  validation(postValidation.likePostSchema),
  postService.likeAndDislikePost,
);

postRouter.patch(
  "/update-post/:postId",
  authentication,
  multerCloud().array("attachments"),
  validation(postValidation.updatePostSchema),
  postService.updatePost,
);

export default postRouter;
