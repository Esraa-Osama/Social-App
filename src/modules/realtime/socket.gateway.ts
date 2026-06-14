//~ Assignment 21 ~//

import { Server } from "socket.io";
import { Server as httpServer } from "node:http";
import { decodeTokenAndFetchUser } from "../../common/middleware/authentication.middleware";
import redisService from "../../common/services/redis.service";
import chatGateway from "../chat/realtime/chat.gateway";

class SocketGateway {
  constructor() {}
  initIo = async (httpServer: httpServer) => {
    const io = new Server(httpServer, {
      cors: {
        origin: "*",
      },
    });

    io.use(async (socket, next) => {
      try {
        const { user } = await decodeTokenAndFetchUser(
          socket.handshake.auth.authorization! ||
            socket.handshake.headers.authorization!,
        );
        socket.data.user = user;
        next();
      } catch (error: any) {
        next(error);
      }
    });

    io.on("connection", async (socket) => {
      redisService.addSocket({
        userId: socket.data.user._id,
        socketId: socket.id,
      });

      await chatGateway.registerEvent(socket, io);

      socket.on("disconnect", async () => {
        await redisService.removeSocket({
          userId: socket.data.user._id,
          socketId: socket.id,
        });
      });
    });
  };
}

export default new SocketGateway();
