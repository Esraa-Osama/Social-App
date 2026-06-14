//~ Assignment 21 ~//

import { Server, Socket } from "socket.io";
import chatService from "../chat.service";

class ChatEvent {
  constructor() {}

  sayHi = async (socket: Socket) => {
    socket.on("sayHi", async (data) => {
      await chatService.sayHi(data);
    });
  };

  sendMessage = async (socket: Socket, io: Server) => {
    socket.on("sendMessage", async (data) => {
      await chatService.sendMessage(data, socket, io);
    });
  };
}
export default new ChatEvent();
