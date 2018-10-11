const domain = process.env.domain ||  "00h30.com";

export default {
  dburl: process.env.dburl || "mongodb://noveliaAdmin:WhipWhipWhip!Novelia@www.00h30.com:27017/admin",
  domain,
  noreply: process.env.noreply || `LitNovel <no-reply@${domain}>`,
  emailDomain: process.env.emailDomain || `mg.${domain}`,
  mailgunApiKey: process.env.mailgunApiKey || 'key-81e8282393033691323858485281412d',
  mailgunHost: process.env.mailgunHost || 'api.eu.mailgun.net'
};
