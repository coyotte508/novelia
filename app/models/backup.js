const BSON = require("bson");
const fs = require("fs-extra");
const assert = require("assert");
const {Novel, Chapter, User, Image, Comment, Payment} = require("./");

async function restore() {
  console.log("Restoring from backup...");
  assert(await fs.exists("/tmp/novelia/User.bson"), "File /tmp/novelia/Users.bson is not there. Extract backup in /tmp/novelia");

  const database =
    {
      Novel,
      Chapter,
      User,
      Image,
      Comment,
      Payment
    };

  for (let key in database) {
    if (await fs.exists(`/tmp/novelia/${key}.bson`)) {
      let contents = await fs.readFile(`/tmp/novelia/${key}.bson`);

      let bson = new BSON();
      let documents = bson.deserialize(contents);

      console.log(`${Object.keys(documents).length} records for ${key}`);

      for (let docId in documents) {
        let document = documents[docId];

        /* Sadly, using upsert below seems to cause an error when the item is new. So 7 lines instead of 1 */
        let model = await database[key].findById(document._id);
        if (model) {
          Object.assign(model, document);
        } else {
          model = new database[key](document);
        }
        await model.save();
      }
    }
  }
}

module.exports = {
  restore
};
