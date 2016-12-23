const co = require('co');
const fs = require('fs-extra');
const db = require('sqlite');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const compression = require('compression');
const bodyParser = require('body-parser');

const router = require('./app/routes');

var app = express();
var port = process.env.port || 8080;

app.set('view engine', 'ejs'); 

app.use(expressLayouts);
app.use(compression);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true})); 

app.use("/", express.static(__dirname + '/public'));
app.use("/", router);

co(function *() {
  fs.mkdirpSync('./data');
  yield db.open('./data/database.sqlite');

  yield new Promise((resolve, reject) => {
    app.listen(port, 'localhost', () => {resolve();});
  });

  console.log("app started");
}).catch((err) => {
  console.log(err);
});