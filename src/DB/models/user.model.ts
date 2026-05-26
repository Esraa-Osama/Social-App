//~ Assignment 20 ~//

import {
  GenderEnum,
  RoleEnum,
  ProviderEnum,
} from "./../../common/enum/user.enum";
import mongoose, { Query, Types } from "mongoose";

export interface IUser {
  firstName: string;
  lastName: string;
  userName?: string;
  email: string;
  password?: string;
  age?: number;
  phone?: string;
  address?: string;
  profilePicture?: string;
  coverPictures?: string[];
  gender?: GenderEnum;
  role?: RoleEnum;
  confirmed?: Boolean;
  friends?: Types.ObjectId[];
  provider?: ProviderEnum;
  changeCredential?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
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
    profilePicture: String,
    coverPictures: [String],
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
    friends: [
      {
        type: Types.ObjectId,
        ref: "user",
      },
    ],
    provider: {
      type: String,
      enum: ProviderEnum,
      default: ProviderEnum.system,
    },
    changeCredential: Date,
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

userSchema
  .virtual("userName")
  .get(function () {
    return this.firstName + " " + this.lastName;
  })
  .set(function (value: string) {
    this.set({ firstName: value.split(" ")[0], lastName: value.split(" ")[1] });
  });

userSchema.pre(/^find/, async function (this: any) {
  const { paranoid, ...rest } = this.getQuery();
  if (paranoid == false) {
    this.setQuery({ ...rest });
  } else {
    this.setQuery({ deletedAt: { $exists: false }, ...rest });
  }
});

userSchema.pre(/^findOneAnd/, async function (this: any) {
  const { paranoid, ...rest } = this.getQuery();
  if (paranoid == false) {
    this.setQuery({ ...rest });
  } else {
    this.setQuery({ deletedAt: { $exists: false }, ...rest });
  }
});

const userModel =
  mongoose.models.user || mongoose.model<IUser>("user", userSchema);

export default userModel;
