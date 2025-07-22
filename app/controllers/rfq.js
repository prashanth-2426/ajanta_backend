const {
  RFQ,
  RfqData,
  RFQItem,
  RFQTransportAir,
  RFQTransportSea,
  User,
} = require("../models");
const fs = require("fs");
const path = require("path");
const mailQueue = require("../queues/mailQueue");
const sendVendorInvitation = require("../queues/mailer");

const createRFQWithAttachments = async (req, res) => {
  const t = await RFQ.sequelize.transaction();
  try {
    const { rfq_items, rfq_transport_air, rfq_transport_sea, ...rfqData } =
      req.body;

    const attachmentFiles = req.files || [];
    const attachmentPaths = attachmentFiles.map((file) => file.filename);

    rfqData.attachments = attachmentPaths;

    appendToJsonFile({ ...req.body, attachments: attachmentPaths });

    const rfq = await RFQ.create(rfqData, { transaction: t });

    await t.commit();
    return res.status(201).json({ isSuccess: true, rfq });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ isSuccess: false, error: error.message });
  }
};

const createRFQ = async (req, res) => {
  const t = await RfqData.sequelize.transaction();
  try {
    const parsedData = JSON.parse(req.body.data);
    const { rfq_items, rfq_transport_air, rfq_transport_sea, ...rfqData } =
      parsedData;

    const attachmentFiles = req.files || [];
    const attachmentPaths = attachmentFiles.map((file) => file.filename);
    rfqData.attachments = attachmentPaths;

    const fullData = {
      ...parsedData,
      attachments: attachmentPaths,
    };

    const rfqNumber = fullData.rfq_number;

    const existing = await RfqData.findOne({
      where: { rfq_number: rfqNumber },
    });

    const identifier = fullData.auction_number
      ? "auction_number"
      : "rfq_number";

    if (existing) {
      await existing.update(
        {
          ...existing.toJSON(),
          rfq_number: fullData.rfq_number,
          auction_number: fullData.auction_number || null,
          form_type: fullData.form_type || null,
          rfq_type: fullData.rfq_type || null,
          status: fullData.status || null,
          quote_count: fullData.quote_count || 0,
          data: fullData,
        },
        { transaction: t }
      );
    } else {
      // Set default status for auction entries
      // if (identifier === "auction_number") {
      //   fullData.status = "published";
      // }

      await RfqData.create(
        {
          rfq_number: fullData.rfq_number,
          auction_number: fullData.auction_number || null,
          form_type: fullData.form_type || null,
          rfq_type: fullData.rfq_type || null,
          status: fullData.status || null,
          quote_count: fullData.quote_count || 0,
          data: fullData,
        },
        { transaction: t }
      );

      if (identifier === "auction_number") {
        await RfqData.update(
          {
            status: "auctioned",
            form_type: "auctioned",
          },
          {
            where: { rfq_number: fullData.rfq_number },
            transaction: t,
          }
        );
      }
    }

    await t.commit();
    if (fullData?.vendors?.length) {
      fullData.vendors.forEach((vendor) => {
        sendVendorInvitation(vendor.email, vendor.name, fullData.title);
      });
    }
    return res
      .status(200)
      .json({ isSuccess: true, message: "RFQ saved successfully" });
  } catch (error) {
    await t.rollback();
    console.error("Error in createRFQ:", error);
    return res.status(500).json({ isSuccess: false, error: error.message });
  }
};

const getAllRFQs = async (req, res) => {
  try {
    const { email } = req.query;
    const rfqs = await RfqData.findAll({
      order: [["createdAt", "DESC"]],
    });
    let formatted = rfqs.map((entry) => entry.data);
    if (email) {
      console.log("Filtering RFQs by vendor email:", email);
      formatted = formatted.filter(
        (rfq) =>
          Array.isArray(rfq.vendors) &&
          rfq.vendors.some(
            (vendor) => vendor.email?.toLowerCase() === email.toLowerCase()
          )
      );
    }
    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching RFQs:", error);
    res.status(500).json({ error: "Failed to load RFQs" });
  }
};

const getRFQById = async (req, res) => {
  console.log("RFQ ID:", req.params.id);
  console.log("source value", req.query.source);
  try {
    const rfq = await RFQ.findByPk(req.params.id, {
      include: [User, RFQItem, RFQTransportAir, RFQTransportSea],
    });
    if (!rfq)
      return res.status(404).json({ isSuccess: false, msg: "RFQ not found" });
    return res.json({ isSuccess: true, rfq });
  } catch (error) {
    return res.status(500).json({ isSuccess: false, error: error.message });
  }
};

const updateRFQ = async (req, res) => {
  try {
    const [updated] = await RFQ.update(req.body, {
      where: { id: req.params.id },
    });
    if (!updated)
      return res.status(404).json({ isSuccess: false, msg: "RFQ not found" });
    return res.json({ isSuccess: true, msg: "RFQ updated successfully" });
  } catch (error) {
    return res.status(500).json({ isSuccess: false, error: error.message });
  }
};

const deleteRFQ = async (req, res) => {
  try {
    const { rfq_number } = req.params;

    const rfq = await RfqData.findOne({ where: { rfq_number } });

    if (!rfq) {
      return res.status(404).json({
        isSuccess: false,
        msg: "RFQ not found.",
      });
    }

    rfq.is_deleted = true;
    await rfq.save();

    return res.status(200).json({
      isSuccess: true,
      msg: "RFQ soft-deleted successfully.",
    });
  } catch (error) {
    console.error("Soft Delete RFQ Error:", error);
    return res.status(500).json({
      isSuccess: false,
      msg: "Internal server error.",
    });
  }
};

const updateRfqStatus = async (req, res) => {
  try {
    const { rfq_id, status } = req.body;

    if (!rfq_id || !status) {
      return res.status(400).json({ error: "Missing RFQ ID or status" });
    }

    const rfq = await RfqData.findOne({ where: { rfq_number: rfq_id } });

    if (!rfq) {
      return res.status(404).json({ error: "RFQ not found" });
    }

    const updatedAt = new Date();
    const updatedData = {
      ...(rfq.data || {}),
      status,
      form_type: status,
      updated_at: updatedAt.toISOString(),
    };

    await rfq.update({
      status,
      form_type: status,
      updatedAt,
      data: updatedData,
    });

    return res.json({
      isSuccess: true,
      message: `RFQ ${status} successfully.`,
    });
  } catch (err) {
    console.error("Error updating RFQ status:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createRFQWithAttachments,
  createRFQ,
  getAllRFQs,
  getRFQById,
  updateRFQ,
  deleteRFQ,
  updateRfqStatus,
};
