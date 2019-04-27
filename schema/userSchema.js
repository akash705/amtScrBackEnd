var mongoose= require('mongoose');
var schema = mongoose.Schema;
const jwt = require('jsonwebtoken');
const {secret} = require('../config/config');


var userschema = new schema({
    uid:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        requrie:true
    },
    tokens: [{
        access: {
          type: String,
          required: true
        },
        token: {
          type: String,
          required: true
        }
    }] 
});

userschema.methods.generateAuthToken=async function () {
    let user = this;
    let access = 'auth';
    let token = jwt.sign({id: user.email, access}, secret).toString();
    user.tokens.push({access, token});

    return user.save().then(() => {
      return token;
    });
};
userschema.statics.findbytoken=function(token){
    // var User=this;
    var decode;
    try{
       decode = jwt.verify(token, secret);
    }
    catch(e)
    {
        return Promise.reject("Invalid Token");
    }
    return usermodel.findOne({
        'email':decode.id,
        'tokens.access':'auth',
        'tokens.token':token
    });
    // method to find one user
  }

var usermodel = mongoose.model('user', userschema);

module.exports={
    usermodel
}