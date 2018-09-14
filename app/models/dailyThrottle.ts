import * as mongoose from 'mongoose';

/**
 * Limits actions to one per day
 */

const dailyThrottleSchema = new mongoose.Schema({
  _id: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 24 * 3600
  }
});

interface DailyThrottleDocument extends mongoose.Document {
  _id: string;
  createdAt: Date;
}

interface DailyThrottle extends mongoose.Model<DailyThrottleDocument> {
  add(...args: any[]): Promise<void>;
}

dailyThrottleSchema.static('add', async function(this: DailyThrottle, ...args: any[]) {
  const dailyThrottle = new this({_id: args.join("_")});
  await dailyThrottle.save();
});

const DailyThrottle = mongoose.model<DailyThrottleDocument, DailyThrottle>('DailyThrottle', dailyThrottleSchema);

export default DailyThrottle;
