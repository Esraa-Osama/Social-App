//~ Assignment 15 ~//

import jwt, { JwtPayload, SignOptions, VerifyOptions } from "jsonwebtoken";

export const generateToken = ({
  payload,
  secret_key,
  options,
}: {
  payload: string | object | Buffer;
  secret_key: string;
  options?: SignOptions;
}): string => {
  return jwt.sign(payload, secret_key, options);
};

export const verifyToken = ({
  token,
  secret_key,
  options,
}: {
  token: string;
  secret_key: string;
  options?: VerifyOptions;
}): string | JwtPayload => {
  return jwt.verify(token, secret_key, options);
};
