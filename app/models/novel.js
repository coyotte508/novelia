//const randomInt = require("random-int");
const mongoose = require('mongoose');
const slug = require('slug');
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
  chapters: {
    type: [{
      title: String, 
      ref: Schema.Types.ObjectId
    }],
    default: [{title: "", id: null}]
  },
  description: String,
  totalViews: {
    type: Number,
    default: 0
  },
  public: Boolean,
  prologue: Boolean,
  slug: {
    type: String,
    unique: String
  },
  numChapters: {
    type: Number,
    default: 0
  }
  /* code: {
    type: String,
    unique: true
  } */
});

//novelSchema.index({"title": "text"});

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

novelSchema.methods.getLink = function() {
    return "/nv/" + this.classySlug();
};

//expose novel model to the app
module.exports = mongoose.model('Novel', novelSchema);
