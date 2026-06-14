//~ Assignment 21 ~//

import { Router } from "express";
import userService from "./user.service";
import { validation } from "../../common/middleware/validation.middleware";
import * as userValidation from "./user.validation";
import { authentication } from "../../common/middleware/authentication.middleware";
import multerCloud from "../../common/middleware/multerCloud.middleware";
import chatRouter from "../chat/chat.controller";

const userRouter = Router({ strict: true, caseSensitive: true });

userRouter.use("/:userId/chat", chatRouter);

userRouter.patch(
  "/update-password",
  authentication,
  validation(userValidation.updatePasswordSchema),
  userService.updatePassword,
);

userRouter.get("/get-profile", authentication, userService.getProfile);

userRouter.get(
  "/get-and-download-profile-picture/*path",
  authentication,
  userService.getAndDownloadProfilePicture,
);

userRouter.patch(
  "/update-profile",
  authentication,
  validation(userValidation.updateProfileSchema),
  userService.updateProfile,
);

userRouter.patch(
  "/update-profile-picture",
  authentication,
  multerCloud().single("attachment"),
  validation(userValidation.updateProfilePictureSchema),
  userService.updateProfilePicture,
);

userRouter.delete("/delete-account", authentication, userService.deleteAccount);

export default userRouter;
