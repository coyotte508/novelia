const validator = require('validator');
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const Schema = mongoose.Schema;

// define the schema for our user model
var userSchema = new Schema({
    local            : {
        username     : String,
        email        : {type: String, unique: true, sparse: true},
        password     : String,
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
    novels           : [{title: String, ref: Schema.Types.ObjectId, slug: String}]
});

userSchema.index({"local.username": "text"}, {unique: true, sparse: true});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

userSchema.methods.displayName = function() {
    return this.local.username || this.google.name;
};

userSchema.methods.getLink = function() {
    return "/u/" + (this.local.username || "g-"+ this.google.id);
};

var User = mongoose.model('User', userSchema);

User.findByUrl = function(id) {
    if (id.startsWith("g-")) {
        return User.findOne({"google.id": id.substr(2)});
    } else {
        return User.findOne({"local.username": id});
    }
}

// create the model for users and expose it to our app
module.exports = User;
