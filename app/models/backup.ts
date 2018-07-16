import { BSON } from 'bson';
import fs from 'fs-extra';
import * as assert from 'assert';
import {Novel, Chapter, User, Image, Comment, Payment} from './';

async function restore() {
  console.log("Restoring from backup...");
  assert(await fs.exists("/tmp/novelia/User.bson"), "File /tmp/novelia/Users.bson is not there. Extract backup in /tmp/novelia");

  const database = {
    Novel,
    Chapter,
    User,
    Image,
    Comment,
    Payment
  };

  for (const key of Object.keys(database)) {
    if (await fs.exists(`/tmp/novelia/${key}.bson`)) {
      const contents = await fs.readFile(`/tmp/novelia/${key}.bson`);

      const bson = new BSON();
      const documents = bson.deserialize(contents);

      console.log(`${Object.keys(documents).length} records for ${key}`);

      for (const docId of documents) {
        const document = documents[docId];

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

export {
  restore
};
