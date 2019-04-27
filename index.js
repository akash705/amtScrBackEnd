
const express = require('express');
const mongoose = require('mongoose');
const { config,secret } = require('./config/config');
const {usermodel}  = require('./schema/userSchema');
const uid = require('uuid');
const jwt=require('jsonwebtoken');
const bodyParser = require('body-parser');

// imports-------------------------

var app = express();

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// connection------------------------
var check={
    status:false
};
mongoose.connect(`mongodb://localhost:27017/${config.dataBaseName}`,{useNewUrlParser:true}).then(data=>{console.log(`mongodb running `);check.status=true;}).catch(data=>{console.log('mongodb Connection Failed');})
app.listen(config.port,() => console.log(`app listening on port ${config.port}`));
// connection------------------------


app.use((req,res,next)=>{
    if(!check.status){
        return res.send({status:false,error:'Database Error'});
    }
    return next();
})
app.all('/',(req,res)=>{return res.send({status:true,message:'Hey There all , Api has been setup'});})

app.post('/signUp',async (req,res)=>{
    
        if(req.body){
            if(!trimAndCheck(req.body.name))
                return res.send({status:false,error:'Name is required'});
            if(!trimAndCheck(req.body.email))
                return res.send({status:false,error:'Email is required'});
            if(!trimAndCheck(req.body.password))
                return res.send({status:false,error:'Password is required'});
            {
                // checking whether user exists or not 
                let data = await usermodel.findOne({email:req.body.email.trim().toLowerCase()});
                if(data && data.email){
                        return res.send({status:false,error:"User Already Exists"});
                }

            }

            let useData = new usermodel({name:req.body.name.trim(),email:req.body.email.trim().toLowerCase(),uid:uid.v1(),password:req.body.password.trim()});
            useData.save().then(data=>{
                return res.send({status:true,email:req.body.email});
            })
            .catch(data=>{
                return res.send({status:false,error:'Error While inserting Data'});
            })
        }
        
})


app.post('/login',async (req,res)=>{
    let userData = await usermodel.findOne({password:req.body.password, email:req.body.email}).then(data=>{
                        if(data)return {status:true,data:data};
                        else return {status:false,error:"Unable to Find User"};
                    }).catch(err=>({status:false,error:"Db Error"}));
    
    if(!userData || !userData.status) return {status:false,error:"No User Found"};
                
    // generating authentication Token with mongoose methods
    
    userData.data.generateAuthToken().then(token=>{
        if(token){
            return res.send({status:true,uid:userData.data.uid, authtoken:token});
        }else{
            return res.send({status:false,error:"Unable to generate Auth Token"});
        }
    }).catch(error=>{
        return res.send({status:false,error:"Unable to generate Auth Token"});
    });
});

app.post('/logout',async (req,res)=>{
    let token = req.headers.authtoken;
    if(!token) return res.send({status:false,error:"Invalid Token"});
    jwt.verify(token , secret,async (error, result) =>{
        //getting token email 
        if(error || (result===undefined)) {
            console.log('logout error', error);
            return res.send({status:false,error:'Invalid Token'});
        }
        let id = result.id;

        let userData = await usermodel.findOne({email:id}).then(data=>{
            if(!data)   return {status:false,data:data};
            else return {status:true,data:data};
        }).catch(error=>({status:false,error:error}));

        var myjson = {
            $pull: {tokens: {token: token}}
        };

        usermodel.updateOne({
                email: id
            }, myjson).then(data => {
                if (data && data.nModified===1) {
                    return res.send({
                        status: true,
                        data: data
                    });
                }
                else{
                    return res.send({
                        status: false,
                        error: "Invalid Request"
                    });
                }
            })
            .catch(data => {
                return res.send({
                    status: false,
                    error: "Server Error Check logs"
                });
            });
        // logs handling incase of server error
    })
})

function trimAndCheck(data){
    if(!data || !data.trim()){
        return false;
    }
    return true;
}

