//~ Assignment 21 ~//

import BaseRepository from "./base.repository";
import chatModel, { IChat } from "../models/chat.model";
import { APPError } from "../../common/utils/global-error-handler";
import { Types } from "mongoose";

class ChatRepository extends BaseRepository<IChat> {
  constructor() {
    super(chatModel);
  }
  async checkChatExists(_id: Types.ObjectId) {
    const chatExists = await this.findOne({ filter: { _id } });

    if (chatExists) {
      throw new APPError("chat already exists", 409);
    }
  }
}

export default ChatRepository;
