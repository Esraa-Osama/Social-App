//~ Assignment 20 ~//

import { Router } from "express";
import { authentication } from "../../common/middleware/authentication.middleware";
import multerCloud from "../../common/middleware/multerCloud.middleware";
import postService from "./post.service";
import { validation } from "../../common/middleware/validation.middleware";
import * as postValidation from "./post.validation";
import commentRouter from "../comments/comment.controller";

const postRouter = Router();

postRouter.use(
  "/:postId/comments/create-comment{/:commentId/create-reply}",
  commentRouter,
);

postRouter.use(
  "/:postId/comments/get-comment/:commentId{/get-reply/:replyId}",
  commentRouter,
);

postRouter.use(
  "/:postId/comments/get-comments{/:commentId//get-replies}",
  commentRouter,
);

postRouter.use(
  "/:postId/comments/update-comment/:commentId{/update-reply/:replyId}",
  commentRouter,
);

postRouter.use(
  "/:postId/comments/like-comment/:commentId{/like-reply/:replyId}",
  commentRouter,
);

postRouter.use(
  "/:postId/comments/delete-comment/:commentId{/delete-reply/:replyId}",
  commentRouter,
);

postRouter.post(
  "/create-post",
  authentication,
  multerCloud().array("attachments"),
  validation(postValidation.createPostSchema),
  postService.createPost,
);

postRouter.get("/get-post/:postId", authentication, postService.getPost);

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

postRouter.delete(
  "/delete-post/:postId",
  authentication,
  postService.deletePost,
);

export default postRouter;
