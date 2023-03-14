import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import {
    fileURLToPath
} from 'url';

import requestIp from 'request-ip';
import cors from 'cors';
import badWords from './wordlist.js';
import knex from 'knex';
import KnexMysql from 'knex/lib/dialects/mysql/index.js';


const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 80;
const pg = knex({
    client: KnexMysql,
    connection: {
        host: 'dt5.ehb.be',
        user: 'DEV4070',
        password: '89127634',
        database: 'DEV4070'
    }
})

pg.schema.hasTable('messages').then(function (exists) {
    if (!exists) {
        return pg.schema.createTable('messages', function (t) {
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
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(cors())



app.use('/', express.static(path.join(__dirname, 'public')))


app.get('/messages', (req, res) => {
    pg.select("*").table("messages").orderBy("id", "DESC").limit(20).then((data) => {
        res.json(data.map((e) => {
            badWords.forEach((w) => {
                if (e.message.indexOf(w) !== -1) {
                    const r = new RegExp(`(^|\s)${w}($|\s)`, 'g')
                    if (e.message.length == w.length || r.test(e.message)) {
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
    const inserting = {
        ...req.body,
        handle: makeid(6)
    };
    if (inserting.message.length > 0) {
        if (inserting.author.length > 0 || inserting.author !== "yourName") {
            pg.insert({
                ...inserting,
                ip: clientIp,
                hostname: hostname
            }).table("messages").returning("*").then((data) => {
                res.json(data)
            })
        } else {
            res.status(400).send("no author found, or not adjusted")
        }

    } else {
        res.status(400).send("no message body found")
    }
})

app.delete('/message/:id', (req, res) => {
    if (req.params.id) {
        pg.delete().table("messages").where({
                handle: req.params.id
            }).then((data) => {
                res.send("deleted " + req.params.id)
            })
            .catch((e) => {
                res.status(500).send(e)
            })
    } else {
        res.status(400).send("no ID found")
    }
})


app.patch('/message/:id', (req, res) => {
    pg.update({
        ...req.body
    }).table("messages").where({
        handle: req.params.id
    }).then((data) => {
        res.send("updated " + req.params.id)
    })
})
app.put('/message/:id', (req, res) => {
    pg.update({
        ...req.body
    }).table("messages").where({
        handle: req.params.id
    }).then((data) => {
        res.send("updated " + req.params.id)
    })
})


app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
})

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}