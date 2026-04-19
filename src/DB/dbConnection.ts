//~ Assignment 15 ~//

import mongoose from "mongoose";
import { DB_URI } from "../config/config.service";

export const checkCBConnection = async () => {
  try {
    await mongoose.connect(DB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log("DB connected successfully ");
  } catch (error) {
    console.log("failed to connect to DB", error);
  }
};
