const multer = require("multer");
const fs = require("fs-extra");
const unzip = require("unzipper");
const router = require("express").Router();
const {Novel, Chapter, User, Image, Comment, Payment} = require("../../models");
const {restore} = require('../../models/backup');

const upload = multer({ dest: "/tmp/novelia" });

router.post("/load/database", upload.single("archive"), async (req, res, next) => {
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

    console.log(req.file);

    let filePath = req.file.path;

    /* Remove old files before extraction */
    for (let key in database) {
      await fs.remove(`/tmp/novelia/${key}.bson`);
    }

    let extracter = unzip.Extract({ path: '/tmp/novelia' });

    let extractProcess = new Promise((resolve, reject) => {
      fs.createReadStream(filePath).pipe(extracter);

      extracter.on("close", resolve);
      extracter.on("error", reject);
    });

    await extractProcess;
    await restore();

    req.flash("success", "Reloaded from database!");
    res.redirect("back");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
