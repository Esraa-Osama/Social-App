//~ Assignment 20 ~//

import mongoose, { HydratedDocument, Types } from "mongoose";
import { On_Model_Enum } from "../../common/enum/post.enum";

export interface IComment {
  content?: string;
  attachments?: string[];
  createdBy: Types.ObjectId;
  tags?: Types.ObjectId[];
  likes?: Types.ObjectId[];
  folderId: string;
  refId: Types.ObjectId;
  onModel: On_Model_Enum;
  deletedAt?: Date;
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

    refId: {
      type: Types.ObjectId,
      refPath: "onModel",
      required: true,
    },
    onModel: {
      type: String,
      enum: On_Model_Enum,
      required: true,
    },
    deletedAt: Date,
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
  foreignField: "refId",
});

commentSchema.pre(/^find/, async function (this: any) {
  const { paranoid, ...rest } = this.getQuery();
  if (paranoid == false) {
    this.setQuery({ ...rest });
  } else {
    this.setQuery({ deletedAt: { $exists: false }, ...rest });
  }
});

commentSchema.pre(/^findOneAnd/, async function (this: any) {
  const { paranoid, ...rest } = this.getQuery();
  if (paranoid == false) {
    this.setQuery({ ...rest });
  } else {
    this.setQuery({ deletedAt: { $exists: false }, ...rest });
  }
});

const commentModel =
  mongoose.models.comment || mongoose.model<IComment>("comment", commentSchema);

export default commentModel;
