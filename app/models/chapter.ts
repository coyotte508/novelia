import * as mongoose from 'mongoose';
import * as slug from 'slug';
import {Types} from 'mongoose';
import Novel from "./novel";
import { NovelDocument } from './novel';
import { ObjectId } from 'bson';
import * as wordcount from 'wordcount';
import * as stripTags from 'striptags';

const Schema = mongoose.Schema;

export interface ChapterDocument extends mongoose.Document {
  title: string;
  content: string;
  views: number;
  likes: number;
  novel: {
    ref: Types.ObjectId,
    title: string
  };
  authorNote: string;
  public: boolean;
  number: number;
  wordCount: number;

  getNovelLink(): string;
  getLink(): string;
  updateWordCount(): void;
}

interface Chapter extends mongoose.Model<ChapterDocument> {
  latestUpdates(conditions?: object): Promise<Chapter[]>;
  best(days?: number, conditions?: object): Promise<Chapter[]>;
}

// define the schema for our user model
const chapterSchema = new Schema({
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
  wordCount: {
    type: Number,
    default: 0
  },
  likes: {
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

// chapterSchema.index({"title": "text"});
chapterSchema.index({"novel.ref" : 1, "number": -1}, {unique: true});

chapterSchema.method("getNovelLink", function(this: ChapterDocument) {
  return /*"/nv/" +*/ "/" + slug(this.novel.title, {lower: false});
});

chapterSchema.method("getLink", function(this: ChapterDocument) {
  return this.getNovelLink() + "/" + this.number;
});

chapterSchema.method('updateWordCount', function(this: ChapterDocument) {
  this.wordCount = wordcount(stripTags(this.content));
});

chapterSchema.static("latestUpdates", async function(this: Chapter, filter: object) {
  const novels = await Novel.latestUpdates(filter);
  const chapters = await this.find({
    _id: {$in: novels.map((item: NovelDocument) => item.latestChapter)}
  }, "title novel number").sort({_id: -1}).limit(10);

  return chapters;
});

chapterSchema.static("best", async function(this: Chapter, days = 1, conditions?: object) {
  const deadline = ObjectId.createFromTime(Date.now() / 1000 - days * 24 * 3600);
  conditions = Object.assign({_id: {$gt: deadline}, public: true}, conditions);

  /* Map reduce version, to return only chapters from different novels */
  const results = await this.aggregate([
    { $match:  conditions},
    { $sort: {views : -1}},
    { $limit: 100},
    {
      $group:
      {
        _id: "$novel.ref",
        title: {$first: "$novel.title"},
        number: {$first: "$number"},
        views: {$first: "$views"}
      }
    },
    { $sort: {views : -1}},
    { $limit: 10}
  ]);

  for (const result of results) {
    result.getNovelLink = chapterSchema.methods.getNovelLink;
    result.novel = {title: result.title};
  }

  return results;
});

export default mongoose.model<ChapterDocument, Chapter>('Chapter', chapterSchema);

