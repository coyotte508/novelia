'use strict';

const Novel = require("../models/novel");

function latest(doc) {
  var chaps = doc.chapters.map(it => it.ref || null).filter(it => !!it).sort().reverse();
  return chaps.length === 0 ? null : chaps[0];
}

let migrations = {
  "0.1.2": {
    name: "add latest chapter",
    up: async function () {
      console.log("Starting migration process...");
      let novels = await Novel.find({}, "chapters _id");
      console.log("Found novels", novels.length);

      for (let novel of novels) {
        console.log("Updating novel", novel);
        await novel.update({latestChapter: latest(novel)});
      }
      console.log("end");
    }, down: async function () {
      await Novel.updateMany({}, {$unset: {latestChapter: ""}});
    }
  }
};

module.exports = migrations;
