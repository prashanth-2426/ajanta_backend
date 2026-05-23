const nodemailer = require("nodemailer");
const path = require("path");

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
    //console.log(`✅ Email sent to ${email}:`, info.response);
  } catch (err) {
    console.error(`❌ Failed to send email to ${email}:`, err.message);
  }
};

const sendBuyerConfirmationEmail = async (
  buyerEmail,
  buyerName,
  rfqTitle,
  invitedVendors,
) => {
  //console.log("Preparing buyer confirmation email...");
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
      info.response,
    );
  } catch (err) {
    console.error(
      `❌ Failed to send buyer email to ${buyerEmail}:`,
      err.message,
    );
  }
};

const sendBuyerQuoteNotification = async (
  buyerEmail,
  buyerName,
  vendorName,
  rfqTitle,
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
    //console.log(`✅ Buyer notification sent to ${buyerEmail}:`, info.response);
  } catch (err) {
    console.error(
      `❌ Failed to send buyer notification to ${buyerEmail}:`,
      err.message,
    );
  }
};

const sendVendorQuoteSubmissionMail = async (
  vendorEmail,
  vendorName,
  rfqTitle,
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

        <p>Thank you for submitting your quotation:</p>

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
      info.response,
    );
  } catch (err) {
    console.error(
      `❌ Failed to send vendor confirmation to ${vendorEmail}:`,
      err.message,
    );
  }
};

