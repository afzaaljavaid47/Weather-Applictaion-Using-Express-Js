const mongoose=require('mongoose')
var bcrypt=require('bcrypt');
const registerSchema=new mongoose.Schema({
    firstName:String,
    lastName:String,
    email:String,
    gender:String,
    age:Number,
    phone:String,
    password:String
})

registerSchema.pre("save",async function(next){
    this.password=await bcrypt.hash(this.password,10);
    next();
})


const registerModel=mongoose.model('Users',registerSchema);
module.exports=registerModel;