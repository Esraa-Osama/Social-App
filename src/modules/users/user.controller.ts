//~ Assignment 20 ~//

import { Router } from "express";
import userService from "./user.service";
import { validation } from "../../common/middleware/validation.middleware";
import * as userValidation from "./user.validation";
import { authentication } from "../../common/middleware/authentication.middleware";
import multerCloud from "../../common/middleware/multerCloud.middleware";

const userRouter = Router({ strict: true, caseSensitive: true });

userRouter.patch(
  "/update-password",
  authentication,
  validation(userValidation.updatePasswordSchema),
  userService.updatePassword,
);

userRouter.get("/get-profile", authentication, userService.getProfile);

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
