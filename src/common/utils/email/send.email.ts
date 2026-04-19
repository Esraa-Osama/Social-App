//~ Assignment 15 ~//

import nodemailer from "nodemailer";
import { EMAIL_PASS, EMAIL_USER } from "../../../config/config.service.js";
import Mail from "nodemailer/lib/mailer/index.js";

export const sendEmail = async (mailOptions: Mail.Options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: EMAIL_USER,
    ...mailOptions,
  });
  return info.accepted.length ? true : false;
};

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
