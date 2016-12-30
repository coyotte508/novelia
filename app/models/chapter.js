const co = require("co");
const randomInt = require("random-int");
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');
const Schema = mongoose.Schema;

// define the schema for our user model
var chapterSchema = new Schema({
  title: {
    type: String, 
    required: true, 
  },
  content: {
    type: String, 
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  novel: {
    type: {
      ref: Schema.Types.ObjectId,
      title: String
    },
    required: true
  },
  authorNote: String,
  views: {
    type: Number,
    default: 0
  },
  public: Boolean,
  number: {
    type: Number,
    required: true
  }
});

//chapterSchema.index({"title": "text"});
chapterSchema.index({"novel.ref" : 1, number: -1}, {unique: true});

//expose novel model to the app
module.exports = mongoose.model('Chapter', chapterSchema);
