const { QuotesData, RfqData } = require("../models");
const { Op } = require("sequelize");

const getQuoteSummary = async (req, res) => {
  try {
    const rfqs = await RfqData.findAll();
    const quotes = await QuotesData.findAll();

    const response = rfqs.map((rfq) => {
      const rfqQuotes = quotes
        .filter((q) => q.rfq_id === rfq.rfq_number)
        .map((q) => q.data);

      const vendorsSummary = rfqQuotes.map((quoteEntry) => {
        const vendor = (rfq.data?.vendors || []).find(
          (v) => v.id == quoteEntry.vendor_id
        );
        const total = (quoteEntry.quotes || []).reduce(
          (sum, q) => sum + (q.quoted_price || 0),
          0
        );

        return {
          vendor_id: vendor?.id || quoteEntry.vendor_id,
          vendor_name: vendor?.name || `Vendor ${quoteEntry.vendor_id}`,
          company: vendor?.company || "-",
          email: vendor?.email || "",
          quotes: quoteEntry.quotes || [],
          total,
        };
      });

      const ranked = vendorsSummary
        .sort((a, b) => a.total - b.total)
        .map((v, idx) => ({ ...v, rank: `L${idx + 1}`, winner: idx === 0 }));

      return {
        rfq_number: rfq.rfq_number,
        title: rfq.data?.title,
        description: rfq.data?.description,
        rfq_items: rfq.data?.rfq_items || [],
        vendors: ranked,
      };
    });

    res.json(response);
  } catch (error) {
    console.error("Error processing quote summary:", error.message);
    res.status(500).json({ error: "Unable to process quote summary" });
  }
};

const getQuoteSummaryById = async (req, res) => {
  const rfqId = req.params.rfq_id;

  try {
    const rfq = await RfqData.findOne({ where: { rfq_number: rfqId } });
    if (!rfq) return res.status(404).json({ error: "RFQ not found" });

    const rfqQuotesRaw = await QuotesData.findAll({
      where: { rfq_id: rfqId },
      order: [["createdAt", "ASC"]],
    });

    const rfqQuotes = rfqQuotesRaw.map((q) => q.data);

    const itemRankMap = {};
    const packageRankMap = {};

    rfqQuotes.forEach((entry) => {
      const quoteEntries =
        Array.isArray(entry.quotes) && entry.quotes.length > 0
          ? entry.quotes
          : Array.isArray(entry.road_transport_quotes)
          ? entry.road_transport_quotes
          : [];

      quoteEntries.forEach((q) => {
        const itemId = q.item_id || q.row_id;
        if (!itemId) return;

        if (!itemRankMap[itemId]) itemRankMap[itemId] = [];
        itemRankMap[itemId].push({
          vendor_id: entry.vendor_id,
          quoted_price: q.quoted_price,
        });
      });

      (entry?.package_quotes || []).forEach((pkg) => {
        const shipmentIndex = pkg.shipment_index;
        (pkg.quotes || []).forEach((q) => {
          const key = `${shipmentIndex}_${q.airline_name || q.sealine_name}`;
          if (!packageRankMap[key]) packageRankMap[key] = [];
          packageRankMap[key].push({
            vendor_id: entry.vendor_id,
            total: parseFloat(q.total_charges || 0),
          });
        });
      });
    });

    const itemRanks = {};
    for (const item_id in itemRankMap) {
      const sorted = itemRankMap[item_id].sort(
        (a, b) => a.quoted_price - b.quoted_price
      );
      sorted.forEach((entry, idx) => {
        itemRanks[`${entry.vendor_id}_${item_id}`] = `L${idx + 1}`;
      });
    }

    const packageRanks = {};
    for (const key in packageRankMap) {
      const sorted = packageRankMap[key].sort((a, b) => a.total - b.total);
      sorted.forEach((entry, idx) => {
        packageRanks[`${entry.vendor_id}_${key}`] = `L${idx + 1}`;
      });
    }

    const vendorsSummary = rfqQuotes.map((entry) => {
      const vendor = rfq.data?.vendors?.find((v) => v.id == entry.vendor_id);

      const quoteEntries =
        Array.isArray(entry.quotes) && entry.quotes.length > 0
          ? entry.quotes
          : Array.isArray(entry.road_transport_quotes)
          ? entry.road_transport_quotes
          : [];

      const quotesWithRank = quoteEntries.map((q) => {
        const id = q.item_id || q.row_id;
        return {
          ...q,
          rank: itemRanks[`${entry.vendor_id}_${id}`] || "-",
        };
      });

      const total = quotesWithRank.reduce(
        (sum, q) => sum + (q.quoted_price || 0),
        0
      );

      const packageQuotesWithRank = (entry.package_quotes || []).map((pkg) => ({
        ...pkg,
        quotes: (pkg.quotes || []).map((q) => {
          const key = `${pkg.shipment_index}_${
            q.airline_name || q.sealine_name
          }`;
          return {
            ...q,
            rank: packageRanks[`${entry.vendor_id}_${key}`] || "-",
          };
        }),
      }));

      return {
        vendor_id: vendor?.id || entry.vendor_id,
        vendor_name: vendor?.name || `Vendor ${entry.vendor_id}`,
        company: vendor?.company || "-",
        email: vendor?.email || "",
        quotes: quotesWithRank,
        package_quotes: packageQuotesWithRank,
        negotiation: entry.negotiation || {},
        total,
      };
    });

    const isShipmentBased = rfqQuotes.some(
      (q) =>
        Array.isArray(q.package_quotes) &&
        q.package_quotes.length > 0 &&
        q.package_quotes[0].shipment_index !== undefined
    );

    if (isShipmentBased) {
      const shipmentMap = {};

      rfqQuotes.forEach((entry) => {
        const vendor = rfq.data?.vendors?.find((v) => v.id == entry.vendor_id);
        (entry.package_quotes || []).forEach((pkg) => {
          const index = pkg.shipment_index;
          if (!shipmentMap[index]) shipmentMap[index] = [];

          (pkg.quotes || []).forEach((q) => {
            shipmentMap[index].push({
              vendor_id: vendor?.id || entry.vendor_id,
              vendor_name: vendor?.name || `Vendor ${entry.vendor_id}`,
              vendor_email: vendor?.email || "",
              ...q,
              total: parseFloat(q.total_charges || 0),
            });
          });
        });
      });

      const shipmentSummary = Object.entries(shipmentMap).map(
        ([index, quotes]) => {
          const sorted = quotes.slice().sort((a, b) => a.total - b.total);
          const ranked = sorted.map((q, idx) => ({
            ...q,
            rank: `L${idx + 1}`,
          }));
          return {
            shipment_index: Number(index),
            quotes: ranked,
          };
        }
      );

      return res.json({
        rfq_number: rfq.rfq_number,
        title: rfq.data?.title,
        description: rfq.data?.description,
        shipments: shipmentSummary,
        isShipmentBased: true,
        shipmentType: rfq.data?.subindustry,
      });
    }

    const rankedByTotal = vendorsSummary
      .slice()
      .sort((a, b) => a.total - b.total)
      .map((v, idx) => ({ ...v, rank: `L${idx + 1}`, winner: idx === 0 }));

    res.json({
      rfq_number: rfq.rfq_number,
      title: rfq.data?.title,
      description: rfq.data?.description,
      rfq_items: rfq.data?.rfq_items || [],
      vendors: rankedByTotal,
    });
  } catch (error) {
    console.error("Error fetching RFQ summary:", error.message);
    res.status(500).json({ error: "Unable to process RFQ quote summary" });
  }
};

