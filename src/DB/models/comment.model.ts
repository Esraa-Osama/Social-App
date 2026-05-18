//~ Assignment 19 ~//

import mongoose, { HydratedDocument, Types } from "mongoose";

export interface IComment {
  content?: string;
  attachments?: string[];
  createdBy: Types.ObjectId;
  tags?: Types.ObjectId[];
  likes?: Types.ObjectId[];
  folderId: string;
  postId: Types.ObjectId;
  commentId?: Types.ObjectId;
}

const commentSchema = new mongoose.Schema<IComment>(
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
    folderId: String,
    postId: {
      type: Types.ObjectId,
      ref: "post",
      required: true,
    },
    commentId: {
      type: Types.ObjectId,
      ref: "comment",
      required: true,
    },
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

commentSchema.virtual("replies", {
  ref: "comment",
  localField: "_id",
  foreignField: "commentId",
});

const commentModel =
  mongoose.models.comment || mongoose.model<IComment>("comment", commentSchema);

export default commentModel;
