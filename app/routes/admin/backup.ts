import { BSON } from 'bson';
import * as path from 'path';
import archiver from 'archiver-promise';
import * as fs from 'fs-extra';
import Router from 'express-promise-router';
import {Novel, Chapter, User, Image, Comment, Payment} from '../../models';
import { Model } from 'mongoose';

const router = Router();

router.get("/backup/database.zip", async (req, res) => {
  const database: {[key: string]: Model<any>} = {
      Novel,
      Chapter,
      User,
      Image,
      Comment,
      Payment
    };

  const outputDir = path.join(__dirname, "../../../", "bin", "backup", "database");
  const archivePath = path.join(outputDir, "../", "database.zip");

  await fs.mkdirp(outputDir);
  console.log("Made dir", outputDir);

  const archive = archiver(archivePath, {store: true});

  for (const coll of Object.keys(database)) {
    const bson = new BSON();
    const data = await database[coll].find({});
    const filename = coll + ".bson";
    const filepath = path.join(outputDir, filename);

    await fs.writeFile(filepath, bson.serialize(data));

    archive.file(filepath, {name: filename});
  }

  await archive.finalize(archivePath);

  res.sendFile(archivePath);
});

export default router;
