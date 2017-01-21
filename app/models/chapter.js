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

//expose novel model to the app
var Chapter = mongoose.model('Chapter', chapterSchema);

Chapter.latestUpdates = function() {
  /* Map reduce version, to return only chapters from different novels */
  return Chapter.aggregate([
    { $match: {public: true} }, 
    { $sort: {_id : -1}},
    //{ $limit: 100},
    {
      $group:
      {
        _id: "$novel",
        id: {$first: "$_id"},
        title: {$first: "$title"},
        novel: {$first: "$novel"},
        number: {$first: "$number"}
      }
    },
    {
      $group:
      {
        _id: "$id",
        title: {$first: "$title"},
        novel: {$first: "$novel"},
        number: {$first: "$number"}
      }
    },
    { $sort: {_id : -1}},
    { $limit: 10}
  ]);

  /* Non map-reduce version, much simpler */
  //return Chapter.find({public: true}, "title novel number").sort({_id: -1}).limit(10);
};

module.exports = Chapter;