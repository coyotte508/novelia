function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/login?referrer='+req.url);
}

module.exports = {
  isLoggedIn
};