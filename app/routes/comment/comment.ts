import * as utils from '../utils';
import {Comment} from '../../models';
import Router from 'express-promise-router';

import _delete from 'delete';

const router = Router();

router.param('comment', async (req, res, next, commentId) => {
  req.comment = await Comment.findById(commentId);

  if (!req.comment) {
    throw new utils.HttpError('Comment not found', 404);
  }

  next();
});

router.use('/comment/:comment', _delete);

export default router;
