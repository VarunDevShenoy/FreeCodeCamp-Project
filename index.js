const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')
require('dotenv').config()


const app = express()
const S = process.env["MONGO_URI"]
mongoose.connect(S, { useNewUrlParser: true, useUnifiedTopology: true })
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})


const { Schema } = mongoose
const es = new Schema({
  "description": { type: String, required: true },
  "duration": { type: Number, required: true },
  "date": {type: Date, required: true }
})
const p = new Schema({
  "username": { type: String, required: true },
  "log": [es]
})


const e = mongoose.model('Exercise', es)
const U = mongoose.model("User", p)

e.collection.deleteMany()
U.collection.deleteMany()


app.route('/api/users')
 .post((req, res) => {
        
        const person = new U({
          "_id": req.body.id,
          "username": req.body.username
        })

        person.save((err, data) => 
    
            res.send({
              "username": data.username,
              "_id": data.id.valueOf()
            })
        )  
  
})
.get((req, res) => 
  U.find((err, data) => 
      
      {
        v= data.map(a=>
          v=
           {"_id"      : a["_id"].valueOf(), 
            "username" :a["username"],
            "__v"      : a["__v"] 
           }
          )
        res.send(v)
      }
  )
)


app.post("/api/users/:_id/exercises", (req, res) => {
  
  let Dat = new Date(req.body.date).toDateString()

  if(Dat == 'Invalid Date') Dat = new Date().toDateString()  
  
  let newE = new e({
    "description"   : req.body.description,
    "duration"      : req.body.duration,
    "date"          : Dat
  })

  U.findByIdAndUpdate(req.params._id, { $push: { log: newE } }, { new: true }, (err, data) => 

    res.send({
         '_id'            : data.id,
         'username'       : data.username,  
         'date'           : Dat,
         'duration'       : newE.duration,
         'description'    : newE.description
             })
    
  )
})

app.get('/api/users/:_id/logs', (req, res) => {
  
  U.findById(req.params._id, (err, data) => {
    
      let resp={
                     "_id"      : data._id,
                      "username": data.username
               }

      if (req.query.from || req.query.to) {

        let fromDate = new Date(0)
        let toDate   = new Date()

        if (req.query.from) {
          fromDate  = new Date(req.query.from)
          resp.from = fromDate.toDateString()
        }

        if (req.query.to) {
          toDate = new Date(req.query.to)
          resp.to= toDate.toDateString()
        }
      
        data.log = data.log.filter(e =>  new Date(e.date) >= fromDate && new Date(e.date) <= toDate )
    
      }

      data.log.sort((a,b) =>   new Date(b.date) - new Date(a.date) )

      if (req.query.limit) data.log.splice(req.query.limit)
      
      resp.count = data.log.length
      resp.log= data.log.map( a => v= {
          
        "description": a.description,
        "duration"   : a.duration,
        "date"       : a.date.toDateString()
      
                                       })
      res.send(resp)
    
    
  })

})

const listener = app.listen(process.env.PORT || 3000, () => 
  console.log('Your app is listening on port ' + listener.address().port)
)

