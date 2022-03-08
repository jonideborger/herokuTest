const express = require('express')
const PORT = process.env.PORT || 3000;
const { JsonDB } = require('node-json-db');
const { Config } = require('node-json-db/dist/lib/JsonDBConfig');
const bodyParser = require('body-parser');
const path = require('path')

const app = express()
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var db = new JsonDB(new Config("chat", true, false, '/'));
db.push("/messages", []);
db.save();

app.use('/', express.static(path.join(__dirname, 'public')))


app.get('/messages', (req, res) => {
  var data = db.getData("/messages");
  res.json(data)
})

app.post('/message', (req, res) => {
  console.log(req.body)
  const inserting = {...req.body, id: makeid(6)};
  const data = db.getData("/messages");
  data.push(inserting);
  db.push("/messages", data);
  db.save();
  res.json(inserting)
})

app.delete('/message/:id', (req, res) => {
  const data = db.getData("/messages");
  const filtered = data.filter((e) => e.id !== req.params.id)
  db.push("/messages", filtered);
  db.save();
  res.send("deleted "+req.params.id)
})
app.patch('/message/:id', (req, res) => {
  const data = db.getData("/messages");
  const mapped = data.map((e) => {
    if(e.id == req.params.id) {
      return {
        ...e,
        ...req.body
      }
    }
    return e
  })

  db.push("/messages", mapped);
  db.save();
  res.send("updated "+req.params.id)
})

app.put('/message/:id', (req, res) => {
  const data = db.getData("/messages");
  const mapped = data.map((e) => {
    if(e.id == req.params.id) {
      return {
        ...e,
        ...req.body
      }
    }
    return e
  })

  db.push("/messages", mapped);
  db.save();
  res.send("updated "+req.params.id)
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})

function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * 
charactersLength));
 }
 return result;
}