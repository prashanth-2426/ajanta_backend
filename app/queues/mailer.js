const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "prashanth.babu@coact.co.in",
    pass: "yxdq fwfl bexh iwfo",
  },
});

const sendVendorInvitation = async (email, name, rfqTitle) => {
  const mailOptions = {
    from: '"Ajanta E-Auction" <your-email@example.com>',
    to: email,
    subject: `Invitation to Quote for RFQ: ${rfqTitle}`,
    html: `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="background-color: #003366; color: white; padding: 20px 30px;">
        <h2 style="margin: 0;">Ajantha E-Auction Platform</h2>
      </div>

      <div style="padding: 30px;">
        <p>Dear <strong>${name}</strong>,</p>

        <p>You are invited to participate in the following RFQ:</p>

        <h3 style="color: #003366;">${rfqTitle}</h3>

        <p style="margin-top: 20px;">To review the details and submit your quotation, please click the button below:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://ajantha.coact.co.in/login" style="
              background-color: #007bff;
              color: white;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 4px;
              display: inline-block;
              font-size: 16px;
            ">
            Login to Submit Quote
          </a>
        </div>

        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br/>The Ajantha E-Auction Team</p>
      </div>

      <div style="background-color: #f0f0f0; color: #555; padding: 20px 30px; font-size: 13px; text-align: center;">
        <p style="margin: 0;">© ${new Date().getFullYear()} Ajantha E-Auction Platform. All rights reserved.</p>
        <p style="margin: 5px 0;">Contact us at <a href="mailto:support@ajantha.com">support@ajantha.com</a></p>
      </div>
    </div>
  </div>
`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${email}:`, info.response);
  } catch (err) {
    console.error(`❌ Failed to send email to ${email}:`, err.message);
  }
};

const sendBuyerQuoteNotification = async (
  buyerEmail,
  buyerName,
  vendorName,
  rfqTitle
) => {
  const mailOptions = {
    from: '"Ajanta E-Auction" <your-email@example.com>',
    to: buyerEmail,
    subject: `New Quote Received for RFQ: ${rfqTitle}`,
    html: `
  <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="background-color: #28a745; color: white; padding: 20px 30px;">
        <h2 style="margin: 0;">Ajanta E-Auction Platform</h2>
      </div>

      <div style="padding: 30px;">
        <p>Dear <strong>${buyerName}</strong>,</p>

        <p>We are pleased to inform you that a new quotation has been submitted for your RFQ:</p>

        <h3 style="color: #28a745; margin-bottom: 10px;">${rfqTitle}</h3>
        <p><strong>Vendor:</strong> ${vendorName}</p>

        <p style="margin-top: 20px;">To review the quote details and proceed with evaluation, please click the button below:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://ajantha.coact.co.in/login" style="
              background-color: #28a745;
              color: white;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 4px;
              display: inline-block;
              font-size: 16px;
            ">
            Review Quote
          </a>
        </div>

        <p>If you need any assistance, feel free to reach out to our support team.</p>
        <p>Best regards,<br/>The Ajanta E-Auction Team</p>
      </div>

      <div style="background-color: #f0f0f0; color: #555; padding: 20px 30px; font-size: 13px; text-align: center;">
        <p style="margin: 0;">© ${new Date().getFullYear()} Ajanta E-Auction Platform. All rights reserved.</p>
        <p style="margin: 5px 0;">Contact us at <a href="mailto:support@ajantha.com">support@ajantha.com</a></p>
      </div>
    </div>
  </div>
`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Buyer notification sent to ${buyerEmail}:`, info.response);
  } catch (err) {
    console.error(
      `❌ Failed to send buyer notification to ${buyerEmail}:`,
      err.message
    );
  }
};

const sendVendorNegotiationMail = async (
  vendorEmail,
  vendorName,
  rfqNumber,
  lastPurchasePrice,
  remarks
) => {
  const mailOptions = {
    from: '"Ajanta E-Auction" <your-email@example.com>',
    to: vendorEmail,
    subject: `Negotiation Request for RFQ: ${rfqNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background-color: #ffc107; color: #333; padding: 20px 30px;">
            <h2 style="margin: 0;">Negotiation Requested</h2>
          </div>
          <div style="padding: 30px;">
            <p>Dear <strong>${vendorName}</strong>,</p>
            <p>The buyer has requested a negotiation for your quotation under RFQ <strong>${rfqNumber}</strong>.</p>
            <p><strong>Last Purchase Price:</strong> ${lastPurchasePrice}</p>
            <p><strong>Remarks:</strong> ${remarks}</p>
            <p>Please review the request and update your quotation accordingly.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://ajantha.coact.co.in/login" style="
                  background-color: #007bff;
                  color: white;
                  text-decoration: none;
                  padding: 12px 24px;
                  border-radius: 4px;
                  display: inline-block;
                  font-size: 16px;
                ">
                Login to Respond
              </a>
            </div>
            <p>Best regards,<br/>The Ajanta E-Auction Team</p>
          </div>
          <div style="background-color: #f0f0f0; color: #555; padding: 20px 30px; font-size: 13px; text-align: center;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Ajanta E-Auction Platform. All rights reserved.</p>
            <p style="margin: 5px 0;">Contact us at <a href="mailto:support@ajantha.com">support@ajantha.com</a></p>
          </div>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendVendorInvitation,
  sendBuyerQuoteNotification,
  sendVendorNegotiationMail,
};
