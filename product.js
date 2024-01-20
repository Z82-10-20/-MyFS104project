import mongoose from "mongoose";
const connect = mongoose.connect("mongodb://127.0.0.1:27017/signupDB");

connect.then(() => {
    console.log("Database connected successfully");
}).catch(() => {
    console.log("Database cannot be connected");
});
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    // Other product-related fields
});

const Product = mongoose.model("Product", productSchema);

export default Product;



