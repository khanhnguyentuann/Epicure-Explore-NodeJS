const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html) => {
  // Kiểm tra biến môi trường
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Biến môi trường EMAIL_USER hoặc EMAIL_PASS không được thiết lập.');
    throw new Error('Email configuration error');
  }

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let mailOptions = {
    from: '"ShareRecipes Support" <' + process.env.EMAIL_USER + '>',
    to: to,
    subject: subject,
    html: html,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;

