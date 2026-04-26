//~ Assignment 16 ~//

import { Router } from "express";
import userService from "./user.service";
import { validation } from "../../common/middleware/validation.middleware";
import * as userValidation from "./user.validation";
import { authentication } from "../../common/middleware/authentication.middleware";

const userRouter = Router({ strict: true, caseSensitive: true });

userRouter.patch(
  "/update-password",
  authentication,
  validation(userValidation.updatePasswordSchema),
  userService.updatePassword,
);

userRouter.get("/get-profile", authentication, userService.getProfile);

export default userRouter;
