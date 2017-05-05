const pjson = require('../../package.json');
const constants = require('../../config/constants');
const validator = require('validator');

function sysStuff(req, res, next) {
  var sys = {};
  sys.makeDescription = descr => {
    descr = descr.replace(/(<([^>]+)>)/g, "") ||"";
    var index = descr.indexOf(" ", 150);
    return descr.substr(0, index == -1 ? undefined : index);
  };

  sys.unixTime = function(date) {
    return parseInt(date.substring(0, 8), 16);
  };

  sys.timeSince = function(date) {
    var seconds = Math.floor((Date.now()/ 1000 - this.unixTime(date)));
    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
      return interval + " years";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
      return interval + " months";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
      return interval + " days";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
      return interval + " hours";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
      return interval + " minutes";
    }
    return Math.floor(seconds) + " seconds";
  };

  res.locals.sys = sys;

  next();
}

function defaultLocals (req, res, next) {
  try {
    // res.locals.error = req.flash('error');
    // res.locals.success = req.flash('success');

    res.locals.user = req.user || null;
    /* For css cache busting */
    res.locals.version = pjson.version;
    /* Constants */
    res.locals.constants = constants;
    /* Db to text, etc. */
    res.locals.validator = validator; 

    //undefined varialbles errors go away
    res.locals.novel = null;
    res.locals.message = "";

    next();
  } catch(err) {
    next(err);
  }
}

module.exports = [sysStuff, defaultLocals];