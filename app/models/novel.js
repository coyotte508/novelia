//const randomInt = require("random-int");
const co = require("co");
const mongoose = require('mongoose');
const slug = require('slug');
const Schema = mongoose.Schema;
const Chapter = require("./chapter");

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
  public: {
    type: Boolean,
    default: true
  },
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

novelSchema.methods.getViews = function() {
  var self = this;
  return co(function*() {
    var views = yield Chapter.find({"novel.ref": self.id}, "views number");
    views.forEach((chapter) => {
      if (chapter.number > self.chapters.length) {
        return;
      }
      self.chapters[chapter.number].views = chapter.views;
    });
  });
}

//expose novel model to the app
module.exports = mongoose.model('Novel', novelSchema);
