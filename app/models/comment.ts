import * as mongoose from 'mongoose';
import { Types } from 'mongoose';
const Schema = mongoose.Schema;

interface CommentDocument extends mongoose.Document {
  text: string;
  source: Types.ObjectId;
  sourceType: string;
  author: {
    ref: Types.ObjectId;
    name: string;
    link: string;
  };
  public: boolean;
  likes: number;
}

interface Comment extends mongoose.Model<CommentDocument> {
  commentsFor(source: Types.ObjectId): Promise<CommentDocument[]>;
}

const commentSchema = new Schema({
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

commentSchema.static('commentsFor', async function(this: Comment, source: Types.ObjectId) {
  return await this.find({source}).sort({_id: 1});
});

export default mongoose.model<CommentDocument, Comment>('Comment', commentSchema);