const sendVendorNegotiationMail = async (
  vendorEmail,
  vendorName,
  rfqNumber,
  lastPurchasePrice,
  remarks,
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
            <p><strong>Target Price:</strong> ${lastPurchasePrice}</p>
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
  vendorName,
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
  rfqNumber,
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
  vendorName,
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
  //airlineName,
  buyerName,
  remarks,
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
  hodMessage,
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
            <p>The HOD has <strong>approved</strong> <strong>${rfqNumber}</strong>.</p>

            <p><strong>Airline:</strong> ${airlineName}</p>

            ${
              hodMessage
                ? `<p><strong>HOD Remarks:</strong> ${hodMessage}</p>`
                : ""
            }

            <p>
              Kindly share the <strong>earliest flight schedule</strong>. Based on the same,
              we will review and proceed further. After confirmation, we will share the
              <strong>custom documents</strong> shortly.
            </p>

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
  hodMessage,
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
            <p>The HOD has <strong>rejected</strong> the selected quote for <strong>${rfqNumber}</strong>.</p>

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

async function sendQuoteDetailsToMarketingTeam(
  marketingEmail,
  marketingName,
  rfqNumber,
  buyerName,
  remarks,
  files = [],
) {
  // const filePath = attachmentFileName
  //   ? path.join(__dirname, "..", "uploads", "rfq", attachmentFileName)
  //   : null;

  const attachments = files.map((file) => ({
    filename: file,
    path: path.join(__dirname, "..", "uploads", "rfq", file),
  }));

  //console.log("Preparing to send quote details to marketing team...", filePath);

  const mailOptions = {
    from: `"RFQ System" <${process.env.EMAIL_USER}>`,
    to: marketingEmail,
    subject: `📦 Quote Details Shared for RFQ #${rfqNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        
        <h2 style="color: #2c3e50;">📢 Quote Shared For Marketing Team Review</h2>
        
        <p>Hello <strong>${marketingName}</strong>,</p>

        <p>
          The Export team has shared the quote details for 
          <strong>RFQ #${rfqNumber}</strong>.
        </p>

        <p><strong>Buyer Name:</strong> ${buyerName}</p>

        <p><strong>Remarks from Exports Team:</strong><br/>${remarks}</p>

        ${
          attachments.length > 0
            ? `
          <p>
            A document has been attached for your reference.<br>
            <strong>Attachment File:</strong> ${attachments.map((f) => `<br/>${f}`).join("")}
          </p>
        `
            : ""
        }

        <p>Please review and proceed with the next steps.</p>

        <br/>

        <p>Regards,<br/>Exports Team</p>
      </div>
    `,
    attachments: attachments,
  };

  await transporter.sendMail(mailOptions);
}

const sendVendorAuctionInvitation = async ({
  email,
  name,
  rfqTitle,
  auctionId,
  auctionNumber,
  startTime,
  endTime,
}) => {
  console.log(`Preparing auction invitation for ${startTime} ${endTime}...`);

  const formatIST = (date) =>
    new Date(date).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const joinUrl = `https://ajantapharma.coact.co.in/login?auctionId=${auctionId}`;

  const mailOptions = {
    from: '"Ajanta E-Auction" <your-email@example.com>',
    to: email,
    subject: `Auction Invitation – ${rfqTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; background:#f4f4f4; padding:30px;">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;">
          
          <div style="background:#003366;color:#fff;padding:20px;">
            <h2>Ajantha E-Auction Platform</h2>
          </div>

          <div style="padding:25px;">
            <p>Dear <strong>${name || "Vendor"}</strong>,</p>

            <p>You are invited to participate in the following auction:</p>

            <h3 style="color:#003366">${rfqTitle}</h3>

            <p><b>Auction Number:</b> ${auctionNumber}</p>
            <p><b>Auction Participation ID:</b> ${auctionId}</p>

            <p><b>Start Time:</b> ${formatIST(startTime)}</p>
            <p><b>End Time:</b> ${formatIST(endTime)}</p>

            <p style="margin-top:15px;">
              Please use the Auction ID above to join and participate in the auction.
            </p>

            <div style="text-align:center;margin:30px 0;">
              <a href="${joinUrl}"
                 style="background:#007bff;color:white;padding:12px 24px;
                 text-decoration:none;border-radius:4px;font-size:16px;">
                Join Auction
              </a>
            </div>

            <p>Best regards,<br/>Ajanta E-Auction Team</p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    //console.log(`✅ Invitation sent to ${email}`);
  } catch (err) {
    console.error(`❌ Failed for ${email}`, err.message);
  }
};

const sendAuctionResultEmails = async ({ winner, nonWinners }) => {
  try {
    // 🔥 1. Send Winner Email
    await sendVendorAuctionResultEmail({
      email: winner.email,
      name: winner.vendor_name,
      rfqNumber: winner.rfq_number,
      shipmentIndex: winner.shipment_index,
      airline: winner.airline,
      airport: winner.airport,
      rank: winner.rank,
      isWinner: true,
    });

    console.log("✅ Winner email sent to:", winner.email);

    // 🔥 2. Send Non-Winner Emails
    if (nonWinners && nonWinners.length > 0) {
      for (const vendor of nonWinners) {
        await sendVendorAuctionResultEmail({
          email: vendor.email,
          name: vendor.vendor_name,
          rfqNumber: vendor.rfq_number,
          shipmentIndex: vendor.shipment_index,
          airline: vendor.airline,
          airport: vendor.airport,
          rank: vendor.rank,
          isWinner: false,
        });

        console.log("📩 Non-winner email sent to:", vendor.email);
      }
    }
  } catch (error) {
    console.error("❌ Error in sendAuctionResultEmails:", error);
  }
};

const sendVendorAuctionResultEmail = async ({
  email,
  name,
  rfqNumber,
  shipmentIndex,
  airline,
  airport,
  rank,
  isWinner,
}) => {
  const subject = isWinner
    ? `Congratulations! You Won Auction ${rfqNumber}`
    : `Auction Result – ${rfqNumber}`;

  const statusMessage = isWinner
    ? `<h3 style="color:green;">Congratulations! You have WON the auction.</h3>`
    : `<h3 style="color:#c0392b;">Thank you for participating in the auction.</h3>`;

  const mailOptions = {
    from: '"Ajanta E-Auction" <your-email@example.com>',
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; background:#f4f4f4; padding:30px;">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;">
          
          <div style="background:#003366;color:#fff;padding:20px;">
            <h2>Ajanta E-Auction Platform</h2>
          </div>

          <div style="padding:25px;">
            <p>Dear <strong>${name || "Vendor"}</strong>,</p>

            ${statusMessage}

            <h3 style="color:#003366;margin-top:20px;">
              Auction Details
            </h3>

            <p><b>Auction Number:</b> ${rfqNumber.replace(/^RFQ/, "AUC")}</p>
            <p><b>Airline:</b> ${airline}</p>
            <p><b>Airport:</b> ${airport}</p>
            <p><b>Your Rank:</b> ${rank}</p>

            ${
              isWinner
                ? `
              <p style="margin-top:15px;">
                Our team will contact you shortly for further process.
              </p>
            `
                : `
              <p style="margin-top:15px;">
                We appreciate your participation and look forward to your involvement in future auctions.
              </p>
            `
            }

            <p style="margin-top:25px;">
              Best regards,<br/>
              Ajanta E-Auction Team
            </p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error(`❌ Failed sending result email to ${email}`, err.message);
  }
};

const sendNominationRejectedMail = async (
  vendorEmail,
  vendorName,
  rfqNumber,
  reason,
) => {
  const mailOptions = {
    from: '"Ajanta E-Auction" <your-email@example.com>',
    to: vendorEmail,
    subject: `Nomination Update – RFQ ${rfqNumber}`,
    html: `
      <div style="font-family: Arial; padding:20px">
        <p>Dear <strong>${vendorName}</strong>,</p>

        <p>Your nomination for shipment under <strong>${rfqNumber}</strong> has been withdrawn.</p>

        <p><strong>Reason:</strong> ${reason}</p>

        <p>Another airline/vendor has been approved based on operational requirements.</p>

        <p>Thank you for your participation.</p>

        <br/>
        <p>Regards,<br/>Ajanta E-Auction Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendMarketingTeamRejectedMail = async (
  buyerEmail,
  buyerName,
  rfqNumber,
  marketingName,
  marketingMessage,
) => {
  const mailOptions = {
    from: '"Ajanta E-Auction" <your-email@example.com>',
    to: buyerEmail,
    subject: `❌ Marketing Team Rejected – RFQ ${rfqNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <div style="background-color: #dc3545; color: white; padding: 20px 30px;">
            <h2 style="margin: 0;">Marketing Team Rejected</h2>
          </div>

          <!-- Body -->
          <div style="padding: 30px;">
            <p>Dear <strong>${buyerName}</strong>,</p>

            <p>
              The Marketing Team has <strong>rejected</strong> the request related to
              <strong>${rfqNumber}</strong>.
            </p>

            ${
              marketingName
                ? `<p><strong>Reviewed By:</strong> ${marketingName}</p>`
                : ""
            }

            ${
              marketingMessage
                ? `<p><strong>Marketing Team Remarks:</strong> ${marketingMessage}</p>`
                : ""
            }

            <p>
              Kindly review the request and make the required corrections before
              submitting again.
            </p>

            <!-- Button -->
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

          <!-- Footer -->
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

const sendMarketingTeamApprovedMail = async (
  buyerEmail,
  buyerName,
  rfqNumber,
  marketingName,
) => {
  const mailOptions = {
    from: '"Ajanta E-Auction" <your-email@example.com>',
    to: buyerEmail,
    subject: `✅ Marketing Team Approved – RFQ ${rfqNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <div style="background-color: #28a745; color: white; padding: 20px 30px;">
            <h2 style="margin: 0;">Marketing Team Approved</h2>
          </div>

          <div style="padding: 30px;">
            <p>Dear <strong>${buyerName}</strong>,</p>

            <p>
              The Marketing Team has <strong>approved</strong> the request for 
             <strong>${rfqNumber}</strong>.
            </p>

            ${
              marketingName
                ? `<p><strong>Approved By:</strong> ${marketingName}</p>`
                : ""
            }

            <p>You can now proceed with the HOD Approval process.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://ajantapharma.coact.co.in/login" style="
                background-color: #007bff;
                color: white;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 4px;
                display: inline-block;
                font-size: 16px;">
                Open RFQ
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

const sendInvoiceSubmittedMail = async (
  toEmail,
  buyerName,
  rfqNumber,
  invoiceDetails,
) => {
  try {
    const {
      vendor_email,
      vendor_id,
      freight_amount,
      dap_amount,
      custom_duty_amount,
      others_amount,
      remarks,
      submitted_on,
    } = invoiceDetails || {};

    const rfqLink = `${process.env.FRONTEND_URL}/rfq-details/${rfqNumber}`;

    const mailOptions = {
      from: '"Ajantha E-Auction" <your-email@example.com>',
      to: toEmail,
      subject: `📄 Invoice Submitted for RFQ ${rfqNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 20px;">
          
          <!-- Container -->
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

            <!-- Header -->
            <div style="background-color: #1f2937; color: #ffffff; padding: 15px 20px;">
              <h2 style="margin: 0;">Ajantha E-Auction</h2>
            </div>

            <!-- Body -->
            <div style="padding: 20px; color: #333;">
              <p>Dear <strong>${buyerName || "User"}</strong>,</p>

              <p>
                A vendor has submitted invoice details for the following RFQ.
                Please review the details and proceed with necessary action.
              </p>

              <!-- RFQ Info -->
              <div style="background: #f9fafb; padding: 12px; border-radius: 6px; margin-bottom: 15px;">
                <p style="margin: 0;"><strong>RFQ Number:</strong> ${rfqNumber}</p>
              </div>

              <!-- Vendor Info -->
              <h4 style="margin-bottom: 8px;">Vendor Details</h4>
              <p style="margin: 2px 0;"><strong>Vendor ID:</strong> ${vendor_id || "-"}</p>
              <p style="margin: 2px 0;"><strong>Vendor Email:</strong> ${vendor_email || "-"}</p>

              <!-- Invoice Table -->
              <h4 style="margin-top: 15px; margin-bottom: 8px;">Invoice Breakdown</h4>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;"><strong>Freight</strong></td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${freight_amount || "-"}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;"><strong>DAP/DDP</strong></td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${dap_amount || "-"}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;"><strong>Custom Duty</strong></td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${custom_duty_amount || "-"}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;"><strong>Other Charges</strong></td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${others_amount || "-"}</td>
                </tr>
              </table>

              ${
                remarks
                  ? `<p style="margin-top: 10px;"><strong>Remarks:</strong> ${remarks}</p>`
                  : ""
              }

              <p style="margin-top: 10px;">
                <strong>Submitted On:</strong> ${
                  submitted_on
                    ? new Date(submitted_on).toLocaleString()
                    : new Date().toLocaleString()
                }
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
              <a href="https://ajantapharma.coact.co.in/login" style="
                background-color: #007bff;
                color: white;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 4px;
                display: inline-block;
                font-size: 16px;">
                Login to Review Invoice
              </a>
            </div>

              <p>
                Please log in to the platform to review and take action.
              </p>

              <br/>

              <p>Regards,<br/><strong>Ajantha Platform Team</strong></p>
            </div>

            <!-- Footer -->
            <div style="background: #f3f4f6; text-align: center; padding: 10px; font-size: 12px; color: #666;">
              © ${new Date().getFullYear()} Ajantha E-Auction Platform
            </div>

          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log(`📩 Invoice submitted mail sent to: ${toEmail}`);
  } catch (error) {
    console.error("❌ Error sending invoice mail:", error.message);
  }
};

const sendInvoiceRejectedMail = async (
  toEmail,
  vendorName,
  rfqNumber,
  reason,
) => {
  try {
    const mailOptions = {
      from: '"Ajanta E-Auction" <your-email@example.com>',
      to: toEmail,
      subject: `Invoice Rejected for RFQ ${rfqNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
          
          <!-- Header -->
          <div style="background:#dc2626; padding:12px 20px; color:#fff; border-radius:6px 6px 0 0;">
            <h2 style="margin:0;">Invoice Rejected</h2>
          </div>

          <!-- Body -->
          <div style="background:#fff; padding:20px; border:1px solid #ddd;">
            <p>
              Your submitted invoice for the following RFQ has been <strong style="color:#dc2626;">rejected</strong>.
            </p>

            <h3 style="margin-bottom:5px;">RFQ Details</h3>
            <p><strong>RFQ Number:</strong> ${rfqNumber}</p>

            ${
              reason
                ? `
              <div style="margin-top:15px; padding:12px; background:#fee2e2; border:1px solid #fca5a5; border-radius:6px;">
                <strong style="color:#b91c1c;">Rejection Reason:</strong>
                <div style="margin-top:5px; color:#7f1d1d;">
                  ${reason}
                </div>
              </div>
            `
                : ""
            }

            <p style="margin-top:20px;">
              Please review the feedback and resubmit the invoice with the necessary corrections.
            </p>

            <!-- CTA -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://ajantapharma.coact.co.in/login" style="
                background-color: #007bff;
                color: white;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 4px;
                display: inline-block;
                font-size: 16px;">
                Login to Review
              </a>
            </div>

            <br/>

            <p>Regards,<br/>Ajantha Platform Team</p>
          </div>

        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log(`📩 Invoice rejection mail sent to vendor: ${toEmail}`);
  } catch (error) {
    console.error("❌ Error sending invoice rejection mail:", error.message);
  }
};

const sendInvoiceApprovedMail = async (
  toEmail,
  rfqNumber,
  invoiceDetails,
  approvedBy,
) => {
  try {
    const {
      freight_amount,
      dap_amount,
      custom_duty_amount,
      others_amount,
      submitted_on,
    } = invoiceDetails || {};

    const VIEW_URL = `${process.env.FRONTEND_URL}/rfq-details/${rfqNumber}`;

    const mailOptions = {
      from: '"Ajantha E-Auction" <your-email@example.com>',
      to: toEmail,
      subject: `✅ Invoice Approved - RFQ ${rfqNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; background:#f4f6f9; padding:20px;">
          
          <div style="max-width:600px; margin:auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
            
            <!-- HEADER -->
            <div style="background:#28a745; color:#fff; padding:15px; text-align:center;">
              <h2 style="margin:0;">Ajantha E-Auction</h2>
              <p style="margin:0;">Invoice Approved</p>
            </div>

            <!-- BODY -->
            <div style="padding:20px;">

              <p>
                Your submitted invoice has been <strong style="color:green;">approved</strong> successfully.
              </p>

              <!-- RFQ INFO -->
              <h3 style="margin-bottom:5px;">RFQ Details</h3>
              <p><strong>RFQ Number:</strong> ${rfqNumber}</p>

              <!-- APPROVAL INFO -->
              <h3 style="margin-bottom:5px;">Approval Details</h3>
              <p><strong>Approved By:</strong> ${approvedBy || "-"}</p>
              <p><strong>Approved On:</strong> ${new Date().toLocaleString()}</p>

              <!-- INVOICE BREAKDOWN -->
              <h3 style="margin-bottom:5px;">Invoice Summary</h3>
              <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width:100%;">
                <tr>
                  <td><strong>Freight</strong></td>
                  <td>${freight_amount || "-"}</td>
                </tr>
                <tr>
                  <td><strong>DAP/DDP</strong></td>
                  <td>${dap_amount || "-"}</td>
                </tr>
                <tr>
                  <td><strong>Custom Duty</strong></td>
                  <td>${custom_duty_amount || "-"}</td>
                </tr>
                <tr>
                  <td><strong>Other Charges</strong></td>
                  <td>${others_amount || "-"}</td>
                </tr>
              </table>

              <p><strong>Submitted On:</strong> ${
                submitted_on ? new Date(submitted_on).toLocaleString() : "-"
              }</p>

              <!-- CTA -->
              <div style="text-align: center; margin: 30px 0;">
              <a href="https://ajantapharma.coact.co.in/login" style="
                background-color: #007bff;
                color: white;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 4px;
                display: inline-block;
                font-size: 16px;">
                Login to Review
              </a>
            </div>

              <p>
                You may proceed with the next steps as per the process.
              </p>

              <br/>
              <p>Regards,<br/>Ajantha Platform Team</p>
            </div>

            <!-- FOOTER -->
            <div style="background:#f1f1f1; padding:10px; text-align:center; font-size:12px; color:#666;">
              © ${new Date().getFullYear()} Ajantha E-Auction Platform
            </div>

          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log(`📩 Invoice approved mail sent to: ${toEmail}`);
  } catch (error) {
    console.error("❌ Error sending invoice approved mail:", error.message);
  }
};

const sendAccountsMail = async (data, files) => {
  const {
    status,
    remarks,
    shared_on,
    selected_invoice,
    accounts_team_details,
  } = data;

  const emails = accounts_team_details.split(",");

  const attachments = files.map((file) => ({
    filename: file,
    path: path.join(__dirname, "..", "uploads", "invoices", file),
  }));

  const mailOptions = {
    from: `"RFQ System" <${process.env.EMAIL_USER}>`,
    to: emails,
    subject: `📄 Invoice Shared for Review`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        
        <h2 style="color:#2563eb;">📄 Invoice Shared for Review</h2>
      <p><strong>Remarks:</strong> ${remarks}</p>
      <p><strong>Shared On:</strong> ${new Date(shared_on).toLocaleString()}</p>

      <hr/>

      <h3 style="color:#16a34a;">💰 Invoice Details</h3>

      <table style="width:100%; border-collapse: collapse;">
        <tr>
          <td><strong>Vendor Email:</strong></td>
          <td>${selected_invoice.vendor_email}</td>
        </tr>
        <tr>
          <td><strong>Status:</strong></td>
          <td>${selected_invoice.status}</td>
        </tr>
        <tr>
          <td><strong>Submitted On:</strong></td>
          <td>${new Date(selected_invoice.submitted_on).toLocaleString()}</td>
        </tr>
      </table>

      <br/>

      <h3 style="color:#f59e0b;">💸 Cost Breakdown</h3>

      <table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse: collapse;">
        <tr style="background:#f3f4f6;">
          <th>Freight</th>
          <th>DAP</th>
          <th>Custom Duty</th>
          <th>Others</th>
        </tr>
        <tr>
          <td>${selected_invoice.freight_amount || "-"}</td>
          <td>${selected_invoice.dap_amount || "-"}</td>
          <td>${selected_invoice.custom_duty_amount || "-"}</td>
          <td>${selected_invoice.others_amount || "-"}</td>
        </tr>
      </table>
      <br/>
        <p>Please review and proceed with the next steps.</p>
        <br/>
        <p>Regards,<br/>Exports Team</p>
      </div>
    `,
    attachments: attachments,
  };
  await transporter.sendMail(mailOptions);
};

const sendResetPasswordOtpMail = async ({ email, name, otp }) => {
  try {
    const mailOptions = {
      from: `"E-Auction Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🔐 Password Reset OTP`,
      html: `
        <div style="
          font-family: Arial, sans-serif;
          line-height: 1.6;
          background: #f4f6f9;
          padding: 30px;
        ">
          <div style="
            max-width: 600px;
            margin: auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e5e7eb;
          ">

            <!-- HEADER -->
            <div style="
              background: #1e293b;
              padding: 20px;
              text-align: center;
            ">
              <h2 style="
                color: #ffffff;
                margin: 0;
                font-size: 24px;
              ">
                E-Auction Platform
              </h2>
            </div>

            <!-- BODY -->
            <div style="padding: 30px;">

              <h3 style="
                margin-top: 0;
                color: #111827;
              ">
                Password Reset Request
              </h3>

              <p style="
                color: #4b5563;
                font-size: 15px;
              ">
                Hello ${name || "User"},
              </p>

              <p style="
                color: #4b5563;
                font-size: 15px;
              ">
                We received a request to reset your password.
                Please use the OTP below to continue.
              </p>

              <!-- OTP BOX -->
              <div style="
                text-align: center;
                margin: 35px 0;
              ">
                <div style="
                  display: inline-block;
                  background: #eff6ff;
                  border: 2px dashed #2563eb;
                  padding: 18px 40px;
                  border-radius: 12px;
                  font-size: 32px;
                  font-weight: bold;
                  letter-spacing: 8px;
                  color: #1d4ed8;
                ">
                  ${otp}
                </div>
              </div>

              <p style="
                color: #dc2626;
                font-size: 14px;
                font-weight: 600;
              ">
                ⚠️ This OTP is valid for 10 minutes only.
              </p>

              <p style="
                color: #6b7280;
                font-size: 14px;
              ">
                If you did not request this password reset,
                please ignore this email.
              </p>

            </div>

            <!-- FOOTER -->
            <div style="
              background: #f9fafb;
              padding: 15px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
            ">
              <p style="
                margin: 0;
                font-size: 13px;
                color: #6b7280;
              ">
                © ${new Date().getFullYear()} E-Auction Platform
              </p>
            </div>

          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return true;
  } catch (err) {
    console.log("OTP Mail Error:", err);
    return false;
  }
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
  sendQuoteDetailsToMarketingTeam,
  sendVendorAuctionInvitation,
  sendAuctionResultEmails,
  sendVendorAuctionResultEmail,
  sendNominationRejectedMail,
  sendMarketingTeamRejectedMail,
  sendMarketingTeamApprovedMail,
  sendInvoiceSubmittedMail,
  sendInvoiceRejectedMail,
  sendInvoiceApprovedMail,
  sendAccountsMail,
  sendResetPasswordOtpMail,
};
