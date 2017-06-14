//const randomInt = require("random-int");
const mongoose = require("mongoose");
const slug = require('slug');
const Schema = mongoose.Schema;
const assert = require("assert");

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
  image: {
    ref: Schema.Types.ObjectId,
    link: String
  },
  //updatedAt: Date,
  categories: {
    type: [String],
    index: true
  },
  chapters: {
    type: [{
      title: String,
      ref: Schema.Types.ObjectId
    }],
    default: [{title: "", id: null}]
  },
  latestChapter: {
    type: Schema.Types.ObjectId,
    index: true
  },
  description: String,
  totalViews: {
    type: Number,
    default: 0
  },
  totalLikes: {
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
});

//novelSchema.index({"title": "text"});

novelSchema.pre("save", function(next) {
  this.slug = slug(this.title, {lower: true});

  next();
});


novelSchema.methods.publicChaptersNum = function() {
  if (!this.public) {
    return 0;
  }

  return this.numChapters + (this.chapters[0].id === null ? 0 : 1);
};

novelSchema.methods.classySlug = function() {
  return slug(this.title, {lower: false});
};

novelSchema.methods.getLink = function() {
    return /*"/nv/" +*/ "/" + this.classySlug();
};

novelSchema.methods.getViews = async function() {
  var views = await Chapter.find({"novel.ref": this.id}, "views number");
  views.forEach((chapter) => {
    if (chapter.number > this.chapters.length) {
      return;
    }
    this.chapters[chapter.number].views = chapter.views;
  });
};

novelSchema.methods.addChapter = async function(chapter) {
  if (chapter.number === 0) {
    await this.update({
      prologue: true,
      "chapters.0": {title: chapter.title, ref: chapter.id},
      latestChapter: chapter.id
    });
  } else {
    await this.update({
      $inc: {"numChapters": 1},
      $push: {"chapters": {title: chapter.title, ref: chapter.id}},
      latestChapter: chapter.id
    });
  }
};

novelSchema.methods.deleteChapter = async function(chapter) {
  let num = chapter.number;
  assert(this.numChapters >= num, "You can only delete the last chapter");

  if (this.public) {
    assert(this.publicChaptersNum() > 1, "For a public novel, you need to keep one public chapter at least");
  }

  if (num == 0) {
    await this.update(
      {
        $inc: {"totalViews": -chapter.views},
        prologue: false,
        "chapters.0": null,
        latestChapter: null
      });
  } else {
    await this.update(
      {
        $inc: {"numChapters": -1, "totalViews": -chapter.views},
        $pull: {"chapters": {ref: chapter.id}},
        latestChapter: this.chapters[num-1].ref
      });
  }
};

novelSchema.methods.getImageLink = function(format) {
  if (format && this.image.link) {
    return this.image.link.substr(0, this.image.link.lastIndexOf(".")) + "-" + format + this.image.link.substr(this.image.link.lastIndexOf("."));
  }

  return this.image.link;
};

const Novel = mongoose.model('Novel', novelSchema);

Novel.latestUpdates = async function(filter) {
  filter = Object.assign({public: true}, filter || {});

  let results = await Novel.find(filter, "title latestChapter").sort({latestChapter: -1}).limit(10);

  return results;
};

//expose novel model to the app
module.exports = Novel;
//avoid cyclic require issue
var Chapter = require("./chapter");
