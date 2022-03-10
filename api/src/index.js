const express = require('express')
const PORT = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const path = require('path')
const requestIp = require("request-ip");
var cors = require('cors');
const { badWords } = require('./wordlist');


const pg = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL+"?ssl=true",
  searchPath: ['knex', 'public'],
  ssl: { rejectUnauthorized: false }
});

pg.schema.hasTable('messages').then(function(exists) {
  if (!exists) {
    return pg.schema.createTable('messages', function(t) {
      t.increments('id').primary();
      t.string('handle', 100);
      t.string('author', 100);
      t.string('message', 1000);
      t.string('ip', 100);
      t.string('hostname', 100);
      t.timestamp('created_at').defaultTo(pg.fn.now());
      t.timestamp('updated_at').defaultTo(pg.fn.now());
    });
  } else {
    console.log("db exists");
  }
});

const app = express()
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors())



app.use('/', express.static(path.join(__dirname, 'public')))


app.get('/messages', (req, res) => {
  pg.select("*").table("messages").orderBy("id", "DESC").limit(20).then((data) => {
    res.json(data.map((e) => {
      badWords.forEach((w) => {
        if(e.message.indexOf(w) !== -1) {
          const r = new RegExp(`(^|\s)${w}($|\s)`, 'g')
          if(e.message.length == w.length || r.test(e.message)) {
            var re = new RegExp(w, 'g');
            e.message = e.message.replace(re, "[redacted]");
          }
        }
      })
      return {
        author: e.author,
        message: e.message,
        id: e.id,
        handle: e.handle,
        created_at: e.created_at
      }
    }))
  })
})
app.get('/debug', (req, res) => {
  pg.select("*").table("messages").then((data) => {
    res.json(data);
  });
})

app.post('/message', (req, res) => {
  const clientIp = requestIp.getClientIp(req);
  const hostname = req.hostname;
  const inserting = {...req.body, handle: makeid(6)};
  if(inserting.message.length > 0) {
    if(inserting.author.length > 0 || inserting.author !== "yourName") {
      pg.insert({ ...inserting, ip: clientIp, hostname: hostname }).table("messages").returning("*").then((data) => {
        res.json(data)
      })
    }
    else {
      res.status(400).send("no author found, or not adjusted")
    }

  }
  res.status(400).send("no message body found")
})

app.delete('/message/:id', (req, res) => {
  if(req.params.id && req.params.id > 1) {
    pg.delete().table("messages").where({handle: req.params.id}).then((data) => {
      res.send("deleted "+req.params.id)
    })
    .catch((e) => {
      res.status(500).send(e)
    })
  } else {
    res.status(400).send("no ID found")
  }
})


app.patch('/message/:id', (req, res) => {
  pg.update({...req.body}).table("messages").where({handle: req.params.id}).then((data) => {
    res.send("updated "+req.params.id)
  })
})
app.put('/message/:id', (req, res) => {
  pg.update({...req.body}).table("messages").where({handle: req.params.id}).then((data) => {
    res.send("updated "+req.params.id)
  })
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