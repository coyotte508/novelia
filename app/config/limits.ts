import * as mongoose from 'mongoose';
import limiter from 'mongo-limiter';

limiter.init(mongoose.connection, {
  comment: {limit: 20, duration: 3600},
  addchapter: {limit: 10, duration: 3600 * 24},
  uploadimage: {limit: 10, duration: 3600 * 24},
  edit: {limit: 100, duration: 3600},
  addnovel: {limit: 3, duration: 3600 * 24},
  like: {limit: 50, duration: 3600},
  follow: {limit: 50, duration: 3600},
  shownovel: {limit: 20, duration: 3600},
  forgetip: {limit: 5, duration: 3600 * 12},
  forget: {limit: 3, duration: 3600 * 12},
  accountip: {limit: 3, duration: 3600 * 24},
  confirm: {limit: 3, duration: 3600 * 12},
  security: {limit: 20, duration: 3600 * 12}
});

export default limiter;
