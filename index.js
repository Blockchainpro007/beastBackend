
import express from "express"
import mongoose from "mongoose"
import 'dotenv/config'
import cors from 'cors'

import authRoutes from "./routes/users.js"
import assetsRoutes from "./routes/assets.js"
import ordersRoutes from "./routes/orders.js"

import decryptoin from "./middleware/decryption.js"
import morgan from "morgan"
import path from "path"
import fs from "fs"
import bodyParser from "body-parser"
import cookieParser from 'cookie-parser'
import multer from "multer"
import http from "http"
import url from "url"


const app = express()

 
// Creating server to accept request
app.use(express.static('public')); 
app.use('/images', express.static('images'));
// const multer = require('multer')
app.use(express.json())

var accessLogStream = fs.createWriteStream(path.join('logos/', 'access.log'), { flags: 'a' })
// setup the logger
app.use(morgan('combined', { stream: accessLogStream }))

// install middleware for decryption
app.use(decryptoin)

// Routes
// ------------------------------------
app.use(cors())
app.use(bodyParser.json())
app.use(cookieParser());

app.use("/auth", authRoutes)
app.use("/asset", assetsRoutes)
app.use("/order", ordersRoutes)

// Connection With Database
mongoose.connect(process.env.MONGO_URI).then((res)=>{
    console.log("connected to DB")
})
.catch((err)=> console.log(err.message))

app.get('/', (req, res) => {
    res.send("We are on home today")
})

// app listening 
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));