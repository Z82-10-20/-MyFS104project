import mongoose from "mongoose";

const connect = mongoose.connect("mongodb://127.0.0.1:27017/signupDB");

connect.then(() => {
    console.log("Database connected successfully");
}).catch(() => {
    console.log("Database cannot be connected");
});

const loginSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: { // Add the email field
        type: String,
        required: true,
        unique: true // Ensure email addresses are unique
    },
    password: {
        type: String,
        required: true
    },
 profilePicture: {
  fileId: String, // Unique identifier for the image
  filename: String,
  contentType: String,
  data: Buffer,
}

});

const collection = mongoose.model("users", loginSchema);

export default collection;



















