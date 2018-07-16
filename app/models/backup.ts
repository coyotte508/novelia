import { BSON } from 'bson';
import * as fs from 'fs-extra';
import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import {Novel, Chapter, User, Image, Comment, Payment} from './';

async function restore() {
  console.log("Restoring from backup...");
  assert(await fs.pathExists(path.join(os.tmpdir(), `novelia/User.bson`)), `File ${os.tmpdir()}/Users.bson is not there. Extract backup in ${os.tmpdir()}`);

  const database = {
    Novel,
    Chapter,
    User,
    Image,
    Comment,
    Payment
  };

  for (const key of Object.keys(database)) {
    const filePath = path.join(os.tmpdir(), `novelia/${key}.bson`);
    if (await fs.pathExists(filePath)) {
      const contents = await fs.readFile(filePath);

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
