const {
  RFQ,
  RFQItem,
  RFQTransportAir,
  RFQTransportSea,
  User,
} = require("../models");
const fs = require("fs");
const path = require("path");
const mailQueue = require("../queues/mailQueue");
const { QuotesData } = require("../models");
const { RfqData } = require("../models");
const { Op } = require("sequelize");

const createQuote = async (req, res) => {
  try {
    const { rfq_id, vendor_id, quotes, road_transport_quotes, package_quotes } =
      req.body;

    if (!rfq_id || !vendor_id) {
      return res
        .status(400)
        .json({ error: "RFQ ID and Vendor ID are required." });
    }

    const hasValidQuotes =
      (Array.isArray(quotes) && quotes.length > 0) ||
      (Array.isArray(road_transport_quotes) &&
        road_transport_quotes.length > 0) ||
      (Array.isArray(package_quotes) && package_quotes.length > 0);

    if (!hasValidQuotes) {
      return res.status(400).json({
        error:
          "At least one of 'quotes', 'road_transport_quotes', or 'package_quotes' must be a non-empty array.",
      });
    }

    const existing = await QuotesData.findOne({ where: { rfq_id, vendor_id } });

    if (existing) {
      const current = existing.data || {};

      let updatedPackageQuotes = Array.isArray(current.package_quotes)
        ? [...current.package_quotes]
        : [];

      if (Array.isArray(package_quotes) && package_quotes.length > 0) {
        for (const newPkg of package_quotes) {
          const shipmentIndex = newPkg.shipment_index;
          const existingIndex = updatedPackageQuotes.findIndex(
            (pkg) => pkg.shipment_index === shipmentIndex
          );

          if (existingIndex !== -1) {
            updatedPackageQuotes[existingIndex] = newPkg;
          } else {
            updatedPackageQuotes.push(newPkg);
          }
        }
      }

      const updatedQuotes = Array.isArray(quotes)
        ? quotes
        : current.quotes || [];
      const updatedRoadQuotes = Array.isArray(road_transport_quotes)
        ? road_transport_quotes
        : current.road_transport_quotes || [];

      const updatedData = {
        ...current,
        quotes: updatedQuotes,
        package_quotes: updatedPackageQuotes,
        road_transport_quotes: updatedRoadQuotes,
      };

      await existing.update({ data: updatedData });
    } else {
      const payload = {
        rfq_id,
        vendor_id,
        data: {
          rfq_id,
          vendor_id,
          quotes: quotes || [],
          package_quotes: package_quotes || [],
          road_transport_quotes: road_transport_quotes || [],
        },
      };
      await QuotesData.create(payload);
    }

    const rfqRecord = await RfqData.findOne({ where: { rfq_number: rfq_id } });

    if (rfqRecord) {
      const existingQuotes = await QuotesData.findAll({ where: { rfq_id } });
      const vendorCount = new Set(existingQuotes.map((q) => q.vendor_id)).size;

      const updatedStatus = "received_quotes";
      const updatedFormType = "received_quotes";

      const updatedRfqData = {
        ...(rfqRecord.data || {}),
        status: updatedStatus,
        form_type: updatedFormType,
        quote_count: vendorCount,
      };

      await rfqRecord.update({
        status: updatedStatus,
        form_type: updatedFormType,
        quote_count: vendorCount,
        data: updatedRfqData,
      });
    }

    return res.json({
      isSuccess: true,
      message: "Quote submitted successfully.",
    });
  } catch (err) {
    console.error("Quote Submit Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

const getQuotesByRfq = async (req, res) => {
  const rfqIdOrAuction = req.params.rfqOrAuctionNumber;

  try {
    const quotes = await QuotesData.findAll({
      where: {
        [Op.or]: [
          { rfq_id: rfqIdOrAuction },
          //{ auction_number: rfqIdOrAuction },
        ],
      },
      order: [["createdAt", "DESC"]],
    });

    if (!quotes || quotes.length === 0) {
      return res
        .status(404)
        .json({ error: "No quotes found for the given RFQ/Auction" });
    }

    const response = quotes.map((q) => {
      const result = {
        rfq_id: q.rfq_id,
        vendor_id: q.vendor_id,
      };

      console.log("quote value", q);

      if (q.data.quotes?.length) {
        result.quotes = q.data.quotes;
      }

      if (q.data.package_quotes?.length) {
        result.package_quotes = q.data.package_quotes;
      }

      if (q.data.road_transport_quotes?.length) {
        result.road_transport_quotes = q.data.road_transport_quotes;
      }

      return result;
    });

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching quotes for RFQ:", error);
    res.status(500).json({ error: "Failed to fetch quotes for RFQ" });
  }
};

module.exports = {
  createQuote,
  getQuotesByRfq,
};
