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
    type: {
      ref: Schema.Types.ObjectId,
      name: String,
      link: String
    },
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
  },
  follows: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  }
});

//novelSchema.index({"title": "text"});

novelSchema.pre("save", function(next) {
  this.slug = slug(this.title, {lower: true});

  next();
});

novelSchema.methods.classySlug = function() {
  return slug(this.title, {lower: false});
};

novelSchema.methods.getLink = function() {
    return /*"/nv/" +*/ "/" + this.classySlug();
};

//expose novel model to the app
module.exports = mongoose.model('Novel', novelSchema);
