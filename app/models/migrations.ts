'use strict';

import Novel, {NovelDocument} from './novel';

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
  }
};

module.exports = migrations;
