import env from './env';

const apiKey = env.mailgunApiKey;
const domain = env.emailDomain;
const host = env.mailgunHost;

import * as Mailgun from 'mailgun-js';

const mailgun = Mailgun({apiKey, domain, host});

// TODO: switch based on env.useMailgun between the two
// import SendMail from 'sendmail';
// const sendmail = new SendMail();

const sendmail = data => mailgun.messages().send(data).catch(err => console.error(err));

export default sendmail;
