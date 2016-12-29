const router = require("express").Router();
const passport = require("passport");
const configAuth = require("../../config/auth");

// =====================================
// GOOGLE ROUTES =======================
// =====================================
// send to google to do the authentication
// profile gets us their basic information including their name
// email gets their emails
router.get('/auth/google', (req, res, next) => { 
  var f = passport.authenticate('google', { 
    scope : ['profile', 'email'],
    /* .get('host') to get port as well */
    callbackURL: "http://"+req.get('host')+configAuth.googleAuth.callbackURL
  });
  f (req,res,next); 
});

// the callback after google has authenticated the user
router.get('/auth/google/callback',
  passport.authenticate('google', {
        successRedirect : '/profile',
        failureRedirect : '/'
}));

module.exports = router;