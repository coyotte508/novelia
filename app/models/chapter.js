const slug = require("slug");
const mongoose = require('mongoose');
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
  public: Boolean,
  number: {
    type: Number,
    required: true
  }
});

//chapterSchema.index({"title": "text"});
chapterSchema.index({"novel.ref" : 1, number: -1}, {unique: true});

chapterSchema.methods.getNovelLink = function() {
    return /*"/nv/" +*/ "/" + slug(this.novel.title, {lower: false});
};

chapterSchema.methods.getLink = function() {
    return this.getNovelLink() + "/" + this.number;
};

//expose novel model to the app
var Chapter = mongoose.model('Chapter', chapterSchema);

Chapter.latestUpdates = async function(filter) {
  let novels = await Novel.latestUpdates(filter);
  let chapters = await Chapter.find({
    _id: {$in: novels.map(item => item.latestChapter)}
  }, "title novel number").sort({_id: -1});

  return chapters;
  /* Map reduce version, to return only chapters from different novels */
  // let results = await Chapter.aggregate([
  //   { $match: filter }, 
  //   { $sort: {_id : -1}},
  //   //{ $limit: 100},
  //   {
  //     $group:
  //     {
  //       _id: "$novel",
  //       id: {$first: "$_id"},
  //       title: {$first: "$title"},
  //       novel: {$first: "$novel"},
  //       number: {$first: "$number"}
  //     }
  //   },
  //   {
  //     $group:
  //     {
  //       _id: "$id",
  //       title: {$first: "$title"},
  //       novel: {$first: "$novel"},
  //       number: {$first: "$number"}
  //     }
  //   },
  //   { $sort: {_id : -1}},
  //   { $limit: 10}
  // ]);

  // for (let result of results) {
  //   result.getLink = chapterSchema.methods.getLink;
  //   result.getNovelLink = chapterSchema.methods.getNovelLink;
  // }

  // return results;

  ///* Non map-reduce version, much simpler */
  ////return Chapter.find({public: true}, "title novel number").sort({_id: -1}).limit(10);
};

module.exports = Chapter;
var Novel = require("./novel");