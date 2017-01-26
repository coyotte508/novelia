const validator = require('validator');
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');
const sha1     = require('sha1');
const sendmail = require('sendmail')();
const config = require('../../config/general');
const assert = require('assert');
const locks = require('mongo-locks');
const co = require("co");

const Schema = mongoose.Schema;

// define the schema for our user model
var userSchema = new Schema({
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
    authority: String,
    novels           : [{title: String, ref: Schema.Types.ObjectId}],
    likedNovels      : [{title: String, ref: Schema.Types.ObjectId}],
    followedNovels   : [{title: String, ref: Schema.Types.ObjectId}]
});

userSchema.index({"local.username": "text"}, {unique: true, sparse: true});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hash(password, 8);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compare(password, this.local.password);
};

userSchema.methods.resetPassword = function(password) {
    return this.generateHash(password).then((hash) => {
        return this.update({
            "local.password"  : hash,
            "security.reset"  : null
        });
    });
}

userSchema.methods.displayName = function() {
    return this.local.username || this.google.name;
};

userSchema.methods.email = function () {
    return this.local.email || this.google.email;
};

userSchema.methods.changeEmail = function(email) {
    var self = this;
    return co(function*() {
        assert(!self.isSocialAccount(), "You can't change the email of a social account.");

        assert(!(yield User.findByEmail(email)), "A user already exists with that email.");

        self.local.email = email;
        self.security.confirmed = false;
        self.security.confirmKey = sha1(self.displayName() + '/confirm/' + mongoose.Types.ObjectId());

        yield self.update({"local.email" : email, "security.confirmed": false, "security.confirmKey": self.security.confirmKey});
    });
}

userSchema.methods.getLink = function() {
    return "/u/" + (this.local.username || "g-"+ this.google.id);
};

userSchema.methods.isLikeNovel = function(novelid) {
    return this.likedNovels.some(item => item.ref == novelid);
}

userSchema.methods.likeNovel = function(item) {
    assert(!this.isLikeNovel(item.ref));

    return this.update({$push: {likedNovels: item}});
}

userSchema.methods.unlikeNovel = function(ref) {
    assert(this.isLikeNovel(ref));

    return this.update({$pull: {likedNovels: {ref}}});
}

userSchema.methods.isFollowNovel = function(novelid) {
    return this.followedNovels.some(item => item.ref == novelid);
}

userSchema.methods.followNovel = function(item) {
    assert(!this.isFollowNovel(item.ref));

    return this.update({$push: {followedNovels: item}});
}

userSchema.methods.unfollowNovel = function(ref) {
    assert(this.isFollowNovel(ref));

    return this.update({$pull: {followedNovels: {ref}}});
}

userSchema.methods.generateResetLink = function() {
    this.security.reset = {
        key: sha1(this.local.username + '/' + mongoose.Types.ObjectId()),
        issued: Date.now()
    };

    return this.update({"security.reset": this.security.reset});
}

userSchema.methods.resetKey = function() {
    return this.security.reset.key;
}

userSchema.methods.validateResetKey = function(key) {
    if (!this.security.reset || !this.security.reset.key) {
        throw new Error("This user did not request a password reset.");
    }
    if (this.security.reset.key != key) {
        throw new Error("The password reset link was not given for that user.");
    }
    var resetIssued = new Date(this.security.reset.issued);
    if (Date.now() - resetIssued.getTime() > 24*3600*1000) {
        throw new Error("The reset link is more than a day old, you need a new link to reset your password.");
    }
}

userSchema.methods.generateConfirmKey = function() {
    this.security.confirmKey = sha1(this.displayName() + '/confirm/' + mongoose.Types.ObjectId());

    return this.update({"security.confirmKey": this.security.confirmKey}).exec();
}

userSchema.methods.confirmKey = function() {
    return this.security.confirmKey;
}

userSchema.methods.confirm = function(key) {
    assert(!this.confirmed(), "User is already confirmed.");
    assert(key && this.confirmKey() == key, `Invalid confirmation key.`); //(${key},${this.confirmKey()})
    this.security.confirmed = true;
    this.security.confirmKey = null;

    return this.update({
        "security.confirmed": true,
        "security.confirmKey": null,
    }).exec();
}

userSchema.methods.confirmed = function() {
    return this.security.confirmed;
}

userSchema.methods.sendConfirmationEmail = function() {
    return sendmail({
      from: config.noreply,
      to: this.email(),
      subject: 'Confirm your account',
      html: `<p>To finish your registration and confirm your account ${this.displayName()}, click <a href='http://www.${config.domain}/confirm?key=${this.confirmKey()}&user=${this.email()}'>this link</a>.</p>

<p>If you didn't create an account with us, then just ignore this email.</p>`,
    });
}

userSchema.methods.fillInSecurity = function(ip) {
    this.security = {
        lastLogin: {
            date: Date.now(),
            ip
        },
        lastIp: ip
    };

    /* No need to confirm social accounts */
    if (this.isSocialAccount()) {
        this.security.confirmed = true;
    } else {
        this.security.confirmKey = sha1(this.displayName() + '/confirm/' + mongoose.Types.ObjectId());
    }
}

userSchema.methods.isSocialAccount = function() {
    return this.google.id ? true : false;
}

userSchema.methods.notifyLogin = function(ip) {
    return this.update({
        "security.lastLogin.date" : Date.now(),
        "security.lastLogin.ip"   : ip,
        "security.lastIp"         : ip
    });
}

userSchema.methods.notifyLastIp = function(ip) {
    if (this.security.lastIp != ip) {
        this.security.lastIp = ip;
        this.update({"security.lastIp": ip}).exec();
    }
}

userSchema.methods.isAdmin = function() {
    return this.authority == "admin";
}

var User = mongoose.model('User', userSchema);

User.findByUrl = function(id) {
    if (id.startsWith("g-")) {
        return User.findOne({"google.id": id.substr(2)});
    } else {
        return User.findOne({"local.username": id});
    }
}

User.findByEmail = function(email) {
    return User.findOne().or([
        {'local.email': email},
        {'google.email': email}
    ]);
}

/* Basic projection */
User.basics = function() {
    return "local.username google.name google.id";
}

// create the model for users and expose it to our app
module.exports = User;
