// adminSchema.js

import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/signupDB", {
     
    });
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection error:", error);
  }
};




const adminSchema = new mongoose.Schema({

 username: {
    type: String,
    required: true,
  },

    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
});

const Admin = mongoose.model("admins", adminSchema);

export { Admin, connectDB };
