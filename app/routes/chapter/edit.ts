import val from '../../config/validator';
import * as utils from '../utils';
import Router from 'express-promise-router';
import { NovelDocument } from '../../models/novel';

const router = Router();

router.get('/edit', utils.canTouchNovel, async (req, res) => {
  res.render('pages/novel/addchapter', {novel: req.novel, chapter: req.chapter,  action: "edit"});
});


router.post('/edit', utils.canTouchNovel, async (req, res) => {
  let novel: NovelDocument;
  try {
    novel = req.novel;
    const title = val.validateTitle(req.body.chapterTitle);
    const content = val.validateChapter(req.body.chapterContent);
    const authorNote = val.validateDescription(req.body.authorNote);

    await req.chapter.update({title, content, authorNote});

    res.redirect(novel.link + "/" + req.chapter.number);
  } catch (err) {
    res.status(err.statusCode || 500);
    res.render('pages/novel/addchapter', {novel: novel || {}, chapter: req.chapter,  message: err.message, action: "edit"});
  }
});

export default router;
