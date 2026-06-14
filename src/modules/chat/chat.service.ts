//~ Assignment 21 ~//

import { Request, Response, NextFunction } from "express";
import UserRepository from "../../DB/repositories/user.repository";
import { APPError } from "../../common/utils/global-error-handler";
import ChatRepository from "../../DB/repositories/chat.repository";
import { successResponse } from "../../common/utils/response.success";
import { Server, Socket } from "socket.io";
import redisService from "../../common/services/redis.service";

class ChatService {
  private readonly _userModel = new UserRepository();
  private readonly _chatModel = new ChatRepository();
  private readonly _redisService = redisService;

  constructor() {}

  // REST APIs
  getUserChat = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    const chat = await this._chatModel.findOne({
      filter: {
        participants: {
          $all: [req.user?._id!, userId],
        },
        group: { $exists: false },
      },
      projection: {
        messages: { $slice: [-5, 5] },
      },
      options: {
        populate: { path: "participants" },
      },
    });

    successResponse({ res, data: { chat } });
  };

  // SOCKET.IO
  sayHi = async (data: any) => {
    console.log(data);
  };

  sendMessage = async (data: any, socket: Socket, io: Server) => {
    const { sendTo, content } = data;
    const createdBy = socket.data.user._id;
    const user = await this._userModel.findOne({
      filter: {
        _id: sendTo,
      },
    });

    if (!user) {
      throw new APPError("user you want to chat with not found", 404);
    }

    const chat = await this._chatModel.findOneAndUpdate({
      filter: {
        participants: { $all: [createdBy, sendTo] },
        group: { $exists: false },
      },
      updates: {
        $push: {
          messages: {
            content,
            createdBy,
          },
        },
      },
    });

    if (!chat) {
      await this._chatModel.create({
        createdBy,
        messages: [{ content, createdBy }],
        participants: [createdBy, sendTo],
      });
    }

    const senderSocketIds = await this._redisService.getSockets(createdBy);
    io.to(senderSocketIds).emit("successMessage", { content });

    const receiverSocketIds = await this._redisService.getSockets(sendTo);
    io.to(receiverSocketIds).emit("newMessage", {
      content,
      from: socket.data.user,
    });
  };
}

export default new ChatService();
