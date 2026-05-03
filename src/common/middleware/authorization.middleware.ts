//~ Assignment 17 ~//

import type { Request, Response, NextFunction } from "express";
import { RoleEnum } from "../enum/user.enum";

export const authorization = (roles: RoleEnum[] = []) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user!.role!)) {
      throw new Error("you are not authorized", { cause: 401 });
    }
    next();
  };
};
