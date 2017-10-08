module.exports = {
  Novel: require("./novel"),
  Chapter: require("./chapter"),
  User: require("./user"),
  Image: require('./image'),
  Comment: require('./comment'),
  Payment: require('./payment'),
  Gold: require('./gold'),
  categories: require('./category').list()
};
