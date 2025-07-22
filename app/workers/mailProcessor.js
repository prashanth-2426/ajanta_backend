// workers/mailProcessor.js
const mailQueue = require("../queues/mailQueue");
const nodemailer = require("nodemailer");
const fs = require("fs");

const transporter = nodemailer.createTransport({
  service: "gmail", // Or use SMTP config
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

mailQueue.process(async (job, done) => {
  const { to, subject, html } = job.data;

  try {
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}`);
    done();
  } catch (error) {
    console.error(`❌ Email failed to ${to}`, error);
    fs.appendFileSync(
      "logs/email-failures.log",
      `${new Date().toISOString()} - ${to} - ${error.message}\n`
    );
    done(new Error(`Failed to send email to ${to}`));
  }
});
