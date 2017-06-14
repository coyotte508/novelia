const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// define the schema for our user model
var likeSchema = new Schema({
  text: String,
  source: Schema.Types.ObjectId,
  author: Schema.Types.ObjectId
});

likeSchema.index({source: 1, author: 1}, {unique: true});

let Like = mongoose.model('Like', likeSchema);

module.exports = Like;
