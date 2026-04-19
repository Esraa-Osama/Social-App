//~ Assignment 15 ~//

import type { Request, Response, NextFunction } from "express";
import { APPError } from "../utils/global-error-handler";
import { ZodType } from "zod";

type reqType = keyof Request;
type schemaType = Partial<Record<reqType, ZodType>>;

export const validation = (schema: schemaType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    let validationErrors = [];
    for (const key of Object.keys(schema) as reqType[]) {
      if (!schema[key]) continue;
      const result = await schema[key].safeParseAsync(req[key]);
      if (!result.success) {
        console.log(result.error);
        console.log(result.error.issues);

        for (const error of result.error?.issues) {
          validationErrors.push({
            key,
            message: error.message,
            path: error.path[0],
          });
        }
      }
    }

    if (validationErrors.length > 0) {
      throw new APPError(validationErrors, 400);
    }
    next();
  };
};
