import User from '../models/UserSchema.js'

const auth =(req,res,next)=>{
    let token =req.body.token;
    User.findByToken(token,(err,user)=>{
        if(err) throw err;
        if(!user) return res.json({
            error :true
        });

        req.token= token;
        req.public_key=user.public_key;
        next();

    })
}

export default auth