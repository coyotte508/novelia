const co = require("co");
const randomInt = require("random-int");
const mongoose = require('mongoose');
const slug = require('slug');
const bcrypt   = require('bcrypt');
const Schema = mongoose.Schema;

// define the schema for our user model
var novelSchema = new Schema({
  title: {
    type: String, 
    required: true, 
  },
  author: {
    type: Schema.Types.ObjectId,
    required: true
  },
  //updatedAt: Date,
  categories: [String],
  chapters: [String],
  description: String,
  totalViews: {
    type: Number,
    default: 0
  },
  public: {
    type: Boolean,
    default: false
  },
  slug: String
  /* code: {
    type: String,
    unique: true
  } */
});

novelSchema.index({"slug": "text"}, {unique: true});

/* Generate a xxxx000 slug */
// novelSchema.methods.generateCode = function() {
//   var ret = '';
//   for (var i = 0, i < 4; i++) {
//     ret.push(String.fromCharCode('a'.charCodeAt(0)+randomInt(0,25)));
//   }
//   for (i = 0; i < 3; i++) {
//     ret += randomInt(0,9);
//   }

//   this.code = ret;
// };

novelSchema.pre("save", function(next) {
  this.slug = slug(this.title, {lower: true});

  next();
});

novelSchema.methods.classySlug = function() {
  return slug(this.title, {lower: false});
};

//expose novel model to the app
module.exports = mongoose.model('Novel', novelSchema);
