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
          <a href="https://ajantapharma.coact.co.in/login" style="
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

const sendBuyerConfirmationEmail = async (
  buyerEmail,
  buyerName,
  rfqTitle,
  invitedVendors
) => {
  console.log("Preparing buyer confirmation email...");
  const vendorList = invitedVendors
    .map((v) => `<li>${v.name} (${v.email})</li>`)
    .join("");

  const mailOptions = {
    from: '"Ajanta E-Auction" <your-email@example.com>',
    to: buyerEmail,
    subject: `RFQ Created Successfully: ${rfqTitle}`,
    html: `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      
      <div style="background-color: #003366; color: white; padding: 20px 30px;">
        <h2 style="margin: 0;">Ajantha E-Auction Platform</h2>
      </div>

      <div style="padding: 30px;">
        <p>Dear <strong>${buyerName}</strong>,</p>

        <p>We’re pleased to inform you that your RFQ has been successfully created and vendor invitations have been sent.</p>

        <h3 style="color: #003366;">${rfqTitle}</h3>

        <p style="margin-top: 20px;">Below are the vendors invited to participate:</p>
        <ul style="margin-left: 20px; color: #333;">${vendorList}</ul>

        <p style="margin-top: 20px;">You can track the status of your RFQ, monitor vendor responses, and view analytics in your dashboard.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://ajantapharma.coact.co.in/login" style="
              background-color: #28a745;
              color: white;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 4px;
              display: inline-block;
              font-size: 16px;
            ">
            Go to Dashboard
          </a>
        </div>

        <p>If you have any questions or need assistance, please reach out to our support team.</p>

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
    console.log(
      `✅ Buyer confirmation email sent to ${buyerEmail}:`,
      info.response
    );
  } catch (err) {
    console.error(
      `❌ Failed to send buyer email to ${buyerEmail}:`,
      err.message
    );
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
          <a href="https://ajantapharma.coact.co.in/login" style="
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

const sendVendorQuoteSubmissionMail = async (
  vendorEmail,
  vendorName,
  rfqTitle
) => {
  const mailOptions = {
    from: '"Ajanta E-Auction" <your-email@example.com>',
    to: vendorEmail,
    subject: `Quote Submission Confirmation for RFQ: ${rfqTitle}`,
    html: `
  <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="background-color: #007bff; color: white; padding: 20px 30px;">
        <h2 style="margin: 0;">Ajanta E-Auction Platform</h2>
      </div>

      <div style="padding: 30px;">
        <p>Dear <strong>${vendorName}</strong>,</p>

        <p>Thank you for submitting your quotation for the RFQ:</p>

        <h3 style="color: #007bff; margin-bottom: 10px;">${rfqTitle}</h3>

        <p>Your quote has been successfully received and recorded in our system.</p>

        <p style="margin-top: 20px;">You can review your submission or make any necessary updates before the RFQ closing date by clicking the button below:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://ajantapharma.coact.co.in/login" style="
              background-color: #007bff;
              color: white;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 4px;
              display: inline-block;
              font-size: 16px;
            ">
            View My Quote
          </a>
        </div>

        <p>We appreciate your participation in the Ajanta E-Auction process and look forward to your continued engagement.</p>

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
    console.log(
      `✅ Vendor confirmation sent to ${vendorEmail}:`,
      info.response
    );
  } catch (err) {
    console.error(
      `❌ Failed to send vendor confirmation to ${vendorEmail}:`,
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
              <a href="https://ajantapharma.coact.co.in/login" style="
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

const sendBuyerNegotiationConfirmationMail = async (
  buyerEmail,
  buyerName,
  rfqNumber,
  vendorName
) => {
  const mailOptions = {
    from: '"Ajanta E-Auction" <your-email@example.com>',
    to: buyerEmail,
    subject: `Negotiation Request Sent for RFQ: ${rfqNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background-color: #28a745; color: white; padding: 20px 30px;">
            <h2 style="margin: 0;">Negotiation Request Sent</h2>
          </div>
          <div style="padding: 30px;">
            <p>Dear <strong>${buyerName}</strong>,</p>
            <p>Your negotiation request for RFQ <strong>${rfqNumber}</strong> has been successfully sent to vendor <strong>${vendorName}</strong>.</p>
            <p>The vendor will review your request and respond with an updated quotation shortly.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://ajantapharma.coact.co.in/login" style="
                  background-color: #007bff;
                  color: white;
                  text-decoration: none;
                  padding: 12px 24px;
                  border-radius: 4px;
                  display: inline-block;
                  font-size: 16px;
                ">
                View Negotiation Status
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

const sendVendorQuoteAcceptedMail = async (
  vendorEmail,
  vendorName,
  rfqNumber
) => {
  const mailOptions = {
    from: '"Ajanta E-Auction" <your-email@example.com>',
    to: vendorEmail,
    subject: `🎉 Your Quote Accepted for RFQ: ${rfqNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background-color: #28a745; color: white; padding: 20px 30px;">
            <h2 style="margin: 0;">Quote Accepted!</h2>
          </div>
          <div style="padding: 30px;">
            <p>Dear <strong>${vendorName}</strong>,</p>
            <p>Congratulations! Your quotation under <strong>${rfqNumber}</strong> has been <strong>accepted</strong> by the buyer.</p>
            <p>Please proceed with the next steps as per your agreement with the buyer.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://ajantapharma.coact.co.in/login" style="
                  background-color: #007bff;
                  color: white;
                  text-decoration: none;
                  padding: 12px 24px;
                  border-radius: 4px;
                  display: inline-block;
                  font-size: 16px;
                ">
                View RFQ Details
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

const sendBuyerQuoteAcceptanceConfirmationMail = async (
  buyerEmail,
  buyerName,
  rfqNumber,
  vendorName
) => {
  const mailOptions = {
    from: '"Ajanta E-Auction" <your-email@example.com>',
    to: buyerEmail,
    subject: `✅ Vendor Notified for Accepted Quote - RFQ: ${rfqNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background-color: #17a2b8; color: white; padding: 20px 30px;">
            <h2 style="margin: 0;">Quote Acceptance Confirmed</h2>
          </div>
          <div style="padding: 30px;">
            <p>Dear <strong>${buyerName}</strong>,</p>
            <p>The vendor <strong>${vendorName}</strong> has been successfully notified that their quote for RFQ <strong>${rfqNumber}</strong> has been accepted.</p>
            <p>You will be able to track the next steps in your dashboard.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://ajantapharma.coact.co.in/login" style="
                  background-color: #007bff;
                  color: white;
                  text-decoration: none;
                  padding: 12px 24px;
                  border-radius: 4px;
                  display: inline-block;
                  font-size: 16px;
                ">
                View RFQ Status
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

const sendHodApprovalRequestedMail = async (
  hodEmail,
  hodName,
  rfqNumber,
  airlineName,
  buyerName,
  remarks
) => {
  const mailOptions = {
    from: '"Ajanta E-Auction" <your-email@example.com>',
    to: hodEmail,
    subject: `🔔 Approval Needed – RFQ ${rfqNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <div style="background-color: #ffc107; padding: 20px 30px;">
            <h2 style="margin: 0;">HOD Approval Required</h2>
          </div>

          <div style="padding: 30px;">
            <p>Dear <strong>${hodName}</strong>,</p>
            <p><strong>${buyerName}</strong> has requested your approval for RFQ <strong>${rfqNumber}</strong>.</p>

            <p><strong>Selected Airline:</strong> ${airlineName}</p>
            <p><strong>Remarks:</strong> ${remarks ?? "N/A"}</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://ajantapharma.coact.co.in/login" style="
                background-color: #007bff;
                color: white;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 4px;
                display: inline-block;
                font-size: 16px;">
                Review Approval Request
              </a>
            </div>

            <p>Best regards,<br/>Ajanta E-Auction Team</p>
          </div>

          <div style="background-color: #f0f0f0; color: #555; padding: 20px 30px; font-size: 13px; text-align: center;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Ajanta E-Auction Platform</p>
            <p>Need help? <a href="mailto:support@ajantha.com">Contact Support</a></p>
          </div>

        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendHodApprovedMail = async (
  buyerEmail,
  buyerName,
  rfqNumber,
  airlineName,
  hodName,
  hodMessage
) => {
  const mailOptions = {
    from: '"Ajanta E-Auction" <your-email@example.com>',
    to: buyerEmail,
    subject: `✅ HOD Approved – RFQ ${rfqNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <div style="background-color: #28a745; color: white; padding: 20px 30px;">
            <h2 style="margin: 0;">Approval Granted</h2>
          </div>

          <div style="padding: 30px;">
            <p>Dear <strong>${buyerName}</strong>,</p>
            <p>The HOD has <strong>approved</strong> the selected quote for RFQ <strong>${rfqNumber}</strong>.</p>

            <p><strong>Airline:</strong> ${airlineName}</p>

            ${
              hodMessage
                ? `<p><strong>HOD Remarks:</strong> ${hodMessage}</p>`
                : ""
            }

            <p>You may now continue with the next operational steps.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://ajantapharma.coact.co.in/login" style="
                background-color: #007bff;
                color: white;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 4px;
                display: inline-block;
                font-size: 16px;">
                View RFQ Details
              </a>
            </div>

            <p>Best regards,<br/>Ajanta E-Auction Team</p>
          </div>

          <div style="background-color: #f0f0f0; color: #555; padding: 20px 30px; font-size: 13px; text-align: center;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Ajanta E-Auction Platform</p>
            <p>Need help? <a href="mailto:support@ajantha.com">Contact Support</a></p>
          </div>

        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendHodRejectedMail = async (
  buyerEmail,
  buyerName,
  rfqNumber,
  airlineName,
  hodName,
  hodMessage
) => {
  const mailOptions = {
    from: '"Ajanta E-Auction" <your-email@example.com>',
    to: buyerEmail,
    subject: `❌ HOD Rejected – RFQ ${rfqNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <div style="background-color: #dc3545; color: white; padding: 20px 30px;">
            <h2 style="margin: 0;">Approval Rejected</h2>
          </div>

          <div style="padding: 30px;">
            <p>Dear <strong>${buyerName}</strong>,</p>
            <p>The HOD has <strong>rejected</strong> the selected quote for RFQ <strong>${rfqNumber}</strong>.</p>

            <p><strong>Airline:</strong> ${airlineName}</p>

            ${
              hodMessage
                ? `<p><strong>HOD Remarks:</strong> ${hodMessage}</p>`
                : ""
            }

            <p>Please review and revise your selection if required.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://ajantapharma.coact.co.in/login" style="
                background-color: #007bff;
                color: white;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 4px;
                display: inline-block;
                font-size: 16px;">
                Review RFQ
              </a>
            </div>

            <p>Best regards,<br/>Ajanta E-Auction Team</p>
          </div>

          <div style="background-color: #f0f0f0; color: #555; padding: 20px 30px; font-size: 13px; text-align: center;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Ajanta E-Auction Platform</p>
            <p>Need help? <a href="mailto:support@ajantha.com">Contact Support</a></p>
          </div>

        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendVendorInvitation,
  sendBuyerConfirmationEmail,
  sendBuyerQuoteNotification,
  sendVendorNegotiationMail,
  sendBuyerNegotiationConfirmationMail,
  sendVendorQuoteAcceptedMail,
  sendBuyerQuoteAcceptanceConfirmationMail,
  sendVendorQuoteSubmissionMail,
  sendHodApprovalRequestedMail,
  sendHodApprovedMail,
  sendHodRejectedMail,
};
