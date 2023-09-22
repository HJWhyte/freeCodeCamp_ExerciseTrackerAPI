const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

let mongoose = require('mongoose'); // Import mongoose requirement for DB
mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology : true});  // Connect to database

const userSchema = new mongoose.Schema({          // Define User Schema
  username : {type: String, required: true, unique: true},
  _id : {type: String}
});

let userModel = mongoose.model('users', userSchema); // Create DB model from schema 

const exSchema = new mongoose.Schema({
  userId : {type: String, required: true},
  description : {type: String, required: true},
  duration : {type: Number, required: true},
  date : {type: Date, default: new Date()}
});

let exModel = mongoose.model('exercises', exSchema);

const bodyParser = require('body-parser'); // Import response body parsing middleware
app.use(bodyParser.urlencoded({extended: false}));  // use body parser middleware for url encoded info

let uuid =require('uuid'); // Import to generate unique ID's


app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', function(req,res) {
  console.log(req.body);
  let username = req.body.username;
  let resObj = { username : username,     // Create a response obj based off request username and random ID
                 _id : uuid.v4()
  }
  console.log(resObj);
  res.json(resObj);
  let newUser = new userModel(resObj);             // Create a user model and save to DB
  newUser.save();
})

app.get('/api/users', function(req, res) {
  userModel.find({}).then((users) => {           // Find all user models
    res.json(users)
  })
});

app.post('/api/users/:_id/exercises', async function(req, res) {

  let exObj = {                            // Create exercise obj with request parameters/body
    userId : req.params._id,
    description : req.body.description,
    duration : req.body.duration,
  }
  if (req.body.date != '') {            // Check if the date is blank (set to default) or sets value from request body
    exObj.date = req.body.date
  }
  console.log(exObj);
  
  let newEx = new exModel(exObj);    // Creates exercise model
  
  try {
  let userFound = await userModel.findById(req.params._id)        // Searches for user with same ID as req ID
    console.log(userFound)
    newEx.save()                                                       // If found save exercise model
    res.json({                                               // and create response json    
      _id : userFound._id,
      username : userFound.username,
      description : newEx.description,
      duration : newEx.duration,
      date : newEx.date.toDateString()
    })
  }
  catch (err) {
  console.log(err);
  }
})

app.get('/api/users/:id/logs', async function(req, res) {

  console.log('Req Params:', req.params)
  let userId = req.params.id

  let limit = req.query.limit;
  let fromParam = req.query.from;
  let toParam = req.query.to;

  limit = limit ? parseInt(limit): limit;

  let queryObj = {
      userId : userId
  };

  if (fromParam || toParam){
    queryObj.date = {};
    if (fromParam) {
      queryObj.date['$gte'] = fromParam
    }
    if (toParam) {
      queryObj.date['$lte'] = toParam
    }
  }

  try {
    let userFound = await userModel.findById(userId)
    console.log('UserFound:', userFound)
    let exercises = await exModel.find(queryObj).limit(limit);
    console.log('Exercises:', exercises)
    let count = exercises.length
    console.log('Count:', count)
    const exerciseInfoArray = exercises.map(x => ({
      description: x.description,
      date: x.date.toDateString(),
      duration: x.duration
    }));
    res.json ({
      username: userFound.username,
      count: count,
      _id : req.params.id,
      log: exerciseInfoArray
    })
  } 
  catch (err) {
  console.log(err);
  }
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
