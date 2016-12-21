const express = require('express');

var app = express();
var port = 8080;

app.listen(port, () => {
  console.log("app started");
})

app.use("/", express.static(__dirname + '/public'));
app.set('view engine', 'ejs'); 

app.get("/", (req, res) => {
  res.render("index", {error:null});
});