import mongoose from "mongoose";
import jwt from 'jsonwebtoken'
import { privateKey } from "../middleware/decryption.js";

const UserSchema = mongoose.Schema({
    public_key: {
        type: String,
        required: true
    },
    scoreHistory: {
        type: Array,
        required: true,
        default: []
    },
    createTime: {
        type: Number,
        default: Date.now()
    },
    login: {
        type: Boolean,
        required: true,
        default: false
    },
    token: {
        type: String
    }
})

UserSchema.methods.generateToken=function(cb){
    var user =this;
    var token=jwt.sign(user._id.toHexString(),privateKey);

    user.token=token;
    user.save(function(err,user){
        if(err) return cb(err);
        cb(null,user);
    })
}

UserSchema.statics.findByToken=function(token,cb){
    var user=this;

    jwt.verify(token,privateKey,function(err,decode){
        user.findOne({"_id": decode, "token":token},function(err,user){
            if(err) return cb(err);
            cb(null,user);
        })
    })
};

UserSchema.methods.deleteToken=function(token,cb){
    var user=this;

    user.updateOne({$unset : {token :1}},function(err,user){
        if(err) return cb(err);
        cb(null,user);
    })
}

export default mongoose.model('users', UserSchema)
