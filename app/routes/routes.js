const express = require("express");

var router = express.Router();

router.get("/", (req, res) => {
  res.render("pages/index", {error:null, req});
});

/* Aggregate routers */
[require("./auth.js"), require("./novel.js"), require("./user.js")].forEach((mod) => router.use("/", mod));

module.exports = router;