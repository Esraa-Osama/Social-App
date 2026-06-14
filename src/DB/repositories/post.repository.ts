//~ Assignment 21 ~//

import BaseRepository from "./base.repository";
import postModel, { IPost } from "../models/post.model";
import { APPError } from "../../common/utils/global-error-handler";
import { Types } from "mongoose";

class PostRepository extends BaseRepository<IPost> {
  constructor() {
    super(postModel);
  }
}

export default PostRepository;
