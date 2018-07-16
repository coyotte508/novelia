import multer from 'multer';
import * as fs from 'fs-extra';
import * as unzip from 'unzipper';
import {Novel, Chapter, User, Image, Comment, Payment} from "../../models";
import {restore} from '../../models/backup';
import Router from 'express-promise-router';

const router = Router();

const upload = multer({ dest: "/tmp/novelia" });

router.post("/load/database", upload.single("archive"), async (req, res) => {
  const database = {
      Novel,
      Chapter,
      User,
      Image,
      Comment,
      Payment
    };

  console.log(req.file);

  const filePath = req.file.path;

  /* Remove old files before extraction */
  for (const key of Object.keys(database)) {
    await fs.remove(`/tmp/novelia/${key}.bson`);
  }

  const extracter = unzip.Extract({ path: '/tmp/novelia' });

  const extractProcess = new Promise((resolve, reject) => {
    fs.createReadStream(filePath).pipe(extracter);

    extracter.on("close", resolve);
    extracter.on("error", reject);
  });

  await extractProcess;
  await restore();

  req.flash("success", "Reloaded from database!");
  res.redirect("back");
});

export default router;
