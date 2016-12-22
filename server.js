const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const router = require('./app/routes');

var app = express();
var port = 8080;

app.set('view engine', 'ejs'); 

app.use(expressLayouts);

app.use("/", express.static(__dirname + '/public'));
app.use("/", router);

app.listen(port, 'localhost', () => {
  console.log("app started");
})

