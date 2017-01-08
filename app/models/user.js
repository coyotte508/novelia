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
        password     : String,
        resetKey     : String, 
        resetIssued  : Date
    },
    google           : {
        id           : String,
        token        : String,
        email        : {type: String, unique: true, sparse: true},
        name         : String
    },
    lastLogin: {
        ip           : String,
        date         : Date
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
    this.local.resetKey  = sha1(this.local.username + '/' + mongoose.Types.ObjectId());

    return this.update({
        "local.resetIssued" : Date.now(),
        "local.resetKey"    : this.local.resetKey
    });
}

userSchema.methods.resetKey = function() {
    return this.local.resetKey;
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
