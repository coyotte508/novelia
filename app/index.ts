import * as passport from 'passport';
import * as mongoose from 'mongoose';
import * as locks from 'mongo-locks';

/* Express stuff */
import * as express from 'express';
import * as expressLayouts from 'express-ejs-layouts';
import * as compression from 'compression';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import * as connectMongo from 'connect-mongo';
import * as morgan from 'morgan';
// tslint:disable-next-line no-var-requires
const flash = require('connect-flash');

/* Local stuff */
import {middlewares} from "./engine/middlewares/default";
import configAuth from './config/auth';
import configDB from './config/general';
import router from './routes';

import './config/validator';
import './config/limits';

const MongoStore = connectMongo(session);
const app = express();
const port = +process.env.port || 8010;
const dburl = configDB.localdb; // process.env.local ? configDB.localdb : configDB.dburl;

/* Configuration */
mongoose.connect(dburl, {useNewUrlParser: true});

mongoose.connection.on("error", (err) => {
  console.log(err);
});

mongoose.connection.on("open", async () => {
  try {
    const {User} = require("./models");
    const {restore} = require("./models/backup");
    if (await User.find({}).limit(1).count() === 0) {
      await restore();
    }
    // const migrations = require("./models/migrations");
    // migrations["0.1.2"].up();
  } catch (err) {
    console.error(err);
  }
});

locks.init(mongoose.connection);

/* Configure passport */
import configPassport from './config/passport';
configPassport(passport);

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
    store: new MongoStore({mongooseConnection: mongoose.connection}),
    maxAge: new Date(Date.now() + 120 * 3600 * 1000), // 120 days expire
  } as any)
);
app.use(passport.initialize());
app.use(passport.session());

for (const middleware of middlewares)   {
  app.use(middleware);
}

// app.use("/", express.static(__dirname + '/public')); /* NGINX should take care of that below */
app.use("/", router);

async function listen() {
  try {
    const promise = new Promise(resolve => {
      app.listen(port, 'localhost', () => {resolve(); });
    });

    await promise;

    console.log("app started on port", port);
  } catch (err) {
    console.log(err);
  }
}

listen();
