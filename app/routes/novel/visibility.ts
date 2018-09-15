import limiter from "mongo-limiter";
import * as utils from "../utils";
import Router from "express-promise-router";
import {Chapter} from "../../models";
const router = Router();

router.all('/show', utils.canTouchNovel, async (req, res) => {
  const novel = req.novel;

  if (!(await limiter.attempt(req.user.id, 'shownovel', novel.title))) {
    throw new utils.HttpError(`You can only change your novels' viewable settings ${limiter.limits.shownovel.limit} times per hour`, 403);
  }

  Chapter.update({"novel.ref": novel.id}, {public: true}, {multi: true}).then();
  await novel.update({public: true});

  res.redirect(novel.link());
});

router.all('/hide', utils.canTouchNovel, async (req, res) => {
  const novel = req.novel;

  Chapter.update({"novel.ref": novel.id}, {public: false}, {multi: true}).then();
  await novel.update({public: false});

  res.redirect(novel.link());
});

export default router;
