const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// define the schema for our user model
var commentSchema = new Schema({
  text: String,
  source: {
    type: Schema.Types.ObjectId,
    index: true
  },
  sourceType: String,
  author: {
    type: {
      ref: {
        type: Schema.Types.ObjectId,
        author: true
      },
      name: String,
      link: String
    },
    required: true
  },
  public: {
    type: Boolean,
    default: true
  },
  likes: {
    type: Number,
    default: 0
  }
});

let Comment = mongoose.model('Comment', commentSchema);

Comment.commentsFor = async function(source) {
  return Comment.find({source}).sort({_id: 1});
};

module.exports = Comment;
