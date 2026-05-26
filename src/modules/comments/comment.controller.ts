//~ Assignment 20 ~//

import { Router } from "express";
import { authentication } from "../../common/middleware/authentication.middleware";
import multerCloud from "../../common/middleware/multerCloud.middleware";
import commentService from "./comment.service";
import { validation } from "../../common/middleware/validation.middleware";
import * as commentValidation from "./comment.validation";

const commentRouter = Router({ mergeParams: true });

commentRouter.post(
  "/",
  authentication,
  multerCloud().array("attachments"),
  validation(commentValidation.createCommentOrReplySchema),
  commentService.createCommentOrReply,
);

commentRouter.get("/", authentication, commentService.getCommentOrReply);

commentRouter.get("/all", authentication, commentService.getCommentsOrReplies);

commentRouter.post(
  "/update",
  authentication,
  multerCloud().array("attachments"),
  validation(commentValidation.updateCommentOrReplySchema),
  commentService.updateCommentOrReply,
);

commentRouter.patch(
  "/like",
  authentication,
  validation(commentValidation.likeAndDislikeCommentOrReplySchema),
  commentService.likeAndDislikeCommentOrReply,
);

commentRouter.delete(
  "/delete",
  authentication,
  commentService.deleteCommentOrReply,
);

export default commentRouter;
