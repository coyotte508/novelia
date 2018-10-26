import * as mongoose from 'mongoose';
import {Types} from 'mongoose';
import * as slug from 'slug';
const Schema = mongoose.Schema;
import * as assert from 'assert';
import Chapter, { ChapterDocument } from './chapter';
import DailyCount from './dailyCount';
import * as _ from "lodash";

export interface NovelDocument extends mongoose.Document {
  title: string;
  author: {
    ref: Types.ObjectId,
    name: string,
    link: string
  };
  image: {
    ref: Types.ObjectId,
    link: string
  };
  categories: string[];
  latestChapter: Types.ObjectId;
  description: string;
  totalViews: number;
  totalLikes: number;
  public: boolean;
  prologue: boolean;
  slug: string;
  numChapters: number;
  follows: number;
  firstPublicationDate: Date;
  wordCount: number;

  dailyLikes: number;
  dailyViews: number;

  /* Virtuals */
  publicChaptersCount: number;
  chapters?: ChapterDocument[];

  /* Methods */
  link(): string;
  classySlug(): string;
  uploadRate(): number;
  publicationDate(): Date;
  loadChapters(): Promise<void>;
  updateWordCount(): Promise<void>;
  addChapter(chapter: ChapterDocument): Promise<void>;
  deleteChapter(chapter: ChapterDocument): Promise<void>;
  adjustDailyLikes(): Promise<void>;
  getImageLink(format?: string): string;
}

interface Novel extends mongoose.Model<NovelDocument> {
  latestUpdates(conditions?: object): Promise<NovelDocument[]>;
  /**
   * 10 novels with the most daily views
   * @param conditions Additional conditions (category, ...)
   */
  dailyTop(conditions?: object): Promise<NovelDocument[]>;
}

// define the schema for our user model
const novelSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  author: {
    type: {
      ref: {
        type: Schema.Types.ObjectId,
        index: true
      },
      name: String,
      link: String
    },
    required: true
  },
  image: {
    ref: Schema.Types.ObjectId,
    link: String
  },
  categories: {
    type: [String],
    index: true
  },
  firstPublicationDate: {
    type: Date
  },
  latestChapter: {
    type: Schema.Types.ObjectId,
    index: true
  },
  description: String,
  totalViews: {
    type: Number,
    default: 0
  },
  totalLikes: {
    type: Number,
    default: 0
  },
  wordCount: {
    type: Number,
    default: 0,
    index: true
  },
  public: {
    type: Boolean,
    default: true
  },
  prologue: Boolean,
  slug: {
    type: String,
    unique: true
  },
  numChapters: {
    type: Number,
    default: 0
  },
  follows: {
    type: Number,
    default: 0
  },
  dailyViews: {
    type: Number,
    default: 0,
    index: true
  },
  dailyLikes: {
    type: Number,
    default: 0
  }
});

// novelSchema.index({"title": "text"});

novelSchema.pre<NovelDocument>("save", function(next) {
  if (this.title) {
    this.slug = slug(this.title, {lower: true});
  }

  next();
});

novelSchema.method("loadChapters",  async function(this: NovelDocument) {
  if (this.chapters) {
    return;
  }
  this.chapters = await Chapter.find({"novel.ref": this._id}, "title number views wordCount").sort({number: 1});
});

novelSchema.method("updateWordCount", async function(this: NovelDocument) {
  await this.loadChapters();
  this.wordCount = _.sum(this.chapters.map(ch => ch.wordCount));
});

novelSchema.method("adjustDailyLikes", async function(this: NovelDocument) {
  const [likes, unlikes] = await Promise.all([DailyCount.dailyCount("like-novel", this.id), DailyCount.dailyCount("unlike-novel", this.id)]);

  await this.update({dailyLikes: likes - unlikes});
});

novelSchema.virtual("publicChaptersCount", function(this: NovelDocument) {
  if (!this.public) {
    return 0;
  }

  return this.numChapters + (this.prologue ? 0 : 1);
});

novelSchema.method("publicationDate", function(this: NovelDocument) {
  return this.firstPublicationDate;
});

novelSchema.method("uploadRate", function(this: NovelDocument) {
  const nChapters = this.numChapters + (this.prologue ? 0 : 1);
  if (!nChapters) {
    return 0;
  }

  const timeSpan = Math.max((Date.now() - (this.publicationDate() || new Date()).getTime()), 24 * 3600 * 1000) / (24 * 3600 * 1000);

  return timeSpan / nChapters;
});

novelSchema.method('classySlug', function(this: NovelDocument) {
  return slug(this.title, {lower: false});
});

novelSchema.method('link', function(this: NovelDocument) {
    return /*"/nv/" +*/ "/" + this.classySlug();
});

novelSchema.method('addChapter', async function(this: NovelDocument, chapter: ChapterDocument) {
  if (chapter.number === 0) {
    await this.update({
      prologue: true,
      latestChapter: chapter.id,
      wordCount: this.wordCount + chapter.wordCount
    });
  } else {
    await this.update({
      $inc: {numChapters: 1},
      latestChapter: chapter.id,
      wordCount: this.wordCount + chapter.wordCount
    });
  }

  if (!this.firstPublicationDate && this.public) {
    await this.update({firstPublicationDate: new Date()});
  }
});

novelSchema.method('deleteChapter', async function(this: NovelDocument, chapter: ChapterDocument) {
  const num = chapter.number;
  assert(this.numChapters >= num, "You can only delete the last chapter");

  const latestChapterQuery = await Chapter.find({"novel.ref": this.id, "number": {$lt: num}}).sort({number: -1}).limit(1);
  const latestChapter = latestChapterQuery[0] || null;

  if (num === 0) {
    await this.update(
      {
        $inc: {totalViews: -chapter.views},
        prologue: false,
        latestChapter
      });
  } else {
    await this.update(
      {
        $inc: {numChapters: -1, totalViews: -chapter.views},
        latestChapter
      });
  }
});

novelSchema.method('getImageLink', function(this: NovelDocument, format?: string) {
  if (format && this.image.link) {
    return this.image.link.substr(0, this.image.link.lastIndexOf(".")) + "-" + format + this.image.link.substr(this.image.link.lastIndexOf("."));
  }

  return this.image.link;
});

novelSchema.static('latestUpdates', async function(this: Novel, conditions?: object) {
  conditions = Object.assign({public: true, wordCount: {$gt: 0}}, conditions);

  const results = await this.find(conditions, "title latestChapter").sort({latestChapter: -1}).limit(10);

  return results;
});

novelSchema.static('dailyTop', async function(this: Novel, conditions?: object) {
  conditions = Object.assign({public: true, wordCount: {$gt: 0}}, conditions);

  const results = await this.find(conditions, "title dailyViews").sort({dailyViews: -1}).limit(10);

  return results;
});

export default mongoose.model<NovelDocument, Novel>('Novel', novelSchema);
