//~ Assignment 21 ~//

import type { Request, Response, NextFunction } from "express";
import { RoleEnum } from "../enum/user.enum";
import { APPError } from "../utils/global-error-handler";

export const authorization = (roles: RoleEnum[] = []) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user!.role!)) {
      throw new APPError("you are not authorized", 401);
    }
    next();
  };
};

export const authorizationGQL = async (
  roles: RoleEnum[] = [],
  role: RoleEnum,
) => {
  return async () => {
    if (!roles.includes(role)) {
      throw new APPError("you are not authorized", 401);
    }
  };
};
