// load the things we need
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const Schema = mongoose.Schema;

// define the schema for our user model
var userSchema = new Schema({
    local            : {
        username     : String,
        email        : {type: String, index: true},
        password     : String,
    },
    google           : {
        id           : String,
        token        : String,
        email        : {type: String, index: true},
        name         : String
    },
    lastLogin: {
        ip           : String,
        date         : Date
    },
    novels           : [{title: String, id: Schema.Types.ObjectId, slug: String}]
});

userSchema.index({"local.username": "text"});

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

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
