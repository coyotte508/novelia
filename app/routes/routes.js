const express = require("express");
const Chapter = require("../models/chapter");
const slug = require("slug");

var router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const latest = await Chapter.latestUpdates();
    res.render("pages/index", {error:null, latest, req, slug});
  } catch(err) {
    next(err);
  }
});

router.get("/contact", (req, res) => {
  res.render("pages/contact", {error:null, req});
});

/* Aggregate routers */
[require("./admin.js"), require("./auth.js"), require("./user.js"), require("./novel.js")].forEach((mod) => router.use("/", mod));

router.use(function errorHandler (err, req, res, next) {
  console.log(err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.statusCode || 500);
  res.render('pages/'+res.statusCode, { req, err });
});

module.exports = router;