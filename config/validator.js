const validator = require('validator');

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

module.exports = validator;