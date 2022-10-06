
import express from "express"
import mongoose from "mongoose"
import 'dotenv/config'
import cors from 'cors'

import authRoutes from "./routes/users.js"

import decryptoin from "./middleware/decryption.js"
import morgan from "morgan"
import path from "path"
import fs from "fs"
import bodyParser from "body-parser"
import cookieParser from 'cookie-parser'


const app = express()
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