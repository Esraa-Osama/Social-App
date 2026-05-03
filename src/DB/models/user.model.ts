//~ Assignment 17 ~//

import {
  GenderEnum,
  RoleEnum,
  ProviderEnum,
} from "./../../common/enum/user.enum";
import mongoose from "mongoose";

export interface IUser {
  firstName: string;
  lastName: string;
  userName?: string;
  email: string;
  password?: string;
  age?: number;
  phone?: string;
  address?: string;
  gender?: GenderEnum;
  role?: RoleEnum;
  confirmed?: Boolean;
  provider?: ProviderEnum;
  changeCredential?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      min: 3,
      max: 25,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      min: 3,
      max: 25,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: function (): boolean {
        return this.provider == ProviderEnum.google ? false : true;
      },
      trim: true,
      min: 3,
      max: 25,
    },
    age: {
      type: Number,
      required: function (): boolean {
        return this.provider == ProviderEnum.google ? false : true;
      },
      trim: true,
      min: 18,
      max: 60,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: GenderEnum,
    },
    role: {
      type: String,
      enum: RoleEnum,
      default: RoleEnum.user,
    },
    confirmed: Boolean,
    provider: {
      type: String,
      enum: ProviderEnum,
      default: ProviderEnum.system,
    },
    changeCredential: Date,
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema
  .virtual("userName")
  .get(function () {
    return this.firstName + " " + this.lastName;
  })
  .set(function (value: string) {
    this.set({ firstName: value.split(" ")[0], lastName: value.split(" ")[1] });
  });

const userModel =
  mongoose.models.user || mongoose.model<IUser>("user", userSchema);

export default userModel;
