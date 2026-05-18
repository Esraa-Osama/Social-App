//~ Assignment 19 ~//

import { Router } from "express";
import { authentication } from "../../common/middleware/authentication.middleware";
import multerCloud from "../../common/middleware/multerCloud.middleware";
import { StorageEnum } from "../../common/enum/multer.enum";
import commentService from "./comment.service";
import { validation } from "../../common/middleware/validation.middleware";
import * as commentValidation from "./comment.validation";

const commentRouter = Router({ mergeParams: true });

commentRouter.post(
  "/create-comment",
  authentication,
  multerCloud().array("attachments"),
  validation(commentValidation.createCommentSchema),
  commentService.createComment,
);

commentRouter.post(
  "/:commentId/create-reply",
  authentication,
  multerCloud().array("attachments"),
  validation(commentValidation.createReplySchema),
  commentService.createReply,
);

export default commentRouter;
