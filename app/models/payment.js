const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var paymentSchema = new Schema({
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

var Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
