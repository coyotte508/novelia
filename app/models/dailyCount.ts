import * as mongoose from 'mongoose';

const dailyCountSchema = new mongoose.Schema({
  action: {
    type: String,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 24 * 3600
  }
});

interface DailyCountDocument extends mongoose.Document {
  action: string;
  createdAt: Date;
}

interface DailyCount extends mongoose.Model<DailyCountDocument> {
  add(...args: any[]): Promise<void>;
  dailyCount(...args: any[]): Promise<number>;
}

dailyCountSchema.static('add', async function(this: DailyCount, ...args: any[]) {
  const dailyCount = new this({action: args.join("-")});
  await dailyCount.save();
});

dailyCountSchema.static('dailyCount', async function(this: DailyCount, ...args: any[]) {
  return await this.count({action: args.join('_')});
});

const DailyCount = mongoose.model<DailyCountDocument, DailyCount>('DailyCount', dailyCountSchema);

export default DailyCount;
