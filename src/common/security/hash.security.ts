//~ Assignment 15 ~//

import bcrypt from "bcrypt";
import { SALT_ROUNDS } from "../../config/config.service";

export const applyHash = ({
  plainText,
  saltRounds = SALT_ROUNDS,
}: {
  plainText: string;
  saltRounds?: number;
}): string => {
  return bcrypt.hashSync(plainText, saltRounds);
};

export const compareHash = ({
  plainText,
  hashedText,
}: {
  plainText: string;
  hashedText: string;
}): boolean => {
  return bcrypt.compareSync(plainText, hashedText);
};
