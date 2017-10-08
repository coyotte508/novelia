const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var goldSchema = new Schema({
  owner: Schema.Types.ObjectId,
  amount: Number,
  payment: Schema.Types.ObjectId,
  trace: [{
    source: Schema.Types.ObjectId,
    dest: Schema.Types.ObjectId,
    action: {
      what: String,
      ref: Schema.Types.ObjectId
    }
  }]
});

let Gold = mongoose.model("Gold", goldSchema);
module.exports = Gold;