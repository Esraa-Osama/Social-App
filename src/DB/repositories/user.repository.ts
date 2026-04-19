//~ Assignment 15 ~//

import BaseRepository from "./base.repository";
import userModel, { IUser } from "../models/user.model";
import { APPError } from "../../common/utils/global-error-handler";

class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(userModel);
  }

  async checkUserExists(email: string) {
    const userExists = await this._model.findOne({ filter: { email } });
    if (userExists) {
      throw new APPError("user already exists", 409);
    }
  }

  async checkUserNotExists({
    email,
    provider,
  }: {
    email: string;
    provider?: string;
  }) {
    const user = await this._model.findOne({ filter: { email, provider } });
    if (!user) {
      throw new APPError("user not found", 404);
    }
    return user;
  }
}

export default UserRepository;
