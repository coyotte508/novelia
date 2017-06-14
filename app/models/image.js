const assert = require("assert");
const fs = require("fs-extra");
const jimp = require("jimp");
const mkdirp = require("mkdirp");
const path = require("path");
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// define the schema for our user model
var imageSchema = new Schema({
  location: String,
  what: String,
  source: Schema.Types.ObjectId,
  formats: [{format: String, location: String}]
});

imageSchema.methods.delete = async function() {
  if (await fs.exists(this.location)) {
    await fs.rm(this.location);
  }

  for (let item of this.formats) {
    if (await fs.exists(item.location)) {
      await fs.rm(item.location);
    }
  }

  return this.remove();
};

imageSchema.methods.getLink = function() {
  return this.location.substr(this.location.indexOf("/images"));
};

let Image = mongoose.model('Image', imageSchema);

Image.create = async function(params) {
  let ext = params.ext.toLowerCase();
  assert([".jpg",".jpeg",".png"].includes(ext), "Unsupported image format: " + ext);

  let image = new Image();
  image.what = params.type;
  image.source = params.source;
  let root = `./public/images/${params.type}`;
  await mkdirp(root);

  let fullname = params.name + ext;


  let localPath = path.join(root, fullname);

  image.location = localPath;
  let str = await fs.createWriteStream(localPath);
  await str.write(params.buffer);

  let jimage = await jimp.read(params.buffer);

  if (params.type == "novel") {
    let smallName = `${params.name}-200x300${ext}`;
    let smallPath = path.join(root, smallName);
    await jimage.cover(200, 300);
    if (ext.includes("jp")) {
      await jimage.quality(85);
    }
    await jimage.write(smallPath);
    image.formats.push({format: "200x300", location: smallPath});
  }

  await image.save();
  return image;
};

Image.createOrUpdate = async function(params, old) {
  if (old) {
    try {
      let image = await Image.findById(old);
      await image.delete();
    } catch (err) {
      console.error(err);
    }
  }

  return await Image.create(params);
};

module.exports = Image;
