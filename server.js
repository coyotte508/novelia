const co = require('co');
const fs = require('fs-extra');
const passport = require('passport');
const mongoose = require('mongoose');
const locks = require('mongo-locks');

/* Express stuff */
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const compression = require('compression');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const morgan = require('morgan');
const flash = require('connect-flash');

/* Local stuff */
const pjson = require('./package.json');
const configAuth = require('./config/auth');
const configDB = require('./config/general');
const cs = require('./config/constants');
const router = require('./app/routes/routes');
require('./config/validator');
require('./config/limits');

var app = express();
const port = process.env.port || 8010;

/* Configuration */
mongoose.connect(configDB.dburl, {server: {reconnectTries: Number.MAX_VALUE, reconnectInterval: 1000}});
mongoose.Promise = global.Promise; //native promises

mongoose.connection.on("error", (err) => {
  console.log(err);
});

locks.init(mongoose.connection);

// mongoose.connection.once("open", () => {
//   const Chapter = require("./app/models/chapter");
//   const Novel = require("./app/models/novel");
//   const User = require("./app/models/user");
//   Chapter.collection.dropAllIndexes();
//   Novel.collection.dropAllIndexes();
//   User.collection.dropAllIndexes();
// });

/* Configure passport */
require('./config/passport')(passport);

/* App stuff */
app.use(morgan('dev'));

app.set('view engine', 'ejs'); 

app.set("layout extractScripts", true);
app.set("layout extractMetas", true);
app.set('trust proxy', 'loopback');
app.use(expressLayouts);
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(flash());

app.use(function(req, res, next){
  /* For css cache busting */
  req.version = pjson.version;
  req.cs = cs;

  req.makeDescription = descr => {
    descr = descr.replace(/(<([^>]+)>)/g, "") ||"";
    var index = descr.indexOf(" ", 150);
    return descr.substr(0, index == -1 ? undefined : index);
  }

  req.unixTime = function(date) {
    return parseInt(date.substring(0, 8), 16);
  }

  req.timeSince = function(date) {
    var seconds = Math.floor((Date.now()/ 1000 - this.unixTime(date)));
    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
      return interval + " years";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
      return interval + " months";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
      return interval + " days";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
      return interval + " hours";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
      return interval + " minutes";
    }
    return Math.floor(seconds) + " seconds";
  }
  next();
});

/* Required for passport */
app.use(session(
  {
    secret: configAuth.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({mongooseConnection:mongoose.connection}),
    maxAge: new Date(Date.now() + 120*3600*1000), //120 days expire
  })
);
app.use(passport.initialize());
app.use(passport.session());

//app.use("/", express.static(__dirname + '/public')); /* NGINX should take care of that below */
app.use("/", router);

co(function *() {
  yield new Promise((resolve, reject) => {
    app.listen(port, 'localhost', () => {resolve();});
  });

  console.log("app started on port", port);
}).catch((err) => {
  console.log(err);
});
