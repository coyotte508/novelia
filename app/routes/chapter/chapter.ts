import {Chapter, Comment} from '../../models';
import utils from '../utils';
import viewcounter from '../../engine/viewcounter';
import Router from 'express-promise-router';

import add from './add';
import edit from './edit';
import _delete from './delete';
import comment from './comment';

const router = Router();

router.param('chapter', async function(req, res, next, chapterNum) {
  const novel = req.novel;
  const chap = +chapterNum;

  req.chapter = await Chapter.findOne({"novel.ref": novel.id, "number": chap});

  utils.assert404(req.chapter, "Chapter not found");

  next();
});

router.get('/:chapter(\\d+)/', async (req, res) => {
  viewcounter.addView(req);
  const comments = await Comment.commentsFor(req.chapter.id);
  res.render('pages/novel/chapter', {novel: req.novel, chapter: req.chapter, comments});
});

router.use("/", add);
router.use("/:chapter(\\d+)/", edit);
router.use("/:chapter(\\d+)/", _delete);
router.use("/:chapter(\\d+)/comment", comment);

export default router;
