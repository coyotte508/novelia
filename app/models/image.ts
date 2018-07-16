import * as assert from 'assert';
import * as fs from 'fs-extra';
import * as jimp from 'jimp';
import * as path from 'path';
import * as mongoose from 'mongoose';
import { Types } from 'mongoose';
const Schema = mongoose.Schema;

interface ImageParams {
  name: string;
  ext: string;
  type: string;
  source: Types.ObjectId;
  buffer: Buffer;
}

interface ImageDocument extends mongoose.Document {
  location: string;
  what: string;
  source: Types.ObjectId;
  formats: Array<{format: string, location: string}>;

  delete(): Promise<void>;
  getLink(): string;
}

interface Image extends mongoose.Model<ImageDocument> {
  createFromData(params: ImageParams): Promise<ImageDocument>;
  createOrUpdate(params: ImageParams, old?: Types.ObjectId): Promise<ImageDocument>;
}

const imageSchema = new Schema({
  location: String,
  what: String,
  source: Schema.Types.ObjectId,
  formats: [{format: String, location: String}]
});

imageSchema.method('delete', async function(this: ImageDocument) {
  if (await fs.pathExists(this.location)) {
    await fs.remove(this.location);
  }

  for (const item of this.formats) {
    if (await fs.pathExists(item.location)) {
      await fs.remove(item.location);
    }
  }

  return this.remove();
});

imageSchema.method('getLink', function(this: ImageDocument) {
  return this.location.substr(this.location.indexOf("/images"));
});

imageSchema.static('createFromData', async function(this: Image, params: ImageParams) {
  const ext = params.ext.toLowerCase();
  assert([".jpg", ".jpeg", ".png"].includes(ext), "Unsupported image format: " + ext);

  const image = new this();
  image.what = params.type;
  image.source = params.source;
  const root = `./public/images/${params.type}`;
  await fs.mkdirp(root);

  const fullname = params.name + ext;


  const localPath = path.join(root, fullname);

  image.location = localPath;
  const str = await fs.createWriteStream(localPath);
  await str.write(params.buffer);

  const jimage = await jimp.read(params.buffer);

  if (params.type === "novel") {
    const smallName = `${params.name}-200x300${ext}`;
    const smallPath = path.join(root, smallName);
    await jimage.cover(200, 300);
    if (ext.includes("jp")) {
      await jimage.quality(85);
    }
    await jimage.write(smallPath);
    image.formats.push({format: "200x300", location: smallPath});
  }

  await image.save();
  return image;
});

imageSchema.static('createOrUpdate', async function(this: Image, params: ImageParams, old?: Types.ObjectId) {
  if (old) {
    try {
      const image = await this.findById(old);
      await image.delete();
    } catch (err) {
      console.error(err);
    }
  }

  return await this.createFromData(params);
});

export default mongoose.model<ImageDocument, Image>('Image', imageSchema);
