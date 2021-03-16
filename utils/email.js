const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.lastName = user.name.split(' ')[1];
    this.url = url;
    this.from = process.env.EMAIL_FROM;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // use sendgrid
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.EMAIL_SENDGRID_USERNAME,
          pass: process.env.EMAIL_SENDGRID_PASSWORD
        }
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  }

  async emailTemplate(template, subject) {
    const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });

    const setOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html)
    };

    await this.newTransport().sendMail(setOptions);
  }

  async sendWelcome() {
    await this.emailTemplate('welcomeEmail', 'Welcome to Natours!');
  }

  async sendPasswordReset() {
    await this.emailTemplate('forgotPasswordEmail', 'Your password reset token (Valid for 10 minutes)');
  }
}

// const sendEmail = async (option) => {
//   // 1. Create a transporter
//   const transporter = nodemailer.createTransport({
//     /* // for GMAIL
//     service: 'Gmail',
//     auth: {
//         user: process.env.EMAIL_USERNAME,
//         pass: process.env.EMAIL_PASSWORD,
//     }, */
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   // 2. Define the email option
//   const setOptions = {
//     from: '"natours" <natours@gmail.com>',
//     to: option.email,
//     subject: option.subject,
//     text: option.message,
//     //html: // this will convert the message to html
//   };

//   // 3. Actually send the email
//   await transporter.sendMail(setOptions);
// };

// module.exports = sendEmail;
