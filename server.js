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
const router = require('./app/routes/routes');
require('./config/validator');
require('./config/limits');

var app = express();
const port = process.env.port || 8080;

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

/* For css cache busting */
app.use(function(req, res, next){
    req.version = pjson.version;
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