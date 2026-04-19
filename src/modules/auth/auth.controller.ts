//~ Assignment 15 ~//

import { Router } from "express";
import authService from "./auth.service";
import { validation } from "../../common/middleware/validation.middleware";
import * as auhValidation from "./auth.validation";

const authRouter = Router({ strict: true, caseSensitive: true });

authRouter.post(
  "/signup",
  validation(auhValidation.signUpSchema),
  authService.signup,
);
authRouter.post(
  "/signin",
  validation(auhValidation.signInSchema),
  authService.signin,
);
authRouter.post(
  "/confirm-email",
  validation(auhValidation.confirmEmailSchema),
  authService.confirmEmail,
);
authRouter.post(
  "/resend-otp",
  validation(auhValidation.resendOTPSchema),
  authService.resendOTP,
);
authRouter.post("/signupAndIn/gmail", authService.signupAndSignInWithGmail);

export default authRouter;
