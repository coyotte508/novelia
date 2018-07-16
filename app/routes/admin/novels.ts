import {Novel} from "../../models";
import Router from 'express-promise-router';

const router = Router();

router.get('/novels', async (req, res) => {
  const admin = req.user && req.user.isAdmin();
  const filter = admin ? {} : {public: true};

  const novels = await Novel.find(filter, "title latestChapter author numChapters").sort({_id: -1}).limit(50);

  res.render('pages/novel/novels', {novels});
});

export default router;
