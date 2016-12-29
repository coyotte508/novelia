const co = require("co");
const randomInt = require("random-int");
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');
const Schema = mongoose.Schema;

// define the schema for our user model
var novelSchema = new Schema({
  title: {
    type: String, 
    required: true, 
    unique: true
  },
  author: {
    type: Schema.Types.ObjectId,
    required: true
  },
  //updatedAt: Date,
  categories: [String],
  //chapters: [String],
  description: String,
  totalViews: {
    type: Number,
    default: 0
  },
  public: {
    type: Boolean,
    default: false
  },
  slug: {
    type: String,
    unique: true
  }
});

/* Generate a xxxx0000 slug */
novelSchema.methods.generateSlug = function() {
  var ret = '';
  for (var i = 0, i < 4; i++) {
    ret.push(String.fromCharCode('a'.charCodeAt(0)+randomInt(0,25)));
  }
  for (i = 0; i < 4; i++) {
    ret += randomInt(0,9);
  }
};

//expose novel model to the app
module.exports = mongoose.model('Novel', novelSchema);
