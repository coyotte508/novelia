const express = require("express");

var router = express.Router();

router.get("/", (req, res) => {
  res.render("pages/index", {error:null, req});
});

router.get("/contact", (req, res) => {
  res.render("pages/contact", {error:null, req});
});

/* Aggregate routers */
[require("./auth.js"), require("./user.js"), require("./novel.js"), require("./chapter.js")].forEach((mod) => router.use("/", mod));

router.use(function errorHandler (err, req, res, next) {
  console.log(err);
  if (res.headersSent) {
    return next(err)
  }
  res.status(err.statusCode || 500);
  res.render('pages/'+res.statusCode, { req, err })
});

module.exports = router;