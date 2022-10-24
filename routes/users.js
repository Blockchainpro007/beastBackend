import express from 'express';
import User from "../models/UserSchema.js"
import auth from "../middleware/auth.js"
import winston from "winston"
import pkg from "@apollo/client"
import fetch from 'cross-fetch';


const router = express.Router()
const { ApolloClient, gql, InMemoryCache, HttpLink } = pkg;
const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/34591/epicbeast_mainnet/0.0.1'

const getMetadatas = async (ids) => {
    const ipfsUrl = "https://api.epicbeast.io/metadata/epicbeast/"
    let results = [];
    for (let i = 0; i < ids.length; i ++) {
      await fetch(`${ipfsUrl}${ids[i]}.json`)
      .then((res) => res.json())
      .then((json) => {
        results.push(json)
      })
    }  
    
    return results
  }


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
var totalScore = 0;

router.post("/login", async (req, res) => {
    if (!req.body) return res.status(400).send({
        message: "body is required"
    })


const usersQuery = `
    query($user: Bytes!) {
        epicNFTHolders(where: {owner: $user}) {
          tokenId
          owner
          approved
        }
      }
`
const client = new ApolloClient({
    link: new HttpLink({ uri: SUBGRAPH_URL, fetch }),
    cache: new InMemoryCache(),
  });




const public_key = req.body.public_key.toLowerCase()
const data = await client.query({query: gql(usersQuery),variables:{user:public_key}})
      console.log("sniper: owners: ", data)

      const _owners = data.data.epicNFTHolders.map((item, ind) => {
        return {
          id: item.tokenId
          //   owner: item.owner
        }
    })
    
    var arrayOfNFTs = _owners.map(function(obj) {
        return obj.id;
    });
    if (arrayOfNFTs.length < 15){
        totalScore = 0.2
    } else if (15 < arrayOfNFTs.length < 51){
        totalScore = 1.65
    } else {
        totalScore = 9
    }

    console.log("sniper: owners1: ", _owners)
    const metadata = await getMetadatas(arrayOfNFTs)
    console.log("sniper: metadata: ", metadata)
    var arrayOfmetadata = metadata.map(function(obj) {
        return obj.attributes;
    });
    let originalBeast;
    let isOriginalBeast;
    let isEpicBeast;
    let skinOfNFT;
    let isAzure;
    let isCherry;
    for(var i = 0; i < arrayOfmetadata.length; i++) {
        for(var j = 0; j < arrayOfmetadata[i].length; j++) {
            if (arrayOfmetadata[i][j].trait_type == "Original Beast"){
                originalBeast = arrayOfmetadata[i][j].value
                if(originalBeast == "yes"){
                    isOriginalBeast = true
                } else if(originalBeast == "no"){
                    isEpicBeast = true
                }
                console.log("sniper: metadata1: ", originalBeast)
            }
            if (arrayOfmetadata[i][j].trait_type == "Skin"){
                skinOfNFT = arrayOfmetadata[i][j].value
                if(skinOfNFT == "Azure"){
                    isAzure = true
                }else if(skinOfNFT == "Cherry"){
                    isCherry = true
                }
                console.log("sniper: metadata1: ", skinOfNFT)
            }

        }
    }
    const users = await User.find({
        public_key: public_key
    });
    
    
    if (users.length === 0) {
        const user = new User({
            nfts: arrayOfNFTs,
            public_key: public_key,
            allScore: 0,
            scoreHistory: 0,
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
        console.log("userdata: ", users[0].allScore)
        if(isOriginalBeast == true){
            totalScore += 0.075
            if(isEpicBeast == true){
                totalScore += 0.025
            }
            if(isAzure == true){
                totalScore += 0.05
            } else if(isCherry == true){
                totalScore += 0.05
            } 
        } else {
            totalScore = 0
        }
        
        let currentTime = new Date().getTime()
        let rate = (currentTime - users[0].createTime)/86400000
        let scoreValue = users[0].scoreHistory + totalScore*rate
        await User.updateMany({public_key: public_key}, {$set: {scoreHistory: scoreValue, createTime: currentTime, login: true}})
        res.send(users[0])
    }
})

router.post('/claim' ,async(req,res) => {
    const public_key = req.body.public_key.toLowerCase()

    const users = await User.find({public_key: public_key})
    if(users.length > 0) {
        console.log("claim: ", users[0].allScore)
        console.log("claim: ", users[0].scoreHistory)
        let score = users[0].allScore
        let addScore = users[0].scoreHistory
        score += addScore
        await User.updateMany({public_key: public_key}, {$set: {allScore:score,  scoreHistory: 0}})
        res.status(200).send({logout: 'success'});
    }
})

router.post('/logout' ,async(req,res) => {
    if (!req.body) return res.status(400).send({
        message: "body is required"
    })

    const public_key = req.body.public_key.toLowerCase()

    const users = await User.find({public_key: public_key})
    if(users.length > 0) {
        await User.updateMany({public_key: public_key}, {$set: {login: false, scoreHistory: totalScore}})
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

    console.log("sniper: public_key: ", req.body.public_key)
    const public_key = req.body.public_key.toLowerCase()

    const users = await User.find({public_key: public_key, login: true})
    if(users.length > 0) {
        let currentTime = new Date().getTime()

        let rate = (currentTime - users[0].createTime)/86400000
        let scoreValue = users[0].scoreHistory + totalScore*rate
        await User.updateMany({public_key: public_key}, {$set: {scoreHistory: scoreValue, createTime: currentTime, login: true}})
        res.status(200).send({
            createTime: users[0].createTime,
            allScore: users[0].allScore,
            scoreHistory: users[0].scoreHistory
        });
    } else {            
        res.status(400).send({
            message: "User With Public Key Not Found"
        })
    }
}); 

router.post('/nfts', async(req,res) => {
    if (!req.body) return res.status(400).send({
        message: "body is required"
    })

    console.log("sniper: public_key: ", req.body.public_key)
    const public_key = req.body.public_key.toLowerCase()

    const users = await User.find({public_key: public_key, login: true})
    if(users.length > 0) {
        res.status(200).send({
            nfts: users[0].nfts,
        });
    } else {            
        res.status(400).send({
            message: "User With Public Key Not Found"
        })
    }
}); 


export default router;