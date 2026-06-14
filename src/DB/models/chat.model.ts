//~ Assignment 21 ~//

import mongoose, { HydratedDocument, Types } from "mongoose";

export interface IMessage {
  createdBy: Types.ObjectId;
  content: string;
}

export interface IChat {
  //ovo
  createdBy: Types.ObjectId;
  participants: Types.ObjectId[];
  messages: IMessage[];
  //ovm
  group: string;
  groupImage: string;
  roomId: string;
}

const messageSchema = new mongoose.Schema<IMessage>(
  {
    createdBy: {
      type: Types.ObjectId,
      ref: "user",
      required: true,
    },
    content: {
      type: String,
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

const chatSchema = new mongoose.Schema<IChat>(
  {
    //ovo
    createdBy: {
      type: Types.ObjectId,
      ref: "user",
      required: true,
    },
    participants: [{ type: Types.ObjectId, ref: "user", required: true }],
    messages: {
      type: [messageSchema],
      required: true,
    },
    //ovm
    group: String,
    groupImage: String,
    roomId: String,
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const chatModel =
  mongoose.models.chat || mongoose.model<IChat>("chat", chatSchema);

export default chatModel;
