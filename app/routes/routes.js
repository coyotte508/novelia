const express = require("express");
const Chapter = require("../models/chapter");

var router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const latest = await Chapter.latestUpdates();
    console.log(latest);
    res.render("pages/index", {error:null, latest, req});
  } catch(err) {
    next(err);
  }
});

router.get("/contact", (req, res) => {
  res.render("pages/static/contact", {error:null, req});
});

/* Aggregate routers */
for (let mod of [require("./admin.js"), require("./auth.js"), require("./user.js"), require("./category.js"), require("./novel.js")]) {
  router.use("/", mod);
}

router.use(function errorHandler (err, req, res, next) {
  console.log(err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.statusCode || 500);
  res.render('pages/technical/'+res.statusCode, { req, err });
});

module.exports = router;