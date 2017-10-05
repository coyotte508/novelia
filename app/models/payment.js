const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var paymentSchema = new Schema({
  author: Schema.Types.ObjectId,
  type: String,
  goldAmount: Number,
  money: {
    amount: Number,
    currency: String
  }
});

var Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
