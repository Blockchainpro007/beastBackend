import mongoose from "mongoose";
import jwt from 'jsonwebtoken'
import { privateKey } from "../middleware/decryption.js";

const AssetSchema = mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    raffle: {
        type: Boolean,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    createTime: {
        type: Number,
        default: Date.now()
    },
    price: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    soldamount: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    avaliable: {
        type: Boolean
    }
    
})



export default mongoose.model('assets', AssetSchema)
