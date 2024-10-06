const nodemailer = require('nodemailer');

const sendEmail = async (clubName, recipientEmail, subject, message) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',  // You can use any SMTP service
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-password',
    },
  });

  const mailOptions = {
    from: `"${clubName}" <noreply@yourplatform.com>`,  // Custom From Name and shared email
    to: recipientEmail,
    subject: subject,
    text: message,
    replyTo: 'support@yourplatform.com',  // Optional Reply-To address
  };

  await transporter.sendMail(mailOptions);
};
