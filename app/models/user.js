const validator = require('validator');
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');
const sha1     = require('sha1');
const assert = require('assert');

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

userSchema.methods.fillInSecurity = function(ip) {
    this.security = {
        lastLogin: {
            date: Date.now(),
            ip
        },
        lastIp: ip
    };
}

userSchema.methods.notifyLogin = function(ip) {
    return this.update({
        "security.lastLogin.date" : Date.now(),
        "security.lastLogin.ip"   : ip,
        "security.lastIp"         : ip
    });
}

var User = mongoose.model('User', userSchema);

User.findByUrl = function(id) {
    if (id.startsWith("g-")) {
        return User.findOne({"google.id": id.substr(2)});
    } else {
        return User.findOne({"local.username": id});
    }
}

/* Basic projection */
User.basics = function() {
    return "local.username google.name google.id";
}

// create the model for users and expose it to our app
module.exports = User;
