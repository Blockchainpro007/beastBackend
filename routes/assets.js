import express from 'express';
import Asset from "../models/AssetSchema.js"
import winston from "winston"
import multer from "multer"
import cors from 'cors'

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

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'images/')
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname)
    },
  })
  
  const upload = multer({ storage: storage })
  
  router.use(cors())
  
var asset_ID;



router.post("/create", upload.single('file'), async (req, res) => {
    if (!req.body) return res.status(400).send({
        message: "body is required"
    })
    const url = req.protocol + '://' + req.get('host')
    const type = req.body.type
    const raffle = req.body.raffle
    const name = req.body.name
    const price = req.body.price
    const amount = req.body.amount
    const image = req.body.image


        const asset = new Asset({
            type: type,
            raffle: raffle,
            name: name,
            createTime: new Date().getTime(),
            price: price,
            amount: amount,
            soldamount: 0,
            image: image,
            available: true
        })
        asset_ID = asset._id

        
        
        try {
            const savedasset = await asset.save()
            logger.log({level: 'info', message: `[success][asset][create][${name}]`})
            res.send(savedasset)
        } catch (err) {
            res.status(400).send({
                message: err.message
            })
            logger.log({level: 'error', message: `[fail][asset][create][${name}]`})
        }
    })
    
router.post("/createImage", upload.single('file'), async (req, res) => {
        if (!req.body) return res.status(400).send({
            message: "body is required"
        })
        const url = req.protocol + '://' + req.get('host')
    const image = url + '/images/' + req.file.filename
    console.log("createImage", asset_ID)
    const assets = await Asset.find({_id: asset_ID})
    
    if(assets.length > 0) {
        await Asset.updateOne({_id: asset_ID}, {$set: {image: image}})
        res.status(200).send({assets});
    } else {        
        res.status(400).send({
            message: "User With Public Key Not Found"
        })
    }
})

router.post("/assetSold", upload.single('file'), async (req, res) => {
    if (!req.body) return res.status(400).send({
        message: "body is required"
    })

    const id = req.body.id
    const assets = await Asset.find({_id: id})
    let _amount = assets[0].amount - 1
    let _soldamount = assets[0].soldamount + 1
    if(assets.length > 0) {
        await Asset.updateMany({_id: id}, {$set: {amount: _amount, soldamount: _soldamount}})
        res.status(200).send({assets});
    } else {        
        res.status(400).send({
        message: "User With Public Key Not Found"
    })
    }
})

router.get('/get', async(req,res) => {
    if (!req.body) return res.status(400).send({
        message: "body is required"
    })

    const id = req.body._id

    const assets = await Asset.find({_id: id})
    if(assets.length > 0) {
        res.status(200).send({assets});
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

    const assets = await Asset.find({})
    if(assets.length > 0) {
        res.status(200).send({assets});
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

    const id = req.body._id
    const type = req.body.type
    const createTime = new Date().getTime()
    const name = req.body.name
    const price = req.body.price
    const image = req.body.image

    const assets = await Asset.find({_id: id})
    
    if(assets.length > 0) {
        await Asset.updateMany({_id: id}, {$set: {type: type, name: name, createTime: createTime, price: price, image: image}})
        res.status(200).send({assets});
    } else {        
        res.status(400).send({
            message: "User With Public Key Not Found"
        })
    }
}); 

export default router;