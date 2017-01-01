const mongoose = require("mongoose");
const limiter = require("mongo-limiter")(mongoose.connection);

limiter.setLimits({
  comment: {limit: 10, duration: 3600},
  addchapter: {limit: 10, duration: 3600*24},
  edit: {limit: 30, duration: 3600},
  addnovel: {limit: 3, duration: 3600*24}
})

module.exports = limiter;