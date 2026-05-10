import { Router } from "express";
import { authentication } from "../../common/middleware/authentication.middleware";
import multerCloud from "../../common/middleware/multerCloud.middleware";
import { StorageEnum } from "../../common/enum/multer.enum";
import postService from "./post.service";
import { validation } from "../../common/middleware/validation.middleware";
import * as postValidation from "./post.validation";

const postRouter = Router();

postRouter.post(
  "/create-post",
  authentication,
  multerCloud().array("attachments"),
  validation(postValidation.createPostSchema),
  postService.createPost,
);

export default postRouter;
