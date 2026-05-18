//~ Assignment 19 ~//

import BaseRepository from "./base.repository";
import commentModel, { IComment } from "../models/comment.model";
import { APPError } from "../../common/utils/global-error-handler";
import { Types } from "mongoose";

class CommentRepository extends BaseRepository<IComment> {
  constructor() {
    super(commentModel);
  }
}

export default CommentRepository;
