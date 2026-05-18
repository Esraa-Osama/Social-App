//~ Assignment 19 ~//

import { JwtPayload } from "jsonwebtoken";
import { IUser } from "../../DB/models/user.model";
import { HydratedDocument } from "mongoose";

declare module "express-serve-static-core" {
  interface Request {
    user?: HydratedDocument<IUser>;
    decoded?: JwtPayload;
  }
}
