'use strict';

const assert = require("assert");

function HttpError(message, code) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
  this.statusCode = code;
}

require('util').inherits(HttpError, Error);

function assert404(condition, message) {
  try {
    assert(condition, message);
  } catch (err) {
    err.statusCode = 404;
    throw err;
  }
}

function assert403(condition, message) {
  try {
    assert(condition, message);
  } catch (err) {
    err.statusCode = 403;
    throw err;
  }
}

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    req.user.notifyLastIp(req.ip);
    return next();
  }

  res.redirect('/login?referrer='+req.originalUrl);
}

function isNotLoggedIn(req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  }

  res.redirect('/profile');
}

function canTouchNovel(req, res, next) {
  isLoggedIn(req, res, () => {
    try {
      assert403(req.user.isAdmin() || req.novel.author.ref == req.user.id, "You are not authorized to manage this novel.");
      next();
    } catch (err) {
      next(err);
    }
  });
}

function canTouchComment(req, res, next) {
  isLoggedIn(req, res, () => {
    try {
      assert403(req.user.isAdmin() || req.comment.author.ref == req.user.id, "You are not authorized to manage this comment.");
      next();
    } catch (err) {
      next(err);
    }
  });
}

function isAdmin(req, res, next) {
  isLoggedIn(req, res, () => {
    try {
      assert403(req.user.isAdmin(), "You are not authorized to access this page.");
      next();
    } catch (err) {
      next(err);
    }
  });
}

function isLoggedInAndNotSocial(req, res, next) {
  isLoggedIn(req, res, () => {
    if (!req.user.isSocialAccount()) {
      return next();
    }

    res.redirect('/profile');
  });
}

module.exports = {
  isLoggedIn,
  isNotLoggedIn,
  canTouchNovel,
  canTouchComment,
  isAdmin,
  HttpError,
  assert403,
  assert404,
  isLoggedInAndNotSocial
};
