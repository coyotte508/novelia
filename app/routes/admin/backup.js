const BSON = require("bson");
const path = require("path");
const archiver = require("archiver-promise");
const fs = require("fs-extra");
const router = require("express").Router();
const {Novel, Chapter, User, Image, Comment, Payment} = require("../../models");


router.get("/backup/database.zip", async (req, res, next) => {
  try {
    const database =
      {
        Novel,
        Chapter,
        User,
        Image,
        Comment,
        Payment
      };

    let outputDir = path.join(__dirname, "../../../", "bin", "backup", "database");
    let archivePath = path.join(outputDir, "../", "database.zip");

    await fs.mkdirp(outputDir);
    console.log("Made dir", outputDir);

    var archive = archiver(archivePath, {store:true});

    for (let coll in database) {
      let bson = new BSON();
      let data = await database[coll].find({});
      let filename = coll+".bson";
      let filepath = path.join(outputDir, filename);

      await fs.writeFile(filepath, bson.serialize(data));

      archive.file(filepath, {name: filename});
    }

    await archive.finalize(archivePath);

    res.sendFile(archivePath);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
