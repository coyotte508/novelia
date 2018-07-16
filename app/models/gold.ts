import * as mongoose from 'mongoose';
import {Types} from 'mongoose';
const Schema = mongoose.Schema;

export interface GoldDocument extends mongoose.Document {
  owner: Types.ObjectId;
  amount: number;
  payment: Types.ObjectId;
  trace: Array<{
    source: Types.ObjectId;
    dest: Types.ObjectId;
    action: {
      what: string;
      ref: Types.ObjectId;
    }
  }>;
}

const goldSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    index: true
  },
  amount: Number,
  payment: Schema.Types.ObjectId,
  trace: [{
    source: Schema.Types.ObjectId,
    dest: Schema.Types.ObjectId,
    action: {
      what: String,
      ref: Schema.Types.ObjectId
    }
  }]
});

export default mongoose.model<GoldDocument>("Gold", goldSchema);
