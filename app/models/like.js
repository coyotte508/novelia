const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// define the schema for our user model
var likeSchema = new Schema({
  source: Schema.Types.ObjectId, //Id of object liked
  sourceType: String, //What is liked? Chapter, comment, ...
  author: {
    type: Schema.Types.ObjectId, //author
    required: true
  }
});

likeSchema.index({source: 1, author: 1}, {unique: true});

let Like = mongoose.model('Like', likeSchema);

module.exports = Like;
