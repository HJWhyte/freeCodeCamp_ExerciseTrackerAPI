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
  let resObj = { username : username,
                 _id : uuid.v4()
  }
  console.log(resObj);
  res.json(resObj);
  let newUser = new userModel(resObj);
  newUser.save();
})

app.get('/api/users', function(req, res) {
  userModel.find({}).then((users) => {           // Find all user models
    res.json(users)
  })
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
