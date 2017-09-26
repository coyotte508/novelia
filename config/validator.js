const XRegExp = require("xregexp");
const validator = require('validator');
const marked = require('marked');
const toMarkdown = require('to-markdown');
const assert = require('assert');
const cs = require('constants');

// const createDOMPurify = require('dompurify');
// const jsdom = require('jsdom');
// const window = jsdom.jsdom('', {
//   features: {
//     FetchExternalResources: false, // disables resource loading over HTTP / filesystem
//     ProcessExternalResources: false // do not execute JS within script blocks
//   }
// }).defaultView;

// const DOMPurify = createDOMPurify(window);
// validator.purify = (dirty) => {
//   return DOMPurify.sanitize(dirty);
// }

marked.setOptions({sanitize: true, breaks: true});

validator.textToDb = (text) => {
  return marked(text.trim());
};

validator.easyTextToDb = (text) => {
  return validator.escape(text.trim());
};

validator.dbToText = (html) => {
  //below replace is for align in tables to be properly conveyed
  return toMarkdown((html||"").replace(/style="text-align:([^"]*)"/g, 'align="$1"'), {gfm: true});
};

validator.validateUser = (username) => {
  if (!validator.isAlphanumeric(username)) {
    throw new Error("Invalid username.");
  }
  if (!validator.isLength(username, {min: 4, max: 20})) {
    throw new Error("Username must be betwween 4 and 20 characters.");
  }
  return username;
};

validator.validateEmail = (email) => {
  if (!validator.isEmail(email)) {
    throw new Error("Invalid email address.");
  }
  if (!validator.isLength(email, {max: 50})) {
    throw new Error("Email must be less than 50 characters.");
  }
  return validator.normalizeEmail(email);
};

validator.validatePassword = (password) => {
  if (!validator.isLength(password, {min: 5, max: 50})) {
    throw new Error("Password must be between 5 and 50 characters.");
  }
  return password;
}

// validator.sanitize = (text) => {
//   return text.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
// }

validator.latinSentenceChar = XRegExp("[\\p{Latin} 0-9 .,!:?'-]+");
validator.latinSentence = XRegExp("^[\\p{Latin} 0-9 .,!:?'-]+$");

validator.validateLatinSentence = (text) => {
  if (!validator.latinSentence.test(text)) {
    throw new Error("Invalid special characters: " + text.replace(validator.latinSentenceChar, ""));
  }
  return text;
}

validator.validateLength = (text, desc, opt) => {
  if (!validator.isLength(text, opt)) {
    throw new Error(`The ${desc} must be more than ${opt.min || 0} and less than ${opt.max} characters`);
  }
}

validator.validateTitle = (text) => {
  validator.validateLength(text, "title", {min: 1, max: cs.titleMaxLength});
  return validator.validateLatinSentence(text);
}

validator.validateDescription = (text) => {
  validator.validateLength(text, "description", {min: 0, max: cs.descriptionMaxLength});
  return validator.textToDb(text);
}

validator.validateChapter = (text) => {
  validator.validateLength("chapter", {min: 1, max: cs.chapterMaxLength});
  return validator.textToDb(text);
}

validator.validateComment = (text) => {
  validator.validateLength("comment", {min: 1, max: cs.commentMaxLength});
  return validator.easyTextToDb(text);
}

validator.validateCategories = (cats, list) => {
  var cat1 = cats[0], cat2 = cats[1];
  cat1 = list.find(x => x.shorthand == cat1);
  if (!cat1) {
    throw new Error("Invalid category");
  }
  cat2 = list.find(x => x.shorthand == cat2);

  assert(cat1 != cat2, "Can't use identical categories");

  return cat2 ? [cat1, cat2] : [cat1];
}

module.exports = validator;
