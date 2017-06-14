const multer = require("multer");
const assert = require("assert");
const path = require("path");
const utils = require("../utils");
const router = require("express").Router();
const {Image} = require("../../models");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/edit-image', utils.canTouchNovel, async (req, res, next) => {
  try {
    res.render('pages/novel/edit-image', {novel: req.novel});
  } catch(err) {
    next(err);
  }
});

router.post('/edit-image', utils.canTouchNovel, upload.single('cover'), async (req, res, next) => {
  try {
    assert(req.file.mimetype.startsWith("image/"), "The file uploaded must be an image.");

    let novel = req.novel;

    let fullImage = await Image.createOrUpdate({
      type: "novel",
      buffer: req.file.buffer,
      name: novel.slug,
      ext: path.extname(req.file.originalname),
      source: novel.ref
    }, req.novel.image.ref);

    await novel.update({image: {ref: fullImage.id, link: fullImage.getLink()}});

    return res.redirect(novel.getLink());
  } catch(err) {
    next(err);
  }
});

module.exports = router;
