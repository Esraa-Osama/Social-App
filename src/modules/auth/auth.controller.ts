//~ Assignment 20 ~//

import { Router } from "express";
import authService from "./auth.service";
import { validation } from "../../common/middleware/validation.middleware";
import * as authValidation from "./auth.validation";
import { authentication } from "../../common/middleware/authentication.middleware";

const authRouter = Router({ strict: true, caseSensitive: true });

authRouter.post(
  "/signup",
  validation(authValidation.signUpSchema),
  authService.signup,
);
authRouter.post(
  "/signin",
  validation(authValidation.signInSchema),
  authService.signin,
);
authRouter.post(
  "/confirm-email",
  validation(authValidation.confirmEmailSchema),
  authService.confirmEmail,
);
authRouter.post(
  "/resend-otp",
  validation(authValidation.resendOTPSchema),
  authService.resendOTP,
);
authRouter.post(
  "/signupAndIn/gmail",
  validation(authValidation.signUpAndSignInWithGmailSchema),
  authService.signupAndSignInWithGmail,
);
authRouter.post(
  "/forgot-password",
  validation(authValidation.forgotPasswordSchema),
  authService.forgotPassword,
);
authRouter.post(
  "/reset-password",
  validation(authValidation.resetPasswordSchema),
  authService.resetPassword,
);
authRouter.post("/logout", authentication, authService.logout);

export default authRouter;
