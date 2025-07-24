const nodemailer = require('nodemailer');
const { SMTPConfig } = require('../models/associations');
const { EmailTemplateEngine, emailContents } = require('./emailTemplateEngine');
const { getClientUrl } = require('./clientUrl');

let transporter = null;
const templateEngine = new EmailTemplateEngine();

const initializeMailer = async () => {
  try {
    const config = await SMTPConfig.findByPk(1);
    if (!config) {
      console.warn('SMTP configuration not found. Email notifications disabled.');
      return null;
    }

    transporter = nodemailer.createTransport({
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

const refreshMailer = async () => {
  transporter = null;
  return await initializeMailer();
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
  const clientUrl = await getClientUrl();
  const emailData = emailContents.postNotification(post, action, clientUrl);
  const htmlContent = await templateEngine.renderEmail(emailData);

  const textContent = `
[${post.Project.name}] ${action}: ${post.title}

A post has been ${action.toLowerCase()} in project "${post.Project.name}":

Title: ${post.title}
Status: ${post.status}
Author: ${post.author.email}

Description:
${post.description}

View the post: ${clientUrl}/projects/${post.project_id}/issues/${post.id}

---
TigerBug Team
  `.trim();

  for (const email of recipients) {
    await sendEmail(email, emailData.subject, textContent, htmlContent);
  }
};

const sendCommentNotification = async (comment, post, recipients) => {
  const clientUrl = await getClientUrl();
  const emailData = emailContents.commentNotification(comment, post, clientUrl);
  const htmlContent = await templateEngine.renderEmail(emailData);
  
  const textContent = `
[${post.Project.name}] New comment on: ${post.title}

A new comment has been added to a post in project "${post.Project.name}":

Post: ${post.title}
Comment by: ${comment.author.email}

Comment:
${comment.message}

View the post: ${clientUrl}/projects/${post.project_id}/issues/${post.id}

---
TigerBug Team
  `.trim();

  for (const email of recipients) {
    await sendEmail(email, emailData.subject, textContent, htmlContent);
  }
};

const sendVerificationEmail = async (email, verificationCode) => {
  const clientUrl = await getClientUrl();
  const verificationUrl = `${clientUrl}/verify-email?email=${encodeURIComponent(email)}&code=${verificationCode}`;
  const emailData = emailContents.verification(verificationCode, verificationUrl);
  const htmlContent = await templateEngine.renderEmail(emailData);
  
  const textContent = `
Welcome to TigerBug!

To complete your registration, please verify your email address using one of the following methods:

1. Click this link to verify automatically:
${verificationUrl}

2. Or enter this 6-digit verification code manually:
${verificationCode}

This code will expire in 24 hours.

If you didn't create an account, please ignore this email.

---
TigerBug Team
${clientUrl}
  `.trim();

  return await sendEmail(email, emailData.subject, textContent, htmlContent);
};

const sendWelcomeEmail = async (email) => {
  const clientUrl = await getClientUrl();
  const emailData = emailContents.welcome(email, clientUrl);
  const htmlContent = await templateEngine.renderEmail(emailData);
  
  const textContent = `
Welcome to TigerBug!

Hi there!

Welcome to TigerBug! We're excited to have you on board. Your account (${email}) is now verified and ready to use.

What's Next?
Here are some things you can do to get started:
- Create your first project
- Submit bug reports and feature requests
- Collaborate with your team
- Track issue progress

Pro Tip: Use labels and priorities to organize your issues effectively!

Get started: ${clientUrl}

---
TigerBug Team
  `.trim();

  return await sendEmail(email, emailData.subject, textContent, htmlContent);
};

const sendSimpleTestEmail = async (email) => {
  const emailData = emailContents.testEmail();
  const htmlContent = await templateEngine.renderEmail(emailData);
  
  const textContent = `
SMTP Configuration Test - TigerBug

Your SMTP configuration is working correctly!

Congratulations! This test email confirms that your SMTP configuration is working properly.

You can now send system notifications including:
- Welcome emails for new users
- Email verification messages
- Post and comment notifications
- Password reset emails

Note: This is a test message sent from your TigerBug system. You can safely ignore it.

---
TigerBug Team
  `.trim();

  return await sendEmail(email, emailData.subject, textContent, htmlContent);
};

module.exports = {
  initializeMailer,
  refreshMailer,
  sendEmail,
  sendPostNotification,
  sendCommentNotification,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendSimpleTestEmail,
};
