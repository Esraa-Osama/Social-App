import BaseRepository from "./base.repository";
import postModel, { IPost } from "../models/post.model";
import { APPError } from "../../common/utils/global-error-handler";
import { Types } from "mongoose";

class PostRepository extends BaseRepository<IPost> {
  constructor() {
    super(postModel);
  }

  async checkPostExists(_id: Types.ObjectId) {
    const postExists = await this._model.findOne({ filter: { _id } });

    if (postExists) {
      throw new APPError("post already exists", 409);
    }
  }
}

export default PostRepository;
