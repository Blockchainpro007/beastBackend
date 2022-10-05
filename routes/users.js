import express from 'express';
import User from "../models/UserSchema.js"
import auth from "../middleware/auth.js"
import winston from "winston"

const router = express.Router()

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    ),
    transports: [
      //
      // - Write all logs with importance level of `error` or less to `error.log`
      // - Write all logs with importance level of `info` or less to `combined.log`
      //
      new winston.transports.File({ filename: 'logos/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logos/info.log' }),
    ],
});

if(process.env.NODE_ENV != 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

router.post("/login", async (req, res) => {
    if (!req.body) return res.status(400).send({
        message: "body is required"
    })

    const public_key = req.body.public_key.toLowerCase()

    const users = await User.find({
        public_key: public_key
    });

    if (users.length === 0) {
        const user = new User({
            public_key: public_key,
            scoreHistory: [],
            createTime: new Date().getTime(),
            login: true
        })
        
        try {
            const saveduser = await user.save()
            logger.log({level: 'info', message: `[success][user][create][${public_key}]`})
            res.send(saveduser)
        } catch (err) {
           res.status(400).send({
                message: err.message
            })
            logger.log({level: 'error', message: `[fail][user][create][${public_key}]`})
        }
    } else {
        await User.updateOne({public_key: public_key}, {$set: {login: true}})
        res.send(users[0])
    }
})

router.post('/logout' ,async(req,res) => {
    if (!req.body) return res.status(400).send({
        message: "body is required"
    })

    const public_key = req.body.public_key.toLowerCase()

    const users = await User.find({public_key: public_key})
    if(users.length > 0) {
        await User.updateOne({public_key: public_key}, {$set: {login: false}})
        res.status(200).send({logout: 'success'});
    } else {        
        res.status(400).send({
            message: "User With Public Key Not Found"
        })
    }
}); 

router.post('/islogin', async(req,res) => {
    if (!req.body) return res.status(400).send({
        message: "body is required"
    })

    const public_key = req.body.public_key.toLowerCase()

    const users = await User.find({public_key: public_key, login: true})
    if(users.length > 0) {
        res.status(200).send({login: true});
    } else {            
        res.status(200).send({login: false});
    }
}); 

router.post('/scoredata', async(req,res) => {
    if (!req.body) return res.status(400).send({
        message: "body is required"
    })

    const public_key = req.body.public_key.toLowerCase()
    console.log("sniper: public_key: ", public_key)

    const users = await User.find({public_key: public_key, login: true})
    if(users.length > 0) {
        res.status(200).send({
            createTime: users[0].createTime,
            scoreHistory: users[0].scoreHistory
        });
    } else {            
        res.status(400).send({
            message: "User With Public Key Not Found"
        })
    }
}); 

// router.post("/signup", async (req, res) => {
//     if (!req.body) return res.status(400).send({
//         message: "body is required"
//     })

//     const getPublicKey = await User.find({
//         public_key: req.body.public_key
//     });

//     if (getPublicKey.length === 0) {
//         const user = new User({
//             public_key: req.body.public_key,
//             sponsor_key: '',
//         })
//         try {
//             const saveduser = await user.save()
//             logger.log({level: 'info', message: `[success][user][loginwithoutsponsor][${req.body.public_key}]`})
//             res.send(saveduser)
//         } catch (err) {
//            res.status(400).send({
//                 message: err.message
//             })
//             logger.log({level: 'error', message: `[fail][user][loginwithoutsponsor][${req.body.public_key}]`})
//         }
//     } else {
//         res.status(400).send({
//             message: "This public key already in the database."
//         })
//     }
// })

// -------------------------login user-----------------------
// router.post("/login", async (req, res) => {
//     if (!req.body) return res.status(400).send({
//         message: "body is required"
//     })
//     try {
//         let token=req.body.token;
//         User.findByToken(token,async(err,user)=>{
//             if(err) return  res(err);
//             if(user) return res.status(200).send({
//                 isAuth: true,
//                 id: "You are already logged in"
//             });

//             else {
//                 const getUser = await User.find({
//                     public_key: req.body.public_key.toLowerCase()
//                 });
                
//                 if (getUser.length > 0) {
                    
//                     getUser[0].generateToken((err,user)=>{
//                         if(err) return res.status(400).send(err);
//                         res.cookie('auth',user.token).json({
//                             isAuth : true,
//                             id : user._id,
//                             public_key : user.public_key,
//                             token: user.token
//                         });
//                     }); 
        
//                     // res.send({
//                     //     user: getUser[0]
//                     // })
//                 } else {
//                     res.status(400).send({
//                         message: "User With Public Key Not Found"
//                     })
//                 }
//             }
//         })
        
//     } catch (err) {
//         res.status(400).send({
//             message: err.message
//         })
//     }
// })

// router.post('/logout',auth,async(req,res) => {
//     const user = await User.find({public_key: req.public_key})
//     if(user.length > 0) {
//         user[0].deleteToken(req.token,(err,user)=>{
//             if(err) return res.status(400).send(err);
//             res.sendStatus(200);
//         });
//     } else {        
//         res.status(400).send({
//             message: "User With Public Key Not Found"
//         })
//     }
// }); 

// router.post('/islogin', async(req,res) => {
//     let token =req.body.token;
//     User.findByToken(token,(err,user)=>{
//         if(err) throw err;
//         if(!user) return res.send({
//             status: false
//         });

//         if(user.public_key != req.body.public_key) return res.send({
//             status: false
//         })

//         return res.send({
//             status: true
//         })
//     })
// }); 

export default router;