import '../config/db';
import * as assert from 'assert';
import jimp = require('jimp');
import * as mongoose from 'mongoose';
import * as _ from 'lodash';
import { Types, mongo } from 'mongoose';
import { ObjectId } from 'bson';
import { GridFSBucketReadStream, GridFSBucket } from '../../node_modules/@types/mongodb';
const Schema = mongoose.Schema;

let bucket: GridFSBucket = null;

mongoose.connection.on("open", () => {
  bucket = new mongo.GridFSBucket(mongoose.connection.db, {bucketName: 'files'});
});

export interface ImageParams {
  name: string;
  ext: ".png" | ".jpg" | ".jpeg";
  type: string;
  source: Types.ObjectId;
  buffer: Buffer;
}

export interface ImageDocument extends mongoose.Document {
  source: Types.ObjectId;
  type: string;
  name: string;
  ext: ".png" | ".jpg" | ".jpeg";
  formats: Array<{format: string, filename: string, _id: Types.ObjectId}>;

  delete(): Promise<void>;
  getLink(): string;
}

interface Image extends mongoose.Model<ImageDocument> {
  downloadStream(type: string, filename: string): Promise<GridFSBucketReadStream>;
  createFromData(params: ImageParams): Promise<ImageDocument>;
  createOrUpdate(params: ImageParams, old?: Types.ObjectId): Promise<ImageDocument>;
}

const imageSchema = new Schema({
  source: Schema.Types.ObjectId,
  type: String,
  name: String,
  ext: {
    type: String,
    enum: [".png", ".jpg", ".jpeg"]
  },
  formats: [{
    filename: String,
    format: String,
    _id: Schema.Types.ObjectId
  }]
});

imageSchema.index({'type': 1, 'formats.filename': 1}, {unique: true});

imageSchema.method('delete', async function(this: ImageDocument) {
  for (const item of this.formats) {
    bucket.delete(item._id);
  }

  await this.remove();
});

imageSchema.method('getLink', function(this: ImageDocument) {
  return `/images/${this.type}/${this.name}${this.ext}`;
});

imageSchema.static('createFromData', async function(this: Image, params: ImageParams) {
  const ext = params.ext.toLowerCase() as ".png" | ".jpeg" | ".jpg";
  assert([".jpg", ".jpeg", ".png"].includes(ext), "Unsupported image format: " + ext);

  const image = new this();
  image.type = params.type;
  image.source = params.source;
  image.ext = ext;
  image.name = params.name;

  let filename = `${image.name}${image.ext}`;
  let stream = bucket.openUploadStream(filename, {metadata: Object.assign(_.omit(params, "buffer"), {format: "original"})});
  stream.end(params.buffer);
  image.formats.push({_id: new ObjectId(stream.id as string), format: "original", filename});
  const jimage = await jimp.read(params.buffer);

  if (params.type === "novel") {
    await jimage.cover(200, 300);
    if (ext.includes("jp")) {
      await jimage.quality(85);
    }

    filename = `${image.name}-200x300${image.ext}`;
    stream = bucket.openUploadStream(filename, {metadata: Object.assign(_.omit(params, "buffer"), {format: "200x300"})});
    stream.end(await jimage.getBufferAsync(jimage.getMIME()));
    image.formats.push({_id: new ObjectId(stream.id as string), format: "200x300", filename});
  }

  await image.save();
  return image;
});

imageSchema.static('downloadStream', async function(this: Image, type: string, filename: string) {
  const image = await this.findOne({type, 'formats.filename': filename});

  if (!image) {
    return null;
  }

  return bucket.openDownloadStream(image.formats.find(format => format.filename === filename)._id);
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
