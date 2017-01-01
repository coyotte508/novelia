const XRegExp = require("xregexp");
const validator = require('validator');
const marked = require('marked');
const toMarkdown = require('to-markdown');

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

marked.setOptions({sanitize: true});

validator.textToDb = (text) => {
  return marked(text.trim());
};

validator.dbToText = (html) => {
  return toMarkdown(html);
};

validator.validateUser = (username) => {
  if (!validator.isAlphanumeric(username)) {
    throw new Error("Invalid username.");
  }
  if (!validator.isLength(username, {min: 4, max: 16})) {
    throw new Error("Username must be betwween 4 and 16 characters.");
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

validator.latinSentenceChar = XRegExp("[\\p{Latin} 0-9 .,!:?]+");
validator.latinSentence = XRegExp("^[\\p{Latin} 0-9 .,!:?]+$");

validator.validateLatinSentence = (text) => {
  if (!validator.latinSentence.test(text)) {
    throw new Error("Invalid special characters: " + text.replace(validator.latinSentenceChar, ""));
  }
  return text;
}

validator.validateTitle = (text) => {
  if (!validator.isLength(text, {min: 1, max: 80})) {
    throw new Error("The title must be less than 80 characters.");
  }
  return validator.validateLatinSentence(text);
}

validator.validateDescription = (text) => {
  if (!validator.isLength(text, {min: 0, max: 2000})) {
    throw new Error("The description must be less than 2000 characters.");
  }
  return validator.textToDb(text);
}

validator.validateChapter = (text) => {
  if (!validator.isLength(text, {min: 0, max: 50000})) {
    throw new Error("The content of the chapter must be less than 2000 characters.");
  }
  return validator.textToDb(text);
}

module.exports = validator;