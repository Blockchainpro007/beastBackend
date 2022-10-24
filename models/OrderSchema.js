import mongoose from "mongoose";
import jwt from 'jsonwebtoken'
import { privateKey } from "../middleware/decryption.js";

const OrderSchema = mongoose.Schema({
    assetID: {
        type: String,
        required: true
    },
    owner_address: {
        type: String,
        required: true
    },
    type: {
        type: Boolean,
        required: true
    },
    createTime: {
        type: Number,
        default: Date.now()
    },
    details: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    winner: {
        type: String
    }
    
})



export default mongoose.model('orders', OrderSchema)
