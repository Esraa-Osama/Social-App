//~ Assignment 18 ~//

import mongoose from "mongoose";
import { DB_URI_ONLINE } from "../config/config.service";

export const checkCBConnection = async () => {
  try {
    await mongoose.connect(DB_URI_ONLINE, { serverSelectionTimeoutMS: 10000 });
    console.log("DB connected successfully ");
  } catch (error) {
    console.log("failed to connect to DB", error);
  }
};
