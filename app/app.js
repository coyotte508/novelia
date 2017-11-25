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
const {middlewares} = require("./engine/middlewares/default");
const configAuth = require('./config/auth');
const configDB = require('./config/general');
const router = require('./routes/routes');

require('./config/validator');
require('./config/limits');

var app = express();
const port = process.env.port || 8010;
const dburl = configDB.localdb;//process.env.local ? configDB.localdb : configDB.dburl;

/* Configuration */
mongoose.connect(dburl, {useMongoClient:true});
mongoose.Promise = global.Promise; //native promises

mongoose.connection.on("error", (err) => {
  console.log(err);
});

mongoose.connection.on("open", async () => {
  try {
    const {User} = require("./models");
    const {restore} = require("./models/backup");
    if (await User.find({}).limit(1).count() == 0) {
      await restore();
    }
    //const migrations = require("./models/migrations");
    //migrations["0.1.2"].up();
  } catch(err) {
    console.error(err);
  }
});

locks.init(mongoose.connection);

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

for (const middleware of middlewares)   {
  app.use(middleware);
}

//app.use("/", express.static(__dirname + '/public')); /* NGINX should take care of that below */
app.use("/", router);

async function listen() {
  try {
    let promise = new Promise(resolve => {
      app.listen(port, 'localhost', () => {resolve();});
    });

    await promise;

    console.log("app started on port", port);
  } catch(err) {
    console.log(err);
  }
}

listen();
