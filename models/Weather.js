const mongoose=require('mongoose');

const weatherSchema=mongoose.Schema({
    localTime:String,
    country:String,
    state:String,
    city:String,
    weatherTest:String,
    weatherDegree:Number,
    icon:String
})

const weatherModel=mongoose.model("Weather",weatherSchema);
module.exports=weatherModel;