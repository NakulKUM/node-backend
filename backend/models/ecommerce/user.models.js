import mongoose from "mongoose";
const userSchema= new mongoose.Schema({
   name: {
      type: String,
      required: true,
      unique: true,
   },
   email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
   },
   email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
   }
}, {timestamp: true})

export const User= mongoose.model("User", userSchema);