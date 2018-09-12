import limiter from 'mongo-limiter';
import * as multer from 'multer';
import * as assert from 'assert';
import * as path from 'path';
import * as utils from '../utils';
import {Image} from '../../models';
import Router from 'express-promise-router';
import { Request } from '../../types';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/edit-image', utils.canTouchNovel, async (req: Request, res) => {
  res.render('pages/novel/edit-image', {novel: req.novel});
});

router.post('/edit-image', utils.canTouchNovel, upload.single('cover'), async (req: Request, res) => {
  assert(req.file.mimetype.startsWith("image/"), "The file uploaded must be an image.");

  const novel = req.novel;

  if (!(await limiter.attempt(req.user.id, 'uploadimage', novel.title))) {
    throw new utils.HttpError(`You can only upload ${limiter.limits.uploadimage.limit} images per day`, 403);
  }

  const fullImage = await Image.createOrUpdate({
    type: "novel",
    buffer: req.file.buffer,
    name: novel.slug,
    ext: path.extname(req.file.originalname),
    source: novel._id
  }, req.novel.image.ref);

  await novel.update({image: {ref: fullImage.id, link: fullImage.getLink()}});

  res.redirect(novel.link);
});

export default router;
