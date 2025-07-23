const nodemailer = require('nodemailer');
const { SMTPConfig } = require('../models');

let transporter = null;

const initializeMailer = async () => {
  try {
    const config = await SMTPConfig.findByPk(1);
    if (!config) {
      console.warn('SMTP configuration not found. Email notifications disabled.');
      return null;
    }

    transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.username,
        pass: config.password,
      },
      tls: {
        rejectUnauthorized: !config.use_tls
      }
    });

    await transporter.verify();
    console.log('SMTP server connection established');
    return transporter;
  } catch (error) {
    console.error('Failed to initialize SMTP:', error.message);
    return null;
  }
};

const sendEmail = async (to, subject, text, html = null) => {
  if (!transporter) {
    await initializeMailer();
  }

  if (!transporter) {
    console.warn('Email not sent: SMTP not configured');
    return false;
  }

  try {
    const config = await SMTPConfig.findByPk(1);
    const mailOptions = {
      from: config.from_address,
      to,
      subject,
      text,
      html: html || text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error.message);
    return false;
  }
};

const sendPostNotification = async (post, action, recipients) => {
  const subject = `[${post.Project.name}] ${action}: ${post.title}`;
  const text = `
A post has been ${action.toLowerCase()} in project "${post.Project.name}":

Title: ${post.title}
Status: ${post.status}
Author: ${post.author.email}

Description:
${post.description}

View the post: ${process.env.CLIENT_URL}/projects/${post.project_id}/posts/${post.id}
  `;

  for (const email of recipients) {
    await sendEmail(email, subject, text);
  }
};

const sendCommentNotification = async (comment, post, recipients) => {
  const subject = `[${post.Project.name}] New comment on: ${post.title}`;
  const text = `
A new comment has been added to a post in project "${post.Project.name}":

Post: ${post.title}
Comment by: ${comment.author.email}

Comment:
${comment.message}

View the post: ${process.env.CLIENT_URL}/projects/${post.project_id}/posts/${post.id}
  `;

  for (const email of recipients) {
    await sendEmail(email, subject, text);
  }
};

module.exports = {
  initializeMailer,
  sendEmail,
  sendPostNotification,
  sendCommentNotification,
};
