import express from 'express';
import Order from "../models/OrderSchema.js"
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

router.post("/create", async (req, res) => {
    if (!req.body) return res.status(400).send({
        message: "body is required"
    })
    console.log("aria: req", req.body)

    const assetID = req.body.assetID
    const owner_address = req.body.owner_address
    const type = req.body.type
    const details = req.body.details
    const price = req.body.price
    const amount = req.body.amount
    const status = req.body.status
    const winner = req.body.winner


        const order = new Order({
            assetID: assetID,
            owner_address: owner_address,
            type: type,
            createTime: new Date().getTime(),
            details: details,
            price: price,
            amount: amount,
            status: status,
            winner: winner
        })
        
        try {
            const savedorder = await order.save()
            logger.log({level: 'info', message: `[success][order][create][${assetID}]`})
            res.send(savedorder)
        } catch (err) {
           res.status(400).send({
                message: err.message
            })
            logger.log({level: 'error', message: `[fail][order][create][${assetID}]`})
        }
})

router.get('/get', async(req,res) => {
    if (!req.body) return res.status(400).send({
        message: "body is required"
    })
    console.log("äria: req = ", req.body)

    const id = req.body._id
    console.log("äria: id = ", id)

    const orders = await Order.find({_id: id})
    console.log("äria: order = ", orders)
    if(orders.length > 0) {
        res.status(200).send({orders});
    } else {        
        res.status(400).send({
            message: "User With Public Key Not Found"
        })
    }
    
});

router.get('/getlist', async(req,res) => {
    if (!req.body) return res.status(400).send({
        message: "body is required"
    })
    console.log("äria: req1 = ", req.body)

    const orders = await Order.find({})
    console.log("äria: order = ", orders)
    if(orders.length > 0) {
        res.status(200).send({orders});
    } else {        
        res.status(400).send({
            message: "User With Public Key Not Found"
        })
    }
    
});

router.post('/update' ,async(req,res) => {
    if (!req.body) return res.status(400).send({
        message: "body is required"
    })

    console.log("äria: id = ", req.body)
    const id = req.body._id
    const assetID = req.body.assetID
    const owner_address = req.body.owner_address
    const type = req.body.type
    const createTime  = new Date().getTime()
    const details = req.body.details
    const price = req.body.price
    const status = req.body.status
    const winner = req.body.winner

    const orders = await Order.find({_id: id})
    console.log("äria: order = ", orders)
    
    if(orders.length > 0) {
        await Order.updateMany({_id: id}, {$set: {assetID: assetID, owner_address: owner_address, type: type, createTime: createTime, details: details, price: price, status: status, winner: winner}})
        res.status(200).send({orders});
    } else {        
        res.status(400).send({
            message: "User With Public Key Not Found"
        })
    }
}); 

router.post('/complete' ,async(req,res) => {
    if (!req.body) return res.status(400).send({
        message: "body is required"
    })

    const id = req.body._id
    const orders = await Order.find({_id: id})
    if(orders.length > 0) {
        await Order.updateMany({_id: id}, {$set: {status: "Completed", winner: orders[0].owner_address}})
        res.status(200).send({orders});
    } else {        
        res.status(400).send({
            message: "User With Public Key Not Found"
        })
    }
}); 

router.post('/delete' ,async(req,res) => {
    if (!req.body) return res.status(400).send({
        message: "body is required"
    })

    const id = req.body._id
    const orders = await Order.find({_id: id})
    if(orders.length > 0) {
        await Order.deleteOne({_id: id})
        res.status(200).send({orders});
    } else {        
        res.status(400).send({
            message: "User With Public Key Not Found"
        })
    }
}); 

export default router;