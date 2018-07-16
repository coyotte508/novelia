import {User} from '../../models';
import Router from 'express-promise-router';

const router = Router();

router.get('/users', async (req, res) => {
  const users = await User.find({}, User.basics()).sort({_id: -1}).limit(50);

  res.render('pages/user/users', {users});
});

export default router;
