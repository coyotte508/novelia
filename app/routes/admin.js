const router = require("express").Router();
const utils = require("./utils");

router.get("/admin", utils.isAdmin, (req, res) => {
  res.render("pages/admin", {req});
});

module.exports = router;