//~ Assignment 21 ~//

import { Router } from "express";
import chatService from "./chat.service";
import { authentication } from "../../common/middleware/authentication.middleware";

const chatRouter = Router({ mergeParams: true });

chatRouter.get("/", authentication, chatService.getUserChat);

export default chatRouter;
