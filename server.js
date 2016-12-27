const co = require('co');
const fs = require('fs-extra');
const passport = require('passport');
const mongoose = require('mongoose');

/* Express stuff */
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const compression = require('compression');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const morgan = require('morgan');
const flash = require('connect-flash');

const configAuth = require('./config/auth');
const configDB = require('./config/database');
const router = require('./app/routes');

var app = express();
const port = process.env.port || 8080;

/* Configuration */
mongoose.connect(configDB.url);
mongoose.Promise = global.Promise; //native promises

/* Configure passport */
require('./config/passport')(passport);

/* App stuff */
app.use(morgan('dev'));

app.set('view engine', 'ejs'); 

app.use(expressLayouts);
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(flash());

/* Required for passport */
app.use(session(
  {
    secret: configAuth.sessionSecret,
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/", express.static(__dirname + '/public'));
app.use("/", router(passport));

app.get("/", function(req, res) {
  res.json("{'a':'v'}");
  res.end();
})

co(function *() {
  yield new Promise((resolve, reject) => {
    app.listen(port, 'localhost', () => {resolve();});
  });

  console.log("app started on port", port);
}).catch((err) => {
  console.log(err);
});