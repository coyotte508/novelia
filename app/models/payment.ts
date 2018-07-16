import * as mongoose from 'mongoose';
import { Types } from 'mongoose';
const Schema = mongoose.Schema;

export interface PaymentDocument extends mongoose.Document {
  author: Types.ObjectId;
  platform: {
    name: string;
    paymentRef: string;
  };
  goldAmount: number;
  money: {
    amount: number;
    currency: string;
  };
}

const paymentSchema = new Schema({
  author: Schema.Types.ObjectId,
  platform: {
    name: String, /*Credit Card, paypal, stripe... */
    paymentRef: String /* Id of payment on third party's platform */
  },
  goldAmount: Number,
  money: {
    amount: Number,
    currency: String
  }
});

export default mongoose.model<PaymentDocument>('Payment', paymentSchema);