const updateRfqStatus = async (req, res) => {
  const { rfq_number, action } = req.body;

  try {
    const rfq = await RfqData.findOne({ where: { rfq_number } });
    if (!rfq) return res.status(404).json({ error: "RFQ not found" });

    let status = "";
    switch (action) {
      case "accept_l1":
        status = "accepted";
        break;
      case "negotiate":
        status = "negotiation";
        break;
      case "auction":
        status = "auctioned";
        break;
      case "reject":
        status = "rejected";
        break;
      default:
        return res.status(400).json({ error: "Invalid action" });
    }

    const updatedData = {
      ...(rfq.data || {}),
      status,
    };

    await rfq.update({ status, data: updatedData });

    if (status === "negotiation") {
      const { negotiations = [] } = req.body;
      console.log("Negotiations data:", negotiations);
      const allQuotes = await QuotesData.findAll({
        where: { rfq_id: rfq_number },
      });
      for (const quote of allQuotes) {
        const qData = { ...quote.data };

        const negotiationEntry = negotiations.find(
          (n) => n.vendor_id == quote.vendor_id
        );

        if (negotiationEntry) {
          qData.negotiation = {
            last_purchase_price: negotiationEntry.last_purchase_price,
            remarks: negotiationEntry.remarks,
            requested_at: new Date(),
          };

          if (Array.isArray(qData.quotes)) {
            qData.quotes = qData.quotes.map((q) => ({
              ...q,
              status: "negotiation_requested",
            }));
          }

          await quote.update({ data: qData });
        }
      }
    }

    return res.json({ isSuccess: true, updatedStatus: status });
  } catch (err) {
    console.error("Error updating RFQ status:", err.message);
    return res.status(500).json({ error: "Failed to update RFQ status" });
  }
};

module.exports = {
  getQuoteSummary,
  getQuoteSummaryById,
  updateRfqStatus,
};
