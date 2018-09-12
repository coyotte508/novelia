import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import Novel, { NovelDocument } from './novel';
import Gold, { GoldDocument } from './gold';
import * as md5 from 'md5';
import * as Sendmail from 'sendmail';
import config from '../config/general';
import * as crypto from 'crypto';
import * as assert from 'assert';
import { Types } from "mongoose";

const sendmail = Sendmail();
const Schema = mongoose.Schema;

export interface UserDocument extends mongoose.Document {
  local: {
    username: string;
    email: string;
    password: string;
  };

  google?: {
    id: string;
    token: string;
    email: string;
    name: string;
  };

  security: {
    lastIp: string;
    lastLogin: {
      ip: string;
      date: Date;
    };
    confirmed: boolean;
    confirmKey: string;
    reset: {
      key: string;
      issued: Date;
    }
  };

  bio: string;
  authority: string;
  followedNovels: Array<{title: string, ref: Types.ObjectId}>;
  gold: number;

  /* Virtuals */
  confirmed?: boolean;
  confirmKey?: string;
  displayName?: string;
  email?: string;
  isSocialAccount?: boolean;
  goldPouches?: GoldDocument[];
  link?: string;
  new?: boolean;
  novels?: NovelDocument[];
  resetKey?: string;
  isAdmin?: boolean;

  /* Methods */
  fillInSecurity(ip: string): void;
  followNovel(novel: {ref: Types.ObjectId, title: string}): Promise<void>;
  followsNovel(novel: Types.ObjectId): Promise<boolean>;
  generateResetLink(): Promise<void>;
  loadAuthoredNovels(): Promise<void>;
  loadGoldPouches(): Promise<void>;
  notifyLogin(ip: string): void;
  resetPassword(password: string): Promise<void>;
  sendConfirmationEmail(): void;
  sendResetEmail(): Promise<void>;
  unfollowNovel(novelId: Types.ObjectId): Promise<void>;
  validateResetKey(key: string): void;
  validPassword(password: string): Promise<boolean>;
}

interface User extends mongoose.Model<UserDocument> {
  generateHash(password: string): Promise<string>;

  findByEmail(email: string): Promise<UserDocument>;
  findByUrl(param: string): Promise<UserDocument>;
  /** Basic fields to be projected */
  basics(): string;
}

// define the schema for our user model
const userSchema = new Schema({
  local            : {
    username     : String,
    email        : {type: String, unique: true, sparse: true},
    password     : String
  },
  google           : {
    id           : String,
    token        : String,
    email        : {type: String, unique: true, sparse: true},
    name         : String
  },
  security: {
    lastIp       : {type: String, index: true},
    lastLogin: {
      ip       : String,
      date     : Date
    },
    confirmed    : Boolean,
    confirmKey   : String,
    reset: {
      key      : String,
      issued   : Date
    }
  },
  bio: String,
  authority: String,
  followedNovels   : [{title: String, ref: Schema.Types.ObjectId}],
  gold: {
    type: Number,
    default: 0
  }
});

userSchema.index({"local.username": "text"}, {unique: true, sparse: true});

// methods ======================
// generating a hash
userSchema.static('generateHash', (password: string) => {
  return bcrypt.hash(password, 8);
});

// checking if password is valid
userSchema.method('validPassword', function(this: UserDocument, password: string) {
  return bcrypt.compare(password, this.local.password);
});

userSchema.method('resetPassword', function(this: UserDocument, password: string) {
  return User.generateHash(password).then(hash => {
    return this.update({
      "local.password"  : hash,
      "security.reset"  : null
    });
  });
});

userSchema.method('avatar', function(this: UserDocument, size: number) {
  return `https://www.gravatar.com/avatar/${md5(this.email.toLowerCase())}?d=retro&s=${size || 250}`;
});

userSchema.method('loadAuthoredNovels', async function(this: UserDocument) {
  return this.novels = await Novel.find({"author.ref": this.id});
});

userSchema.virtual('displayName', function(this: UserDocument) {
  return this.local.username || this.google.name;
});

userSchema.virtual('email', function(this: UserDocument) {
  return this.local.email || this.google.email;
});

userSchema.method('changeEmail', async function(this: UserDocument, email: string) {

  assert(!this.isSocialAccount, "You can't change the email of a social account.");

  assert(!(await User.findByEmail(email)), "A user already exists with that email.");

  this.local.email = email;
  this.security.confirmed = false;
  this.security.confirmKey = crypto.randomBytes(16).toString('base64');

  await this.update({"local.email" : email, "security.confirmed": false, "security.confirmKey": this.security.confirmKey});
});

userSchema.virtual('link', function(this: UserDocument) {
  return "/u/" + (this.local.username || "g-" + this.google.id);
});

userSchema.method('followsNovel', function(this: UserDocument, novelId: Types.ObjectId) {
  return this.followedNovels.some(item => item.ref.equals(novelId));
});

userSchema.method('followNovel', function(this: UserDocument, item: {ref: Types.ObjectId, title: string}) {
  assert(!this.followsNovel(item.ref));

  return this.update({$push: {followedNovels: item}});
});

