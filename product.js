// product.js

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const productSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    // Add more fields as needed for your product data
});

const Product = model('Product', productSchema);

export default Product;
