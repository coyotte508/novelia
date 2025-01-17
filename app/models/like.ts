import * as mongoose from 'mongoose';
import { Types } from 'mongoose';
const Schema = mongoose.Schema;

export interface LikeDocument extends mongoose.Document {
  source: Types.ObjectId;
  sourceType: "chapter" | "comment";
  author: Types.ObjectId;
}

const likeSchema = new Schema({
  source: Schema.Types.ObjectId, // Id of object liked
  sourceType: {
    type: String,
    enum: ["chapter", "comment"]
  },
  author: {
    type: Schema.Types.ObjectId, // author
    required: true
  }
});

likeSchema.index({source: 1, author: 1}, {unique: true});

export default mongoose.model<LikeDocument>('Like', likeSchema);
