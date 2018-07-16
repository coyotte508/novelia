import Router from 'express-promise-router';
import * as utils from '../utils';
import {Novel, Chapter, User, Comment} from "../../models";
import limiter from 'mongo-limiter';


const router = Router();

router.get("/admin", utils.isAdmin, async (req, res) => {
  const [nbNovels, nbChapters, nbUsers, nbComments, actions] = await Promise.all([Novel.count({}), Chapter.count({}), User.count({}), Comment.count({}), limiter.logs()]);

  const userIds = actions.map(x => x.user).filter(x => !x.includes(".") && !x.includes(":"));
  const users = await User.find({_id: {$in: userIds}});
  const userD = {};
  users.forEach(x => userD[x.id] = x);

  actions.forEach(x => {
    if (typeof x.data === "object") { x.data = JSON.stringify(x.data || ""); }
    if (x.user in userD) {
      x.userLink = userD[x.user].getLink();
      x.user = userD[x.user].displayName();
    }
  });

  const stats = {
    nbUsers, nbChapters, nbNovels, nbComments
  };

  res.render("pages/admin", {actions, stats});
});

import novels from './novels';
import usersR from './users';
import comments from './comments';
import backup from './backup';
import load from './load';

router.use("/", novels);
router.use("/", usersR);
router.use("/", comments);
router.use("/admin", utils.isAdmin, backup);
router.use("/admin", utils.isAdmin, load);

export default router;
