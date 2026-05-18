//~ Assignment 19 ~//

import BaseRepository from "./base.repository";
import userModel, { IUser } from "../models/user.model";
import { APPError } from "../../common/utils/global-error-handler";
import { ProviderEnum } from "../../common/enum/user.enum";

class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(userModel);
  }

  async checkUserExists(email: string) {
    const userExists = await this.findOne({ filter: { email } });

    if (userExists) {
      throw new APPError("user already exists", 409);
    }
  }

  async checkUserNotExists({
    email,
    provider,
  }: {
    email: string;
    provider?: ProviderEnum;
  }) {
    const user = await this.findOne({ filter: { email, provider: provider! } });
    if (!user) {
      throw new APPError("user not found", 404);
    }

    return user;
  }
}

export default UserRepository;
