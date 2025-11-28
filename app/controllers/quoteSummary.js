const { QuotesData, RfqData } = require("../models");
//const { Op } = require("sequelize");
const { Op, Sequelize } = require("sequelize");
const mailQueue = require("../queues/mailQueue");
const {
  sendVendorNegotiationMail,
  sendBuyerNegotiationConfirmationMail,
  sendVendorQuoteAcceptedMail,
  sendBuyerQuoteAcceptanceConfirmationMail,
  sendHodApprovalRequestedMail,
  sendHodApprovedMail,
  sendHodRejectedMail,
} = require("../queues/mailer");

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
            total: parseFloat(q.grandTotalValue || 0),
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
              total: parseFloat(q.grandTotalValue || 0),
              negotiation: entry.negotiation,
              acceptedDetails: entry.acceptedDetails || {},
              hodAcceptRequestDetails: entry.hodAcceptRequestDetails || {},
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
        country: rfq.data?.country,
        subindustry: rfq.data?.subindustry,
        type: rfq.data?.type,
        hideCurrentBidPrice: rfq.data?.hide_current_bid_price,
        createdDate: rfq.createdAt,
        openDateTime: rfq.data?.open_date_time,
        closeDateTime: rfq.data?.close_date_time,
        shipments: shipmentSummary,
        isShipmentBased: true,
        eximMode: rfq.data?.exim_mode,
        movement_type:
          "Airport (" +
          rfq.data?.origin_airport +
          ") to " +
          " Airport (" +
          rfq.data?.destination_airport +
          ")",
        incoterm_exp_air: rfq.data?.incoterm_exp_air,
        origin_airport: rfq.data?.origin_airport,
        destination_airport: rfq.data?.destination_airport,
        origin_address: rfq.data?.origin_address,
        destination_address: rfq.data?.destination_address,
        stuffing_location: rfq.data?.factoryLocation,
        destuffing_location: rfq.data?.destuffing_location,
        material: rfq.data?.material,
        hs_code: rfq.data?.hs_code,
        totalGrossWeight: rfq.data?.package_summary?.totalGrossWeight,
        totalVolumetricWeight: rfq.data?.package_summary?.totalVolumetricWeight,
        value_of_shipment: rfq.data?.package_summary?.value_of_shipment,
        volumetricFactor: rfq.data?.package_summary?.volumetricFactor,
        package_summary: rfq.data?.package_summary,
        shipmentType: rfq.data?.subindustry,
        vendors: rfqQuotes.map((entry) => {
          const vendor = rfq.data?.vendors?.find(
            (v) => v.id == entry.vendor_id
          );
          return {
            vendor_id: vendor?.id || entry.vendor_id,
            vendor_name: vendor?.name || `Vendor ${entry.vendor_id}`,
            company: vendor?.company || "-",
            email: vendor?.email || "",
            package_quotes: entry.package_quotes || [],
            negotiation: entry?.negotiation || {},
            quotes: entry.quotes || [],
          };
        }),
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
      case "requested_hod_approval":
        status = "requested_hod_approval";
        break;
      case "hod_approved":
        status = "hod_approved";
        break;
      case "hod_rejected":
        status = "hod_rejected";
        break;
      default:
        return res.status(400).json({ error: "Invalid action" });
    }

    const updatedData = {
      ...(rfq.data || {}),
      status,
    };

    await rfq.update({ status, data: updatedData });
    if (status === "hod_approved") {
      const requestedForHodApprovalQuote = await QuotesData.findOne({
        where: { rfq_id: rfq_number, vendor_id: req.body.vendors[0] },
      });
      if (!requestedForHodApprovalQuote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      const qData = { ...requestedForHodApprovalQuote.data };
      qData.hodAcceptRequestDetails = {
        requested_airline: req.body.requestedAirline[0] || "",
        remarks: qData.hodAcceptRequestDetails.remarks || "",
        accepted_at: qData.hodAcceptRequestDetails.accepted_at || "",
        status: "hod_approved",
        hod_msg: req.body.hod_msg || "",
        hod_approved_on: new Date(),
        hod_email: req.body.hod_email || "",
        hod_name: req.body.hod_name || "",
      };
      await requestedForHodApprovalQuote.update({ data: qData });

      const rfqRecordtst = await RfqData.findOne({
        where: { rfq_number: rfq_number },
      });
      try {
        await sendHodApprovedMail(
          rfqRecordtst?.data?.buyer?.email,
          rfqRecordtst?.data?.buyer?.name,
          rfq_number,
          req.body.requestedAirline[0],
          req.body.hod_name,
          req.body.hod_msg
        );

        console.log(
          `📩 HOD Approval mail sent to buyer: ${rfqRecordtst?.data?.buyer?.email}`
        );
      } catch (err) {
        console.error(
          `❌ Failed to send HOD Approval mail to ${rfqRecordtst?.data?.buyer?.email}`,
          err.message
        );
      }
    }
    if (status === "hod_rejected") {
      const requestedForHodApprovalQuote = await QuotesData.findOne({
        where: { rfq_id: rfq_number, vendor_id: req.body.vendors[0] },
      });
      if (!requestedForHodApprovalQuote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      const qData = { ...requestedForHodApprovalQuote.data };
      qData.hodAcceptRequestDetails = {
        requested_airline: req.body.requestedAirline[0] || "",
        remarks: qData.hodAcceptRequestDetails.remarks || "",
        accepted_at: qData.hodAcceptRequestDetails.accepted_at || "",
        status: "hod_rejected",
        hod_msg: req.body.hod_msg || "",
        hod_rejected_on: new Date(),
        hod_email: req.body.hod_email || "",
        hod_name: req.body.hod_name || "",
      };
      await requestedForHodApprovalQuote.update({ data: qData });
      const rfqRecordtst = await RfqData.findOne({
        where: { rfq_number: rfq_number },
      });
      try {
        await sendHodRejectedMail(
          rfqRecordtst?.data?.buyer?.email,
          rfqRecordtst?.data?.buyer?.name,
          rfq_number,
          req.body.requestedAirline[0],
          req.body.hod_name,
          req.body.hod_msg
        );

        console.log(
          `📩 HOD Rejected mail sent to buyer: ${rfqRecordtst?.data?.buyer?.email}`
        );
      } catch (err) {
        console.error(
          `❌ Failed to send HOD Rejected mail to ${rfqRecordtst?.data?.buyer?.email}`,
          err.message
        );
      }
    }
    if (status === "requested_hod_approval") {
      const requestedForHodApprovalQuote = await QuotesData.findOne({
        where: { rfq_id: rfq_number, vendor_id: req.body.vendors[0] },
      });
      if (!requestedForHodApprovalQuote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      const qData = { ...requestedForHodApprovalQuote.data };
      qData.hodAcceptRequestDetails = {
        requested_airline: req.body.requestedAirline[0] || "",
        remarks: req.body.remarks || "",
        accepted_at: new Date(),
        status: "requested_hod_approval",
        hod_email: req.body.hod_email || "",
        hod_name: req.body.hod_name || "",
      };
      await requestedForHodApprovalQuote.update({ data: qData });
      const rfqRecordtst = await RfqData.findOne({
        where: { rfq_number: rfq_number },
      });
      try {
        await sendHodApprovalRequestedMail(
          req.body.hod_email,
          req.body.hod_name,
          rfq_number,
          req.body.requestedAirline[0],
          rfqRecordtst?.data?.buyer?.name,
          req.body.remarks
        );

        console.log(
          `📩 HOD Approval Requested mail sent to ${req.body.hod_email}`
        );
      } catch (err) {
        console.error(
          `❌ Failed to send HOD Approval Requested mail to ${req.body.hod_email}`,
          err.message
        );
      }
    }

    if (status === "accepted") {
      const acceptedVendorQuote = await QuotesData.findOne({
        where: { rfq_id: rfq_number, vendor_id: req.body.vendors[0] },
      });
      if (!acceptedVendorQuote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      const qData = { ...acceptedVendorQuote.data };
      qData.acceptedDetails = {
        accepted_airline: req.body.acceptedAirline[0] || "",
        remarks: req.body.remarks || "",
        accepted_at: new Date(),
        vendor_id: req.body.vendors[0],
      };
      await acceptedVendorQuote.update({ data: qData });

      // Send Quote Confirmation email to vendor
      const rfqRecordtst = await RfqData.findOne({
        where: { rfq_number: rfq_number },
      });
      const existingVendors = rfqRecordtst.data.vendors || [];
      console.log("Existing vendors:", existingVendors);
      const vendor = existingVendors.find((v) => v.id == req.body.vendors[0]);
      console.log("Vendor email for quote confirmation:", vendor);

      try {
        await sendVendorQuoteAcceptedMail(
          vendor.email,
          vendor.name,
          rfq_number
        );
        console.log(`📩 Quote Confirmation mail sent to ${vendor.email}`);
      } catch (err) {
        console.error(
          `❌ Failed to send Quote Confirmation mail to ${vendor.email}`,
          err.message
        );
      }
      await sendBuyerQuoteAcceptanceConfirmationMail(
        rfqRecordtst?.data?.buyer?.email,
        rfqRecordtst?.data?.buyer?.name,
        rfq_number,
        vendor.name
      );
    }

    // if (status === "negotiation") {
    //   const { negotiations = [] } = req.body;
    //   console.log("Negotiations data:", negotiations);
    //   const allQuotes = await QuotesData.findAll({
    //     where: { rfq_id: rfq_number },
    //   });
    //   for (const quote of allQuotes) {
    //     const qData = { ...quote.data };

    //     if (!Array.isArray(qData.negotiation)) {
    //       qData.negotiation = [];
    //       negotiations.forEach((neg) => {
    //         // Only push if vendor_id matches qData.vendor_id
    //         if (qData.vendor_id === neg.vendor_id) {
    //           qData.negotiation.push({
    //             ...neg,
    //             requested_at: new Date(),
    //           });
    //           console.log(
    //             `🟢 Added negotiation for vendor ${neg.vendor_id}, airline: ${neg.airline_name}`
    //           );
    //         } else {
    //           console.log(
    //             `⚪ Skipped negotiation for vendor ${neg.vendor_id} (not matching qData.vendor_id ${qData.vendor_id})`
    //           );
    //         }
    //       });
    //       await quote.update({ data: qData });
    //       continue;
    //     }

    //     const negotiationEntryIndex = qData.negotiation.find((n) => {
    //       console.log("Comparing negotiation entries:", n.airline_name);
    //       let aaa;
    //       if (
    //         n.airline_name ===
    //         negotiations.some((ne) => {
    //           console.log("Negotiation airline name:", ne.airline_name);
    //           ne.airline_name;
    //         })
    //       ) {
    //         aaa = n.airline_name;
    //         //return n;
    //       }
    //       console.log("aaa value", aaa);
    //     });

    //     console.log("Negotiation entry index:", negotiationEntryIndex);

    //     if (negotiationEntryIndex) {
    //       // 🔁 Update existing negotiation entry
    //       qData.negotiation[negotiationEntryIndex] = {
    //         ...qData.negotiation[negotiationEntryIndex],
    //         ...negotiations.find(
    //           (n) =>
    //             n.vendor_id === quote.vendor_id &&
    //             n.airline_name === quote.airline_name
    //         ),
    //         updated_at: new Date(),
    //       };
    //       console.log(
    //         "🟡 Negotiation updated:",
    //         qData.negotiation[negotiationEntryIndex]
    //       );
    //     } else {
    //       // ➕ Add new negotiation entries
    //       qData.negotiation.push(
    //         ...negotiations.map((entry) => ({
    //           ...entry,
    //           requested_at: new Date(),
    //         }))
    //       );
    //       console.log("🟢 New negotiations added:", negotiations);
    //     }

    //     if (negotiationEntry) {
    //       // const negotiationArray = Array.isArray(negotiationEntry)
    //       //   ? negotiationEntry
    //       //   : [negotiationEntry];

    //       // const newNegotiations = negotiationArray.map((entry) => ({
    //       //   vendor_id: entry.vendor_id,
    //       //   airline_name: entry.airline_name,
    //       //   last_purchase_price: entry.last_purchase_price,
    //       //   remarks: entry.remarks,
    //       //   requested_at: new Date(),
    //       // }));

    //       // console.log("New negotiations to be added:", newNegotiations);

    //       // 🟢 Merge with existing negotiations (if any)
    //       // const existingNegotiations = Array.isArray(qData.negotiation)
    //       //   ? qData.negotiation
    //       //   : [];

    //       // qData.negotiation = [...existingNegotiations, ...newNegotiations];

    //       // if (!Array.isArray(qData.negotiation)) {
    //       //   qData.negotiation = [];
    //       // }

    //       // if (Array.isArray(negotiationArray) && negotiationArray.length > 0) {
    //       //   qData.negotiation = negotiations;
    //       // }

    //       if (Array.isArray(qData.quotes)) {
    //         qData.quotes = qData.quotes.map((q) => ({
    //           ...q,
    //           status: "negotiation_requested",
    //         }));
    //       }

    //       await quote.update({ data: qData });

    //       // ✅ Send negotiation email to vendor
    //       const rfqRecordtst = await RfqData.findOne({
    //         where: { rfq_number: rfq_number },
    //       });
    //       const existingVendors = rfqRecordtst.data.vendors || [];
    //       console.log("Existing vendors:", existingVendors);
    //       const vendor = existingVendors.find(
    //         (v) => v.id == negotiationEntry.vendor_id
    //       );
    //       console.log("Vendor email for negotiation:", vendor);

    //       try {
    //         await sendVendorNegotiationMail(
    //           vendor.email,
    //           vendor.name,
    //           rfq_number,
    //           negotiationEntry.last_purchase_price,
    //           negotiationEntry.remarks
    //         );
    //         console.log(`📩 Negotiation mail sent to ${vendor.email}`);
    //       } catch (err) {
    //         console.error(
    //           `❌ Failed to send negotiation mail to ${vendor.email}`,
    //           err.message
    //         );
    //       }
    //       await sendBuyerNegotiationConfirmationMail(
    //         rfqRecordtst?.data?.buyer?.email,
    //         rfqRecordtst?.data?.buyer?.name,
    //         rfq_number,
    //         vendor.name
    //       );
    //     }
    //   }
    // }

    if (status === "negotiation") {
      const { negotiations = [] } = req.body;
      console.log("📥 Incoming Negotiations:", negotiations);

      const allQuotes = await QuotesData.findAll({
        where: { rfq_id: rfq_number },
      });

      for (const quote of allQuotes) {
        const qData = { ...quote.data };
        const vendorId = qData.vendor_id;

        // Ensure negotiation array exists
        if (!Array.isArray(qData.negotiation)) qData.negotiation = [];

        // Filter negotiations belonging to this vendor
        const vendorNegotiations = negotiations.filter(
          (n) => n.vendor_id === vendorId
        );

        if (vendorNegotiations.length === 0) continue;

        for (const neg of vendorNegotiations) {
          const existingIndex = qData.negotiation.findIndex(
            (n) => n.airline_name === neg.airline_name
          );

          console.log("existing index value:", existingIndex);

          if (existingIndex >= 0) {
            // 🔁 Update existing negotiation
            const updatedNegotiation = {
              ...qData.negotiation[existingIndex],
              ...neg,
              updated_at: new Date(),
            };
            qData.negotiation[existingIndex] = updatedNegotiation;
            await quote.update({ data: updatedNegotiation });
            console.log(
              `🟡 Updated negotiation for vendor ${vendorId}, airline ${neg.airline_name}`
            );
          } else {
            // ➕ Add new negotiation
            // qData.negotiation.push({
            //   ...neg,
            //   requested_at: new Date(),
            // });
            const newNegotiation = {
              ...neg,
              requested_at: new Date(),
            };
            qData.negotiation.push(newNegotiation);
            //qData.negotiation[existingIndex] = updatedNegotiation;
            //await quote.update({ data: qData });
            quote.set("data", qData);
            quote.changed("data", true);
            await quote.save();
            console.log(
              `🟢 Added new negotiation for vendor ${vendorId}, airline ${neg.airline_name}`
            );
          }
        }

        // 🧾 Optionally mark quote status
        if (Array.isArray(qData.quotes)) {
          qData.quotes = qData.quotes.map((q) => ({
            ...q,
            status: "negotiation_requested",
          }));
        }

        // 💾 Save changes
        await quote.update({ data: qData });

        // ✉️ Send mails (optional)
        const rfqRecord = await RfqData.findOne({ where: { rfq_number } });
        const existingVendors = rfqRecord?.data?.vendors || [];
        const vendor = existingVendors.find((v) => v.id == vendorId);

        if (vendor) {
          for (const neg of vendorNegotiations) {
            try {
              await sendVendorNegotiationMail(
                vendor.email,
                vendor.name,
                rfq_number,
                neg.last_purchase_price,
                neg.remarks
              );
              console.log(`📩 Mail sent to ${vendor.email}`);
            } catch (err) {
              console.error(`❌ Failed mail for ${vendor.email}:`, err.message);
            }
          }

          await sendBuyerNegotiationConfirmationMail(
            rfqRecord?.data?.buyer?.email,
            rfqRecord?.data?.buyer?.name,
            rfq_number,
            vendor.name
          );
        }
      }
    }

    return res.json({ isSuccess: true, updatedStatus: status });
  } catch (err) {
    console.error("Error updating RFQ status:", err.message);
    return res.status(500).json({ error: "Failed to update RFQ status" });
  }
};

const getPreviousAuctionsByCountryAndWeight = async (req, res) => {
  console.log("reached backend for country and weight");
  const { country, totalGrossWeight } = req.params;

  console.log("country:", country, "totalGrossWeight:", totalGrossWeight);

  if (!country || !totalGrossWeight) {
    return res
      .status(400)
      .json({ error: "country and totalGrossWeight are required" });
  }

  try {
    // Fetch RFQs that match country and are within ±500 of weight
    const rfqs = await RfqData.findAll();

    console.log("Fetched RFQs with country matched:", rfqs.length);

    const matchingRfqs = rfqs.filter((rfq) => {
      const rfqCountry = rfq.data?.country;
      const rfqWeightStr = rfq.data?.package_summary?.totalGrossWeight;

      if (!rfqWeightStr || parseFloat(rfqWeightStr) === 0) return false;

      const rfqWeight = parseFloat(
        rfq.data?.package_summary?.totalGrossWeight || 0
      );
      const targetWeight = parseFloat(totalGrossWeight);

      // Must match country and be within ±500 of target weight
      return (
        rfqCountry === country &&
        rfqWeight >= targetWeight - 500 &&
        rfqWeight <= targetWeight + 500
      );
    });

    if (matchingRfqs.length === 0) {
      return res.json([]);
    }

    // Fetch all matching RFQ numbers' quotes
    const rfqNumbers = matchingRfqs.map((r) => r.rfq_number);
    const quotes = await QuotesData.findAll({
      where: {
        rfq_id: { [Op.in]: rfqNumbers },
      },
    });

    // Build response similar to getQuoteSummaryById
    const result = matchingRfqs.map((rfq) => {
      const rfqQuotes = quotes
        .filter((q) => q.rfq_id === rfq.rfq_number)
        .map((q) => q.data);

      return {
        rfq_number: rfq.rfq_number,
        shipment_number: rfq.data?.buyer?.preshipmentnumber
          ? rfq.data?.buyer?.preshipmentnumber
          : rfq.data?.buyer?.postshipmentnumber,
        title: rfq.data?.title,
        description: rfq.data?.description,
        country: rfq.country,
        totalGrossWeight: rfq.data?.package_summary?.totalGrossWeight,
        vendors: rfqQuotes.map((entry) => {
          const vendor = rfq.data?.vendors?.find(
            (v) => v.id == entry.vendor_id
          );
          return {
            vendor_id: vendor?.id || entry.vendor_id,
            vendor_name: vendor?.name || `Vendor ${entry.vendor_id}`,
            company: vendor?.company || "-",
            email: vendor?.email || "",
            package_quotes: entry.package_quotes || [],
            quotes: entry.quotes || [],
          };
        }),
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching previous auctions:", error.message);
    res.status(500).json({ error: "Unable to fetch previous auctions" });
  }
};

module.exports = {
  getQuoteSummary,
  getQuoteSummaryById,
  updateRfqStatus,
  getPreviousAuctionsByCountryAndWeight,
};
