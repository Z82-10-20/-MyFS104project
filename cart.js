import mongoose from "mongoose";

const connect = mongoose.connect("mongodb://127.0.0.1:27017/signupDB");

connect.then(() => {
    console.log("Database connected successfully");
}).catch(() => {
    console.log("Database cannot be connected");
});


const cartItemSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    quantity: {
        type: Number,
        default: 1
    },
});

const CartItem = mongoose.model("CartItem", cartItemSchema);

export default CartItem;
