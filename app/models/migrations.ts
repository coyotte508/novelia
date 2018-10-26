'use strict';

import { ObjectId } from 'bson';
import { Chapter, Comment, Novel } from '.';

function latest(doc: any) {
  const chaps = doc.chapters.map((it: any) => it.ref || null).filter((it: any) => !!it).sort().reverse();
  return chaps.length === 0 ? null : chaps[0];
}

const migrations = {
  "0.1.2": {
    name: "add latest chapter",
    async up() {
      console.log("Starting migration process...");
      const novels = await Novel.find({}, "chapters _id");
      console.log("Found novels", novels.length);

      for (const novel of novels) {
        console.log("Updating novel", novel);
        await novel.update({latestChapter: latest(novel)});
      }
      console.log("end");
    }, async down() {
      await Novel.updateMany({}, {$unset: {latestChapter: ""}});
    }
  },
  "0.1.6": {
    name: "refs are ids, not strings",
    async up() {
      console.log("Starting migration process...");

      const update = async (model, field) => {
        const docs = await model.find({}, field.split(".")[0]);
        console.log("found", docs.length, "docs");
        for (const doc of docs) {
          doc.set(field, new ObjectId(doc.get(field)));
          await doc.save();
        }
      };

      await update(Novel, "author.ref");
      await update(Chapter, "novel.ref");
      await update(Comment, "author.ref");

      console.log("end");
    }
  },
  "0.2.0": {
    name: "add word count",
    async up() {
      const chapters = await Chapter.find({wordCount: {$exists: false}});
      for (const chapter of chapters) {
        chapter.updateWordCount();
        await chapter.save();
      }
    }
  }
};

module.exports = migrations;
