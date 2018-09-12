const dburl = process.env.dburl || "mongodb://noveliaAdmin:WhipWhipWhip!Novelia@www.00h30.com:27017/admin";
const domain = process.env.domain ||  "00h30.com";
const noreply = process.env.noreply || `LitNovel <no-reply@${domain}>`;

export default {
  dburl,
  domain,
  noreply
};
