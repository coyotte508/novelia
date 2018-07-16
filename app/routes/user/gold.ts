import * as utils from '../utils';
import Router from 'express-promise-router';

const router = Router();

router.get('/account/gold', utils.isLoggedIn, async (req, res) => {
  res.render('pages/user/gold');
});

export default router;
