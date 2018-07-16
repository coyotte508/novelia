import * as XRegExp from 'xregexp';
import * as validator from 'validator';
import * as marked from 'marked';
import * as toMarkdown from 'to-markdown';
import * as assert from 'assert';
import * as _ from 'lodash';
import cs from './constants';
import { CategoryDocument } from '../models/category';

// import createDOMPurify from 'dompurify';
// import jsdom from 'jsdom';
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

export default _.assign(validator, {
  textToDb(text: string) {
    return marked(text.trim());
  },

  easyTextToDb(text: string) {
    return validator.escape(text.trim());
  },

  dbToText(html: string) {
    // below replace is for align in tables to be properly conveyed
    return toMarkdown((html || "").replace(/style="text-align:([^"]*)"/g, 'align="$1"'), {gfm: true});
  },

  validateUser(username: string) {
    if (!validator.isAlphanumeric(username)) {
      throw new Error("Invalid username.");
    }
    if (!validator.isLength(username, {min: 4, max: 20})) {
      throw new Error("Username must be betwween 4 and 20 characters.");
    }
    return username;
  },

  validateEmail(email: string) {
    if (!validator.isEmail(email)) {
      throw new Error("Invalid email address.");
    }
    if (!validator.isLength(email, {max: 50})) {
      throw new Error("Email must be less than 50 characters.");
    }
    // return validator.normalizeEmail(email, {gmail_remove_dots: false, gmail_remove_subaddress: false});
    return email.toLowerCase();
  },

  validatePassword(password) {
    if (!validator.isLength(password, {min: 5, max: 50})) {
      throw new Error("Password must be between 5 and 50 characters.");
    }
    return password;
  },

  latinSentenceChar: XRegExp("[\\p{Latin} 0-9 .,!:?'-]+"),
  latinSentence: XRegExp("^[\\p{Latin} 0-9 .,!:?'-]+$"),

  validateLatinSentence(text: string) {
    if (!this.latinSentence.test(text)) {
      throw new Error("Invalid special characters: " + text.replace(this.latinSentenceChar, ""));
    }
    return text;
  },

  validateLength(text, desc, opt) {
    if (!validator.isLength(text, opt)) {
      throw new Error(`The ${desc} must be more than ${opt.min || 0} and less than ${opt.max} characters`);
    }
  },

  validateTitle(text) {
    this.validateLength(text, "title", {min: 1, max: cs.titleMaxLength});
    return this.validateLatinSentence(text);
  },

  validateDescription(text) {
    this.validateLength(text, "description", {min: 0, max: cs.descriptionMaxLength});
    return this.textToDb(text);
  },

  validateChapter(text) {
    this.validateLength(text, "chapter", {min: 1, max: cs.chapterMaxLength});
    return this.textToDb(text);
  },

  validateComment(text) {
    console.log(text);
    this.validateLength(text, "comment", {min: 1, max: cs.commentMaxLength});
    return this.easyTextToDb(text);
  },

  validateCategories(cats: [string, string], list: CategoryDocument[]) {
    const [cat1Id, cat2Id] = cats;
    const cat1 = list.find(x => x.shorthand === cat1Id);
    if (!cat1) {
      throw new Error("Invalid category");
    }
    const cat2 = list.find(x => x.shorthand === cat2Id);

    assert(cat1 !== cat2, "Can't use identical categories");

    return cat2 ? [cat1, cat2] : [cat1];
  }
});

