import {Chapter, Comment, Like} from '../../models';
import * as utils from '../utils';
import * as viewcounter from '../../engine/viewcounter';
import Router from 'express-promise-router';

import add from './add';
import edit from './edit';
import _delete from './delete';
import like from './like';
import comment from './comment';

const router = Router();

router.param('chapter', async (req, res, next, chapterNum) => {
  const novel = req.novel;
  const chap = +chapterNum;

  req.chapter = await Chapter.findOne({"novel.ref": novel._id, "number": chap});

  utils.assert404(req.chapter, "Chapter not found");

  next();
});

router.get('/:chapter(\\d+)/', async (req, res) => {
  const likesChapter = req.user ? await Like.count({source: req.chapter._id, author: req.user.id}) : false;
  viewcounter.addView(req);
  const comments = await Comment.commentsFor(req.chapter._id);
  res.render('pages/novel/chapter', {novel: req.novel, chapter: req.chapter, comments, likesChapter});
});

router.use("/", add);
router.use("/:chapter(\\d+)/", edit);
router.use("/:chapter(\\d+)/", _delete);
router.use("/:chapter(\\d+)/", like);
router.use("/:chapter(\\d+)/comment", comment);

export default router;
