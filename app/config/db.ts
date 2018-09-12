import locks from 'mongo-locks';
import * as mongoose from "mongoose";
import env from "./env";

(<any> mongoose).Promise = global.Promise; // native promises
mongoose.connect(env.dburl, <any> {dbName: 'novelia', useNewUrlParser: true});

mongoose.connection.on("error", (err) => {
  console.error(err);
});

mongoose.connection.on("open", async () => {
  console.log("connected to database!");
});

locks.init(mongoose.connection);
