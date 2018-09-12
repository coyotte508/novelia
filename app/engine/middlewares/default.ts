// tslint:disable-next-line no-var-requires
const pjson = require('../../../package.json');
import constants from '../../config/constants';
import * as validator from 'validator';
import * as slug from 'slug';
import { Response } from '../../types';

function sysStuff(req, res: Response, next) {
  const sys = {
    makeDescription(descr: string) {
      descr = descr.replace(/(<([^>]+)>)/g, "") || "";
      const index = descr.indexOf(" ", 150);
      return descr.substr(0, index === -1 ? undefined : index);
    },

    unixTime(date: string) {
      return parseInt(date.substring(0, 8), 16);
    },

    dayOfYear(id: string) {
      const date = new Date(parseInt(id.substring(0, 8), 16) * 1000);
      const options = {year: "numeric", month: "long", day: "numeric"};
      return new Intl.DateTimeFormat("en-US", options).format(date);
    },

    timeSince(date: string) {
      const seconds = Math.floor((Date.now() / 1000 - this.unixTime(date)));
      let interval = Math.floor(seconds / 31536000);

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
    }
  };

  res.locals.sys = sys;

  next();
}

function defaultLocals(req: Express.Request, res: Express.Response, next) {
  try {
    // res.locals.error = req.flash('error');
    // res.locals.success = req.flash('success');

    res.locals.req = req;
    res.locals.user = req.user || null;
    /* For css cache busting */
    res.locals.version = pjson.version;
    /* Constants */
    res.locals.constants = constants;
    /* Db to text, etc. */
    res.locals.validator = validator;
    /* Make links */
    res.locals.slug = slug;

    // undefined varialbles errors go away
    res.locals.novel = null;
    res.locals.message = "";
    // addchapter.ejs
    res.locals.chapter = null;

    next();
  } catch (err) {
    next(err);
  }
}

const middlewares = [defaultLocals, sysStuff];

export {
  middlewares,
  defaultLocals,
  sysStuff
};
