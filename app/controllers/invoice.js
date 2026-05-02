const { QuotesData, RfqData } = require("../models");
const { sendInvoiceSubmittedMail } = require("../queues/mailer");
const path = require("path");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const submitInvoice = async (req, res) => {
  console.log("Submit Invoice API called with body:", req.body);
  try {
    const {
      rfq_number,
      vendor_id,
      vendor_email,
      delivery_date,
      invoice_amount,
      remarks,
    } = req.body;

    const files = req.files;

    console.log("==== Invoice Submit API Hit ====");

    console.log("RFQ Number:", rfq_number);
    console.log("Vendor ID:", vendor_id);
    console.log("Delivery Date:", delivery_date);
    console.log("Invoice Amount:", invoice_amount);
    console.log("Remarks:", remarks);

    console.log("Uploaded Files:", files);

    const quoteRecordToUploadInvoiceData = await QuotesData.findOne({
      where: { rfq_id: rfq_number, vendor_id: req.body.vendor_id },
    });
    if (!quoteRecordToUploadInvoiceData) {
      return res.status(404).json({ message: "Quote not found" });
    }
    console.log(
      "Found quote record for document upload:",
      quoteRecordToUploadInvoiceData,
    );
    const qData = { ...quoteRecordToUploadInvoiceData.data };
    const uploadedDocuments = req.files?.map((file) => file.filename) || [];
    console.log("Files to be attached in quote record:", uploadedDocuments);
    console.log("Existing quote data before attaching documents:", qData);
    qData.invoiceDetails = {
      vendor_id: req.body.vendor_id || "",
      vendor_email: req.body.vendor_email || "",
      freight_amount: req.body.freight_amount || "",
      dap_amount: req.body.dap_amount || "",
      custom_duty_amount: req.body.custom_duty_amount || "",
      others_amount: req.body.others_amount || "",
      remarks: req.body.remarks || "",
      submitted_on: new Date(),
      status: "invoice_submitted",
      attached_file: uploadedDocuments || [],
    };
    await quoteRecordToUploadInvoiceData.update({ data: qData });
    const rfqRecordtst = await RfqData.findOne({
      where: { rfq_number: rfq_number },
    });

    try {
      await sendInvoiceSubmittedMail(
        rfqRecordtst?.data?.buyer?.email,
        rfqRecordtst?.data?.buyer?.name,
        rfq_number,
        qData.invoiceDetails,
      );

      console.log(
        `📩 Invoices Submitted mail sent to buyer: ${rfqRecordtst?.data?.buyer?.email}`,
      );
    } catch (err) {
      console.error(
        `❌ Failed to send Invoices Submitted mail to ${rfqRecordtst?.data?.buyer?.email}`,
        err.message,
      );
    }

    return res.status(200).json({
      isSuccess: true,
      msg: "Invoice API reached successfully.",
      files: uploadedDocuments,
    });
  } catch (error) {
    console.error("Submit Invoice Error:", error);
    return res.status(500).json({
      isSuccess: false,
      msg: "Internal server error.",
    });
  }
};

const getInvoicesByRfq = async (req, res) => {
  try {
    const { rfq_number } = req.params;

    console.log("==== Get Invoices API Hit ====");
    console.log("RFQ Number:", rfq_number);

    return res.status(200).json({
      isSuccess: true,
      data: [],
    });
  } catch (error) {
    console.error("Get Invoices Error:", error);
    return res.status(500).json({
      isSuccess: false,
      msg: "Internal server error.",
    });
  }
};

module.exports = {
  submitInvoice,
  getInvoicesByRfq,
};
