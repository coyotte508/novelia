import { Comment } from '../../models';
import Router from 'express-promise-router';

const router = Router();

router.get('/comments', async (req, res) => {
  const admin = req.user && req.user.isAdmin();
  const filter = admin ? {} : {public: true};

  const comments = await Comment.find(filter).sort({_id: -1}).limit(50);

  res.render('pages/comment/comments', {comments});
});

export default router;
