const express = require("express");

var router = express.Router();

router.get("/", (req, res) => {
  res.render("index", {error:null});
});

module.exports = router;