module.exports = {
  Novel: require("./novel"),
  Chapter: require("./chapter"),
  User: require("./user"),
  Image: require('./image'),
  categories: require('./category').list()
};
