//~ Assignment 21 ~//

import { OTPKeyEnum, otpTemplateEnum } from "./../../enum/otpKey.enum";

export const emailTemplate = ({
  otp,
  type,
}: {
  otp: string;
  type: OTPKeyEnum;
}) => {
  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>OTP Verification</title>
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
      font-family: Arial, sans-serif;
    "
  >
    <table
      align="center"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      style="padding: 20px"
    >
      <tr>
        <td align="center">
          <!-- Container -->
          <table
            width="400"
            cellpadding="0"
            cellspacing="0"
            style="background: #ffffff; border-radius: 10px; padding: 20px"
          >
            <!-- Header -->
            <tr>
              <td
                align="center"
                style="padding-bottom: 20px; background-color: light"
              >
                <h2
                  style="
                    padding: 10px 0;
                    background: #0000ff50;
                    border-radius: 8px;
                  "
                >
                  Social App
                </h2>
              </td>
            </tr>

            <!-- Message -->
            <tr>
              <td
                align="center"
                style="color: #555; font-size: 14px; line-height: 1.6"
              >
                Use the OTP below to ${type == OTPKeyEnum.signUp ? otpTemplateEnum.signUp : otpTemplateEnum.resetPassword}
                <br /><br />
                This code will expire in <strong>2 minutes</strong>.
              </td>
            </tr>

            <!-- OTP Box -->
            <tr>
              <td align="center" style="padding: 20px 0">
                <div
                  style="
                    display: inline-block;
                    background: #0000ff50;
                    padding: 15px 25px;
                    font-size: 24px;
                    letter-spacing: 5px;
                    font-weight: bold;
                    color: #333;
                    border-radius: 8px;
                  "
                >
                  OTP: ${otp}
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="color: #999; font-size: 12px">
                If you didn't request this, you can ignore this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};
