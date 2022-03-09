const express = require('express')
const PORT = process.env.PORT || 3000;
const { JsonDB } = require('node-json-db');
const { Config } = require('node-json-db/dist/lib/JsonDBConfig');
const bodyParser = require('body-parser');
const path = require('path')
const requestIp = require("request-ip");
const { default: knex } = require('knex');

const pg = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  searchPath: ['knex', 'public'],
});

knex.schema.hasTable('messages').then(function(exists) {
  if (!exists) {
    return knex.schema.createTable('messages', function(t) {
      t.increments('id').primary();
      t.string('handle', 100);
      t.string('author', 100);
      t.string('message', 1000);
      t.string('ip', 100);
      t.string('hostname', 100);
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  } else {
    console.log("db exists");
  }
});

const app = express()
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var db = new JsonDB(new Config("chat", true, false, '/'));
db.push("/messages", []);
db.save();

app.use('/', express.static(path.join(__dirname, 'public')))


app.get('/messages', (req, res) => {
  var data = db.getData("/messages");
  res.json(data.map((e) => {
    return {
      author: e.author,
      message: e.message,
      id: e.id
    }
  }))
})

app.get('/db/messages', (req, res) => {
  knex.select("*").table("messages").then((data) => {
    res.json(data.map((e) => {
      return {
        author: e.author,
        message: e.message,
        id: e.id,
        handle: e.handle
      }
    }))
  })
})
app.get('/debug', (req, res) => {
  var data = db.getData("/messages");
  res.json(data)
})

app.post('/message', (req, res) => {
  const clientIp = requestIp.getClientIp(req);
  const hostname = req.hostname;
  const inserting = {...req.body, id: makeid(6)};
  const data = db.getData("/messages");
  data.push({ ...inserting, ip: clientIp, hostname: hostname });
  db.push("/messages", data);
  db.save();
  res.json(inserting)
})
app.post('/db/message', (req, res) => {
  const clientIp = requestIp.getClientIp(req);
  const hostname = req.hostname;
  const inserting = {...req.body, handle: makeid(6)};
  knex.insert({ ...inserting, ip: clientIp, hostname: hostname }).table("messages").returning("*").then((data) => {
    res.json(data)
  })
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