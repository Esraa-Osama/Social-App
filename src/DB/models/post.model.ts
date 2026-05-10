import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  Allow_Comment_Enum,
  Availability_Enum,
} from "../../common/enum/post.enum";

export interface IPost {
  content?: string;
  attachments?: string[];
  createdBy: Types.ObjectId;
  tags?: Types.ObjectId[];
  likes?: Types.ObjectId[];
  allowComment: Allow_Comment_Enum;
  availability: Availability_Enum;
  folderId: string;
}

const postSchema = new mongoose.Schema<IPost>(
  {
    content: {
      type: String,
      min: 1,
      required: function (this) {
        return !this.attachments?.length;
      },
    },
    attachments: [String],
    createdBy: {
      type: Types.ObjectId,
      ref: "user",
      required: true,
    },
    tags: [
      {
        type: Types.ObjectId,
        ref: "user",
      },
    ],
    likes: [
      {
        type: Types.ObjectId,
        ref: "user",
      },
    ],
    allowComment: {
      type: String,
      enum: Allow_Comment_Enum,
      default: Allow_Comment_Enum.allow,
    },
    availability: {
      type: String,
      enum: Availability_Enum,
      default: Availability_Enum.public,
    },
    folderId: String,
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
  },
);

const postModel =
  mongoose.models.post || mongoose.model<IPost>("post", postSchema);

export default postModel;
