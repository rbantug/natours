const nodemailer = require('nodemailer');

const sendEmail = async (option) => {
  // 1. Create a transporter
  const transporter = nodemailer.createTransport({
    /* // for GMAIL
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    }, */
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2. Define the email option
  const setOptions = {
    from: '"natours" <natours@gmail.com>',
    to: option.email,
    subject: option.subject,
    text: option.message,
    //html: // this will convert the message to html
  };

  // 3. Actually send the email
  await transporter.sendMail(setOptions);
};

module.exports = sendEmail;
