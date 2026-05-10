//~ Assignment 18 ~//

import { Router } from "express";
import userService from "./user.service";
import { validation } from "../../common/middleware/validation.middleware";
import * as userValidation from "./user.validation";
import { authentication } from "../../common/middleware/authentication.middleware";
import multerCloud from "../../common/middleware/multerCloud.middleware";
import { StorageEnum } from "../../common/enum/multer.enum";

const userRouter = Router({ strict: true, caseSensitive: true });

userRouter.patch(
  "/update-password",
  authentication,
  validation(userValidation.updatePasswordSchema),
  userService.updatePassword,
);

userRouter.get("/get-profile", authentication, userService.getProfile);

userRouter.patch(
  "/update-profile-picture",
  authentication,
  multerCloud().single("profilePicture"),
  userService.updateProfilePicture,
);

userRouter.patch(
  "/update-big-profile-picture",
  authentication,
  multerCloud({ storageType: StorageEnum.disk }).single("profilePicture"),
  userService.updateBigProfilePicture,
);

userRouter.patch(
  "/update-cover-pictures",
  authentication,
  multerCloud().array("coverPictures"),
  userService.updateCoverPictures,
);

userRouter.post("/upload-profile-picture", authentication, userService.upload);

userRouter.get(
  "/get-and-download-profile-picture-pre-signed/*path",
  authentication,
  userService.getProfilePicture,
);

userRouter.get(
  "/get-and-download-profile-picture/*path",
  authentication,
  userService.getAndDownloadProfilePicture,
);

userRouter.get("/get-files", authentication, userService.getFiles);

userRouter.delete("/delete-file", authentication, userService.deleteFile);

userRouter.delete("/delete-files", authentication, userService.deleteFiles);

userRouter.get("/delete-folder", authentication, userService.deleteFolder);

export default userRouter;
