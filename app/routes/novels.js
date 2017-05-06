const router = require("express").Router();

router.get('/novels', (req, res) => {
  res.redirect('back');
});

module.exports = router;