module.exports = {
  Novel: require("./novel"),
  Chapter: require("./chapter"),
  User: require("./user"),
  Image: require('./image'),
  Comment: require('./comment'),
  categories: require('./category').list()
};
