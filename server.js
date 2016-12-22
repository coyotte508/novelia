const express = require('express');
const router = require('./app/routes');

var app = express();
var port = 8080;

app.set('view engine', 'ejs'); 

app.use("/", express.static(__dirname + '/public'));
app.use("/", router);

app.listen(port, () => {
  console.log("app started");
})

