const limiter = require("mongo-limiter");
const multer = require("multer");
const assert = require("assert");
const path = require("path");
const utils = require("../utils");
const router = require("express-promise-router")();
const {Image} = require("../../models");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/edit-image', utils.canTouchNovel, async (req, res) => {
  res.render('pages/novel/edit-image', {novel: req.novel});
});

router.post('/edit-image', utils.canTouchNovel, upload.single('cover'), async (req, res) => {
  assert(req.file.mimetype.startsWith("image/"), "The file uploaded must be an image.");

  let novel = req.novel;

  if (!(await limiter.attempt(req.user.id, 'uploadimage', novel.title))) {
    throw new utils.HttpError(`You can only upload ${limiter.limits().uploadimage.limit} images per day`, 403);
  }

  let fullImage = await Image.createOrUpdate({
    type: "novel",
    buffer: req.file.buffer,
    name: novel.slug,
    ext: path.extname(req.file.originalname),
    source: novel.ref
  }, req.novel.image.ref);

  await novel.update({image: {ref: fullImage.id, link: fullImage.getLink()}});

  res.redirect(novel.getLink());
});

module.exports = router;
