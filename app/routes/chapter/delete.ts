import locks from 'mongo-locks';
import limiter from 'mongo-limiter';
import * as utils from '../utils';
import {Novel} from '../../models';
import Router from 'express-promise-router';
import {Request} from '../../types';

const router = Router();

router.all('/delete', utils.canTouchNovel, async (req: Request, res, next) => {
  let free = () => {};
  try {
    free = await locks.lock("major-novel-change", req.novel.id);
    const novel = await(Novel.findById(req.novel.id)); // force refresh

    const num = req.params.chapter;
    const chapter = req.chapter;

    await novel.deleteChapter(chapter);

    limiter.action(req.user.id, "delchapter", {num, chapter: chapter.title, novel: novel.title});

    chapter.remove();

    res.redirect(novel.link());
  } catch (err) {
    next(err);
  } finally {
    free();
  }
});

export default router;
