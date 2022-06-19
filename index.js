const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

// Basic Configs 
const app = express();
const mySecret = "mongodb+srv://Varun_Dev:218199514@cluster0.9xh89.mongodb.net/fcc-mongodb-and-mongoose?retryWrites=true&w=majority";
mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// DB: Schema define 
const { Schema } = mongoose;

const exerciseSchema = new Schema({
  "description": { type: String, required: true },
  "duration": { type: Number, required: true },
  "date": Date
});
const userSchema = new Schema({
  "username": { type: String, required: true },
  "log": [exerciseSchema]
});

// DB: Model define 
const Exercise = mongoose.model('Exercise', exerciseSchema);
const User = mongoose.model("User", userSchema);

// POST: New User 
app.post('/api/users', (req, res) => {
  User.find({ "username": req.body.username }, (err, userData) => {
    if (err) {
      console.log("Error with server=> ", err)
    } else {
      if (userData.length === 0) {
        const newUser = new User({
          "_id": req.body.id,
          "username": req.body.username,
        })

        newUser.save((err, data) => {
          if (err) {
            console.log("Error saving data=> ", err)
          } else {
            res.json({
              "_id": data.id,
              "username": data.username,
            })
          }
        })
      } else {
        res.send("Username already Exists :)")
      }
    }
  })
});

// POST: Add Excersices 
app.post("/api/users/:_id/exercises", (req, res) => {
  let idObj = { "id": req.params._id }
  let checkedDate = new Date(req.body.date);

  let handleDate = () => {
    if (checkedDate instanceof Date && !isNaN(checkedDate)) {
      return checkedDate
    } else {
      return checkedDate = new Date();
    }
  }
  
  let newExercise = new Exercise({
    "description": req.body.description,
    "duration": +req.body.duration,
    "date": handleDate(checkedDate)
  })
  User.findByIdAndUpdate(idObj.id, { $push: { log: newExercise } }, { new: true }, (err, data) => {

    if (err || !data) {
      console.log("err =>", err)
      res.send("Data Not Found Or error with ID :(");
    } else {
      let exObj = {};
      exObj['_id'] = data.id,
        exObj['username'] = data.username,
        exObj['description'] = newExercise.description,
        exObj['duration'] = newExercise.duration,
        exObj['date'] = checkedDate.toDateString()
      res.json(exObj);
    }
  });
});

// Get: User full Logs 
app.get('/api/users/:_id/logs', (req, res) => {
  let idJson = { "id": req.params._id };
  let idToCheck = idJson.id;

  User.findById(idToCheck, (err, data) => {
    if (err || !data) {
      console.log("error with ID ", err)
      res.send("Data Not Found :(")
    } else {
      let resObj = data;

      if (req.query.from || req.query.to) {

        let fromDate = new Date(0);
        let toDate = new Date();

        if (req.query.from) {
          fromDate = new Date(req.query.from);
        }

        if (req.query.to) {
          toDate = new Date(req.query.to);
        }

        fromDate = fromDate.getTime();
        toDate = toDate.getTime();

        resObj.log = resObj.log.filter((exercise) => {
          let exerciseDate = new Date(exercise.date).getTime();

          return exerciseDate >= fromDate && exerciseDate <= toDate;

        });
      };
      if (req.query.limit) {
        resObj.log = resObj.log.slice(0, req.query.limit);
      };
      resObj = resObj.toJSON();
      resObj['count'] = data.log.length;
      res.json({
        "username": resObj.username,
        "count": resObj.count,
        "_id": resObj._id,
        "log": resObj.log.map((i) => {
          return {
            "description": i.description,
            "duration": i.duration,
            "date": i.date.toDateString()
          }
        })
      });
    };
  });
});

// Get: All Users 
app.get("/api/users", (req, res) => {
  User.find({}, (err, data) => {
    if (err || !data) {
      console.log(err);
      res.send("User Data Not Found :(");
    } else {
      res.json(data);
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});

