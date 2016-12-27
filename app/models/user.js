// load the things we need
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

// define the schema for our user model
var userSchema = mongoose.Schema({
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
    } 
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

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
