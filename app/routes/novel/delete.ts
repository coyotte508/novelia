import * as utils from '../utils';
import limiter from 'mongo-limiter';
import {Chapter, Image} from '../../models';
import Router from 'express-promise-router';

const router = Router();

router.all('/delete', utils.canTouchNovel, async (req, res) => {
  const novel = req.novel;
  utils.assert403(novel.numChapters === 0, "You can only delete empty novels");

  limiter.action(req.user.id, "delnovel", novel.title);

  if (novel.image.ref) {
    try {
      const image = await Image.findById(novel.image.ref);
      await image.delete();
    } catch (err) {
      console.error(err);
    }
  }

  if (novel.prologue) {
    Chapter.findOneAndRemove(novel.chapters[0].ref).exec();
  }
  novel.remove();

  res.redirect("/profile");
});

export default router;
