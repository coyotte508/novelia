import Router from 'express-promise-router';
import * as utils from '../utils';
import {Novel, Chapter, User, Comment} from "../../models";
import limiter from 'mongo-limiter';
import { Request } from '../../types';

const router = Router();

router.get("/admin", utils.isAdmin, async (req: Request, res) => {
  const [nbNovels, nbChapters, nbUsers, nbComments, actions] = await Promise.all([Novel.count({}), Chapter.count({}), User.count({}), Comment.count({}), limiter.logs({})]);

  const userIds = actions.map(x => x.user).filter(x => !x.includes(".") && !x.includes(":"));
  const users = await User.find({_id: {$in: userIds}});
  const userD: {[id: string]: UserDocument} = {};
  users.forEach(x => userD[x.id] = x);

  const actionsB = actions.map(x => ({
    id: x.id,
    data: x.data ? JSON.stringify(x.data) : undefined,
    user: userD[x.user].displayName(),
    userLink: userD[x.user].link,
    action: x.action
  }));

  const stats = {
    nbUsers, nbChapters, nbNovels, nbComments
  };

  res.render("pages/admin", {actions: actionsB, stats});
});

import novels from './novels';
import usersR from './users';
import comments from './comments';
import backup from './backup';
import load from './load';
import { UserDocument } from '../../models/user';

router.use("/", novels);
router.use("/", usersR);
router.use("/", comments);
router.use("/admin", utils.isAdmin, backup);
router.use("/admin", utils.isAdmin, load);

export default router;
