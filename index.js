const pronote = require('pronote-api');
const dotenv = require('dotenv');
dotenv.config();
const sqlite3 = require('sqlite3').verbose();
const https = require('https');

/**
 * TODO: Get data from pronote
 * TODO: Add in DB
 * TODO: Add Todoist
 */
const url = process.env.URL;
const username = process.env.USER;
const password = process.env.PRONOTE_PASSWD;
const cas = process.env.CAS;
const key = process.env.KEY;
// ? For test only
a = Date.now()
b = new Date(Date.now() + 12096e5);

var alreadyInDB = 0, addedToTodoist = 0

// * Connects to DB
let db = new sqlite3.Database('hw.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
});

async function main(){
    let toUpload = 0;
    //* Logins to pronote
    const session = await pronote.login(url, username, password, cas);
    //* Get homeworks
    homeworks = await session.homeworks(a,b);
    homeworks.forEach(h => {
        //* Checks if present in DB
        sql = `SELECT * FROM hw WHERE content="${h.description}"`;
        db.all(sql, (err, rows) => {
            if (err) return console.log(err.message)
            //* If NOT present
            if (rows.length==0){
                
                //* Adds into DB
                date = `${h.for.getFullYear()}${(h.for.getMonth()+1).toLocaleString('en-US', {minimumIntegerDigits: 2})}${(h.for.getDate()).toLocaleString('en-US', {minimumIntegerDigits: 2})}`
                sql = `INSERT INTO hw VALUES (null, "${h.subject}", "${h.description}", ${h.done}, ${date})`
                db.run(sql)
                //* Sends in TRodoist
                
                data=JSON.stringify({"content": `${h.subject}: ${h.description.normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`, "due_string": `${h.for.getMonth()+1}-${h.for.getDate()}`, "due_lang": "en"})
                options={
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': data.length,
                        'Authorization': `Bearer ${key}`
                    },
                    
                }
                const req = https.request('https://api.todoist.com/rest/v1/tasks', options, (res) =>{
                
                    if (res.statusCode!=200){
                        console.error("Error in Todoist")
                        console.log(res.statusMessage)
                        console.log(data)
                    }
                    else {
                        addedToTodoist+=1
                    }
                })
                req.write(data)
                req.end()
            }
            else {
                alreadyInDB+=1
            }
          });
    });
    
}

main().catch(err => {
    if (err.code === pronote.errors.WRONG_CREDENTIALS.code) {
        console.error('Mauvais identifiants');    
    } else {
        console.error(err);
    }
});