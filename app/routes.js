const express = require("express");

var router = express.Router();

router.get("/", (req, res) => {
  res.render("pages/index", {error:null});
});

module.exports = router;