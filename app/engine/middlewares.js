const pjson = require('../../package.json');
const cs = require('../../config/constants');

function reqStuff(req, res, next) {
  /* For css cache busting */
  req.version = pjson.version;
  req.cs = cs;

  req.makeDescription = descr => {
    descr = descr.replace(/(<([^>]+)>)/g, "") ||"";
    var index = descr.indexOf(" ", 150);
    return descr.substr(0, index == -1 ? undefined : index);
  };

  req.unixTime = function(date) {
    return parseInt(date.substring(0, 8), 16);
  };

  req.timeSince = function(date) {
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

  next();
}

module.exports = [reqStuff];