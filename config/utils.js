const assert = require("assert");

assert404 = (res, condition, message) => {
  try {
    assert(condition, message);
  } catch (err) {
    res.status(404);
    throw err;
  }
}

module.exports = {}