const express = require('express')
const PORT = process.env.PORT || 3000;
const { JsonDB } = require('node-json-db');
const { Config } = require('node-json-db/dist/lib/JsonDBConfig');
const bodyParser = require('body-parser');

const app = express()
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var db = new JsonDB(new Config("chat", true, false, '/'));
db.push("/messages", [{message:"test", author: "test"}]);
db.save();

app.get('/', (req, res) => {
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