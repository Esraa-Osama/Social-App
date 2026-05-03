//~ Assignment 17 ~//

import crypto from "node:crypto";
import {
  IV_LENGTH,
  SYMMETRIC_ENCRYPTION_KEY,
} from "../../config/config.service";

const symmetric_encryption_key = Buffer.from(SYMMETRIC_ENCRYPTION_KEY, "hex");

export function encrypt(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    symmetric_encryption_key,
    iv,
  );
  let encrypted = cipher.update(text, "utf-8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}
