const _ = require("lodash");
const express = require("express");

var router = express.Router();

router.get("/", (req, res) => {
  var locals = {
    title: 'Home'
  };
  res.render("pages/index", _.extend(locals, {error:null}));
});

module.exports = router;