userSchema.method('unfollowNovel', function(this: UserDocument, ref: Types.ObjectId) {
  assert(this.followsNovel(ref));

  return this.update({$pull: {followedNovels: {ref}}});
});

userSchema.method('generateResetLink', function(this: UserDocument) {
  this.security.reset = {
    key: crypto.randomBytes(16).toString('base64'),
    issued: new Date()
  };

  return this.update({"security.reset": this.security.reset});
});

userSchema.virtual('resetKey', function(this: UserDocument) {
  return this.security.reset.key;
});

userSchema.method('validateResetKey', function(this: UserDocument, key: string) {
  if (!this.security.reset || !this.resetKey) {
    throw new Error("This user did not request a password reset.");
  }
  if (this.resetKey !== key) {
    throw new Error("The password reset link was not given for that user.");
  }
  const resetIssued = new Date(this.security.reset.issued);
  if (Date.now() - resetIssued.getTime() > 24 * 3600 * 1000) {
    throw new Error("The reset link is more than a day old, you need a new link to reset your password.");
  }
});

userSchema.method('generateConfirmKey', function(this: UserDocument) {
  this.confirmKey = crypto.randomBytes(16).toString('base64');

  return this.update({"security.confirmKey": this.security.confirmKey}).exec();
});

userSchema.virtual('confirmKey', function(this: UserDocument) {
  return this.security.confirmKey;
});

userSchema.method('confirm', function(this: UserDocument, key: string) {
  assert(!this.confirmed, "User is already confirmed.");
  assert(key && this.confirmKey === key, `Invalid confirmation key.`); // (${key},${this.confirmKey()})
  this.security.confirmed = true;
  this.security.confirmKey = null;

  return this.update({
    "security.confirmed": true,
    "security.confirmKey": null,
  }).exec();
});

userSchema.virtual('confirmed', function(this: UserDocument) {
  return this.security.confirmed;
});

userSchema.virtual('sendConfirmationEmail', function(this: UserDocument) {
  return sendmail({
    from: config.noreply,
    to: this.email,
    subject: 'Confirm your account',
    html: `<p>To finish your registration and confirm your account ${this.displayName}, click <a href='http://www.${config.domain}/confirm?key=${this.confirmKey}&user=${this.email}'>this link</a>.</p>

    <p>If you didn't create an account with us, then just ignore this email.</p>`,
  });
});

userSchema.method('sendResetEmail', function(this: UserDocument) {
  return sendmail({
    from: config.noreply,
    to: this.email,
    subject: 'Forgotten password',
    html: `<p>A password reset was requested for your account ${this.local.username}, click <a href='http://www.${config.domain}/reset?key=${this.resetKey}'>this link</a> to proceed with it.</p>

    <p>If you didn't request a password reset, then just ignore this email.</p>`,
  });
});

userSchema.method('fillInSecurity', function(this: UserDocument, ip: string) {
  Object.assign(this.security, {
    lastLogin: {
      date: new Date(),
      ip
    },
    lastIp: ip
  });

  /* No need to confirm social accounts */
  if (this.isSocialAccount) {
    this.security.confirmed = true;
  } else {
    this.security.confirmKey = crypto.randomBytes(16).toString('base64');
  }
});

userSchema.virtual('isSocialAccount', function(this: UserDocument) {
  return this.google.id ? true : false;
});

userSchema.method('notifyLogin', function(this: UserDocument, ip: string) {
  return this.update({
    "security.lastLogin.date" : Date.now(),
    "security.lastLogin.ip"   : ip,
    "security.lastIp"         : ip
  });
});

userSchema.method('notifyLastIp', function(this: UserDocument, ip: string) {
  if (this.security.lastIp !== ip) {
    this.security.lastIp = ip;
    this.update({"security.lastIp": ip}).exec();
  }
});

userSchema.virtual('isAdmin', function(this: UserDocument) {
  return this.authority === "admin";
});

userSchema.method('loadGoldPouches', async function(this: UserDocument) {
  return this.goldPouches = await Gold.find({owner: this.id});
});

userSchema.method('recalculateGold', async function(this: UserDocument) {
  if (!this.goldPouches) {
    await this.loadGoldPouches();
  }
  let totalGold = 0;
  for (const goldPouch of this.goldPouches) {
    totalGold += goldPouch.amount;
  }
  if (totalGold !== this.gold) {
    this.gold = totalGold;
    await User.update({_id: this.id}, {gold: this.gold});
  }
});

userSchema.static('findByUrl', function(this: User, id: string) {
  if (id.startsWith("g-")) {
    return this.findOne({"google.id": id.substr(2)});
  } else {
    return this.findOne({"local.username": id});
  }
});

userSchema.static('findByEmail', function(this: User, email: string) {
  return this.findOne().or([
    {'local.email': email},
    {'google.email': email}
  ]);
});

/* Basic projection */
userSchema.static('basics', function(this: UserDocument) {
  return "local.username google.name google.id";
});

// create the model for users and expose it to our app
const User = mongoose.model<UserDocument, User>('User', userSchema);

export default User;
