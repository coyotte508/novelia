const router = require("express").Router();

router.get('/users', (req, res) => {
  res.redirect('back');
});

module.exports = router;