//~ Assignment 20 ~//

import type { Request, Response, NextFunction } from "express";

export class APPError extends Error {
  message: any;
  statusCode: number;
  constructor(message: any, statusCode: number = 500) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
  }
}

export const globalErrorHandler = (
  err: APPError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const status = (err.statusCode as number) || 500;
  return res
    .status(status)
    .json({ message: err.message, status, stack: err.stack });
};
