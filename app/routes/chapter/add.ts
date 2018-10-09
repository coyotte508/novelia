import val from '../../config/validator';
import limiter from 'mongo-limiter';
import locks from 'mongo-locks';
import * as utils from '../utils';
import {Novel, Chapter} from '../../models';
import Router from 'express-promise-router';
import { NovelDocument } from '../../models/novel';
import { Request } from '../../types';

const router = Router();

router.get('/addchapter', utils.canTouchNovel, async (req: Request, res) => {
  res.render('pages/novel/addchapter', {novel: req.novel, message: "", action: "add"});
});

router.post('/addchapter', utils.canTouchNovel, async (req: Request, res) => {
  /* Todo: check if user can post new novel */
  let free = () => {};
  let novel: NovelDocument;
  try {
    novel = req.novel;
    const prologue = (req.body.options || "").split(",").indexOf("prologue") !== -1;
    const number = prologue ? 0 : (novel.numChapters + 1);

    if (!(await limiter.possible(req.user.id, 'addchapter'))) {
      throw new utils.HttpError(`You can only add ${limiter.limits.addchapter.limit} chapters per day`, 403);
    }

    const title = val.validateTitle(req.body.chapterTitle || ("" + number));
    const content = val.validateChapter(req.body.chapterContent);
    const authorNote = val.validateDescription(req.body.authorNote);

    free = await locks.lock("major-novel-change", novel.id);

    novel = await Novel.findById(novel.id); // force refresh
    utils.assert403(!(novel.prologue && prologue), "There is already a prologue, you can't add another one.");

    const chapter = new Chapter();
    chapter.title = title;
    chapter.content = content;
    chapter.authorNote = authorNote;
    chapter.novel = {ref: novel._id, title: novel.title};
    chapter.number = prologue ? 0 : (novel.numChapters + 1);
    chapter.public = novel.public;

    await chapter.save();

    await novel.addChapter(chapter);

    limiter.action(req.user.id, "addchapter", {title, novel: novel.title});

    res.redirect(novel.link() + "/" + (prologue ? 0 : novel.numChapters + 1));
  } catch (err) {
    res.status(err.statusCode || 500);
    res.render('pages/novel/addchapter', {novel: novel || {}, message: err.message, action: "add"});
  } finally {
    free();
  }
});

export default router;
