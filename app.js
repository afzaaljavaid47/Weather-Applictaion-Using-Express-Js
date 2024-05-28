const express=require('express');
const app=express();
const http = require('http');
const path=require('path')
const cookieParser=require('cookie-parser');
require('dotenv').config()
const jwt=require('jsonwebtoken');
const hbs=require('hbs')
const templatesPath=path.join(__dirname,'./Templates')
const partialsPath=path.join(__dirname,'./Components')
app.set('view engine','hbs')
app.set('views',templatesPath)
hbs.registerPartials(partialsPath)
app.use(express.static('public'))
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); 
var mongoose=require('mongoose');
var weatherModel=require('./models/Weather');
var registerModel=require('./models/Register');
var bcrypt=require('bcrypt');
app.use(cookieParser());
const { error } = require('console');
function connectToDB(){
  mongoose.connect(process.env.MONGO_URL)
  .then(()=>console.log("Connected to DB"))
  .catch(err=>console.log("Error connecting to DB ",err))
}

connectToDB();
//HTTP Paths

app.get('',(req,res)=>{
    res.render('index')
})

app.get('/weather',(req,res)=>{
    res.render('weather',{resData:''})
})
app.get('/delete/:id',async (req,res)=>{
  var resDelete=await weatherModel.deleteOne({_id:req.params.id})
  res.redirect('/history')
})

const authToken=async (req,res,next)=>{
  try {
  const verify=await jwt.verify(req.cookies.jwt,process.env.SECRET)
  req.userId=verify._id;
  next();
} catch (error) {
    next();
}
}

app.get('/history',authToken,async (req,res)=>{
  const getUserData=await registerModel.find({_id:req.userId});
  if(getUserData.length>0)
  {
  var dbData=await weatherModel.find();
  res.render('history',{dbData:dbData})
  }
  else
  {
    //res.render('login',{success:"",error:'incorrect token'})
    res.redirect('/login')
  }
})
app.post('/weather',(req,res)=>{
  var city_name=req.body.city_name.split(" ").join("")
  if(city_name===''){
    res.render('weather',{resData:''})
  }
    const options = {
        hostname: 'api.weatherapi.com',
        path: `/v1/current.json?key=${process.env.API_KEY}&q=${city_name}&aqi=no`,
        method: 'GET'
      };
      const apiRequest = http.request(options, apiResponse => {
        let data = '';
        apiResponse.on('data', chunk => {
          data += chunk;
        });
        apiResponse.on('end', async () => {
          try {
            var resData=JSON.parse(data)
            var weatherData=new weatherModel({
                localTime:resData.location.localtime.toString('yyyy-MM-dd'),
                country:resData.location.country,
                state:resData.location.region,
                city:resData.location.name,
                weatherTest:resData.current.condition.text,
                weatherDegree:resData.current.temp_c,
                icon:resData.current.condition.icon
            })
            
            var resDB=await weatherData.save();
            console.log(resDB);
            res.render('weather',{resData:resData})
          } catch (error) {
            res.send({"error":error});
          }
          
        });
      }); 
      apiRequest.on('error', error => {
        res.status(500).json({ error: error });
      });
      apiRequest.end();
})

app.get('/about',(req,res)=>{
    res.render('about')
})

app.get('/login',(req,res)=>{
  console.log(req.cookies.jwt)
  res.render('login',{success:"",error:''})
})

app.post('/login',async (req,res)=>{
  var {email,password}=req.body;
  try {
  const findUserByEmail=await registerModel.find({email:email});
  if(findUserByEmail.length>0){
    console.log(findUserByEmail[0].password)
    var passwordCompare=await bcrypt.compare(password,findUserByEmail[0].password);
    if(passwordCompare){
      jwt.sign({_id:findUserByEmail[0]._id},process.env.SECRET,{expiresIn:'1h'},(err,token)=>{
        console.log("Token : ",token)
        res.cookie("jwt",token,{expires:new Date(Date.now()+ 8 * 3600000), httpOnly:true})
        res.render('login',{success:"Login Successfully",error:''})
      })
    }
    else
    {
      res.render('login',{success:"",error:'password is incorrect. Please enter correct password'})
    }
  }
  else
  {
    res.render('login',{success:"",error:'User not exists. Please register'})
  }
} catch (error) {
  res.render('login',{success:"",error:error})
}
})

app.get('/register',(req,res)=>{
  res.render('register',{error:'',success:''})
})

app.post('/register',async (req,res)=>{
  var {fname,lname,email,gender,tel,age,password,c_password}=req.body
  if(password===c_password){
    var registerUser=new registerModel({
      firstName:fname,
      lastName:lname,
      email:email,
      gender:gender,
      age:age,
      phone:tel,
      password:password
    })
    var register=await registerUser.save();
    res.render('register',{error:'',success:'User register successfully'})
  }
  else
  {
    res.render('register',{error:'Password and Confirm should be matched'})
  }
})



//HTTP LISTEN
app.listen(process.env.HOST_PORT,()=>{
    console.log('Host is running on ',process.env.HOST_PORT)
})