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
const {
  sendVendorInvitation,
  sendBuyerConfirmationEmail,
} = require("../queues/mailer");
const auctionService = require("../services/auctionService");

// let uuidv4;
// import("uuid").then((m) => {
//   uuidv4 = m.v4;
// });

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
      const existingData = existing.data || {};

      // If this is auction update, rebuild auctionPayload
      let updatedData = {
        ...existingData,
        ...fullData,
      };

      if (identifier === "auction_number") {
        const auctionPayload = {
          ...(existingData.auction_data || {}), // preserve old fields
          mode: fullData.type || existingData?.auction_data?.mode || "reverse",
          title: fullData.title || fullData.rfq_title,
          endTime: fullData.close_date_time,
          startTime: fullData.open_date_time,
          invited: Array.isArray(fullData.vendors)
            ? fullData.vendors.map((v) => v.email).filter(Boolean)
            : existingData?.auction_data?.invited || [],
          auction_number: fullData.auction_number,
        };

        updatedData.auction_data = auctionPayload;
      }

      await existing.update(
        {
          rfq_number: fullData.rfq_number,
          auction_number: fullData.auction_number || null,
          form_type: fullData.form_type || null,
          rfq_type: fullData.rfq_type || null,
          status: fullData.status || null,
          quote_count: fullData.quote_count || 0,
          data: updatedData,
        },
        { transaction: t },
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
        { transaction: t },
      );

      if (identifier === "auction_number") {
        //Here need to call socks controller and  create an auction_data object and update data object with that

        const auctionPayload = {
          id: "",
          bids: {},
          mode: fullData.type || "reverse",
          title: fullData.title || fullData.rfq_title,
          buyerId: "",
          endTime: fullData.close_date_time,
          invited: Array.isArray(fullData.vendors)
            ? fullData.vendors.map((v) => v.email).filter(Boolean)
            : [],
          startTime: fullData.open_date_time,
          auction_number: fullData.auction_number,
        };

        //console.log("Creating auction with payload:", auctionPayload);

        const rfqRecord = await RfqData.findOne({
          where: { rfq_number: fullData.rfq_number },
          transaction: t,
        });

        const existingData = rfqRecord.data || {};

        await rfqRecord.update(
          {
            status: "auctioned",
            form_type: "auctioned",
            data: {
              ...existingData,
              auction_data: auctionPayload,
            },
          },
          { transaction: t },
        );
      }
    }

    await t.commit();
    if (
      fullData?.vendors?.length &&
      fullData.form_type != "draft" &&
      identifier !== "auction_number"
    ) {
      //console.log("Scheduling vendor invitations...", fullData.form_type);
      fullData.vendors.forEach((vendor) => {
        sendVendorInvitation(vendor.email, vendor.name, fullData.title);
      });
      await sendBuyerConfirmationEmail(
        fullData.buyer.email,
        fullData.buyer.name,
        rfqData.title,
        fullData.vendors,
      );
    }
    return res
      .status(200)
      .json({ isSuccess: true, message: "RFQ saved successfully" });
  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
    }
    console.error("Error in createRFQ:", error);
    return res.status(500).json({ isSuccess: false, error: error.message });
  }
};

const getAllRFQs = async (req, res) => {
  try {
    const { email } = req.query;
    const rfqs = await RfqData.findAll({
      where: { is_deleted: false },
      order: [["createdAt", "DESC"]],
    });
    let formatted = rfqs.map((entry) => entry.data);
    if (email) {
      //console.log("Filtering RFQs by vendor email:", email);
      formatted = formatted.filter(
        (rfq) =>
          Array.isArray(rfq.vendors) &&
          rfq.vendors.some(
            (vendor) => vendor.email?.toLowerCase() === email.toLowerCase(),
          ),
      );
    }
    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching RFQs:", error);
    res.status(500).json({ error: "Failed to load RFQs" });
  }
};

const getRFQById = async (req, res) => {
  const { id } = req.params;

  //console.log("Get RFQ Data with id:", id);

  try {
    const rfqRecord = await RfqData.findOne({
      where: { rfq_number: id },
    });

    if (!rfqRecord) {
      throw new Error("RFQ record not found");
    }

    return res.json({ isSuccess: true, rfqRecord });
  } catch (error) {
    return res.status(500).json({
      isSuccess: false,
      error: error.message,
    });
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
