import * as mongoose from 'mongoose';
import * as slug from 'slug';
import {Types} from 'mongoose';
import Novel from "./novel";
import { NovelDocument } from './novel';
const Schema = mongoose.Schema;

export interface ChapterDocument extends mongoose.Document {
  title: string;
  content: string;
  views: number;
  novel: {
    ref: Types.ObjectId,
    title: string
  };
  authorNote: string;
  public: boolean;
  number: number;

  getNovelLink(): string;
  getLink(): string;
}

interface Chapter extends mongoose.Model<ChapterDocument> {
  latestUpdates(conditions?: object): Promise<Chapter[]>;
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

chapterSchema.static("latestUpdates", async function(this: Chapter, filter: object) {
  const novels = await Novel.latestUpdates(filter);
  const chapters = await this.find({
    _id: {$in: novels.map((item: NovelDocument) => item.latestChapter)}
  }, "title novel number").sort({_id: -1});

  return chapters;
  /* Map reduce version, to return only chapters from different novels */
  // let results = await Chapter.aggregate([
  //   { $match: filter },
  //   { $sort: {_id : -1}},
  //   //{ $limit: 100},
  //   {
  //     $group:
  //     {
  //       _id: "$novel",
  //       id: {$first: "$_id"},
  //       title: {$first: "$title"},
  //       novel: {$first: "$novel"},
  //       number: {$first: "$number"}
  //     }
  //   },
  //   {
  //     $group:
  //     {
  //       _id: "$id",
  //       title: {$first: "$title"},
  //       novel: {$first: "$novel"},
  //       number: {$first: "$number"}
  //     }
  //   },
  //   { $sort: {_id : -1}},
  //   { $limit: 10}
  // ]);

  // for (let result of results) {
  //   result.getLink = chapterSchema.methods.getLink;
  //   result.getNovelLink = chapterSchema.methods.getNovelLink;
  // }

  // return results;

  /// * Non map-reduce version, much simpler */
  //// return Chapter.find({public: true}, "title novel number").sort({_id: -1}).limit(10);
});

export default mongoose.model<ChapterDocument, Chapter>('Chapter', chapterSchema);

