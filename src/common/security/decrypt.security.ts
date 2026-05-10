//~ Assignment 18 ~//

import crypto from "node:crypto";
import { SYMMETRIC_ENCRYPTION_KEY } from "../../config/config.service";

const symmetric_decryption_key = Buffer.from(SYMMETRIC_ENCRYPTION_KEY, "hex");

export function decrypt(text: string) {
  const [ivHex, encryptedText] = text.split(":");
  const iv = Buffer.from(ivHex!, "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    symmetric_decryption_key,
    iv,
  );
  let decrypted = decipher.update(encryptedText!, "hex", "utf-8");
  decrypted += decipher.final("utf-8");
  return decrypted;
}
