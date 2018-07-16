import * as val from 'validator';
import limit from 'mongo-limiter';
import * as utils from '../../utils';
import Router from 'express-promise-router';

const router = Router();

router.post('/settings/profile', utils.isLoggedIn, async (req, res) => {
  try {
    req.user.bio = val.validateDescription(req.body.bio);

    await limit.action(req.user.id, "update-profile");
    await req.user.save();

    res.redirect("/profile");
  } catch (err) {
    res.render("pages/user/settings", {req, message: err.message, tab: "profile", title: "Public profile"});
  }
});

export default router;
