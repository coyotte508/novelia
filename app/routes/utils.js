'use strict';

const assert = require("assert");

function HttpError(message, code) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
  this.statusCode = code;
};

require('util').inherits(HttpError, Error);

const assert404 = (condition, message) => {
  try {
    assert(condition, message);
  } catch (err) {
    err.statusCode = 404;
    throw err;
  }
}

const assert403 = (condition, message) => {
  try {
    assert(condition, message);
  } catch (err) {
    err.statusCode = 403;
    throw err;
  }
}

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/login?referrer='+req.url);
}

module.exports = {
  isLoggedIn,
  HttpError, 
  assert403, 
  assert404
};