const { User, QuotesData, RfqData } = require("../models");
const { Op, fn, col, where } = require("sequelize");
const sequelize = require("../models").sequelize;
const { Sequelize } = require("sequelize");

module.exports = {
  getSummary: async (req, res) => {
    try {
      const { start, end, companies, users, search } = req.query;

      const where = {
        is_deleted: false,
      };

      const andConditions = [];

      // ✅ DATE FILTER (ALWAYS APPLIED)
      if (start && end) {
        andConditions.push({
          createdAt: {
            [Op.between]: [
              new Date(`${start} 00:00:00`),
              new Date(`${end} 23:59:59`),
            ],
          },
        });
      }

      // ✅ SEARCH FILTER
      if (search && search.trim()) {
        const s = search.trim();
        let conditions = [];

        if (/^\d+$/.test(s)) {
          conditions.push(
            Sequelize.literal(
              `JSON_UNQUOTE(JSON_EXTRACT(data, '$.rfq_number')) LIKE 'RFQ_${s}%'`,
            ),
          );
          conditions.push(
            Sequelize.literal(
              `JSON_UNQUOTE(JSON_EXTRACT(data, '$.auction_data.auction_number')) LIKE 'AUC_${s}%'`,
            ),
          );
        } else if (s.startsWith("RFQ_")) {
          conditions.push(
            Sequelize.literal(
              `JSON_UNQUOTE(JSON_EXTRACT(data, '$.rfq_number')) LIKE '${s}%'`,
            ),
          );
        } else if (s.startsWith("AUC_")) {
          conditions.push(
            Sequelize.literal(
              `JSON_UNQUOTE(JSON_EXTRACT(data, '$.auction_data.auction_number')) LIKE '${s}%'`,
            ),
          );
        }

        if (conditions.length) {
          andConditions.push({ [Op.or]: conditions });
        }
      }

      // ✅ COMPANY FILTER
      if (companies && companies.trim()) {
        const list = companies.split(",").map((c) => c.trim());

        andConditions.push({
          [Op.or]: list.map((company) =>
            Sequelize.literal(
              `JSON_SEARCH(data, 'one', '${company}', NULL, '$.vendors[*].company') IS NOT NULL`,
            ),
          ),
        });
      }

      // ✅ APPLY CONDITIONS
      if (andConditions.length) {
        where[Op.and] = andConditions;
      }

      // 🔹 FETCH RFQs
      let rfqs = await RfqData.findAll({
        where,
        attributes: ["rfq_number", "auction_number", "data"],
      });

      console.log("Total RFQs after filters:", rfqs.length);

      // 🔹 REMOVE DRAFTS HERE
      rfqs = rfqs.filter((rfq) => {
        const formType = rfq?.data?.form_type?.toLowerCase().trim();
        return formType !== "draft";
      });

      console.log("After removing drafts:", rfqs.length);

      // ✅ USER FILTER (Buyer Email)
      if (users && users.trim()) {
        const userList = users.split(",").map((u) => u.trim());

        rfqs = rfqs.filter((rfq) => userList.includes(rfq.data?.buyer?.email));
      }

      // =============================
      // 🔹 SUMMARY CALCULATIONS
      // =============================

      const totalRFQs = rfqs.length;

      const totalRFQIds = rfqs.map((r) => ({
        rfq_number: r.data?.rfq_number || r.rfq_number,
      }));

      let totalAuctions = 0;
      let liveAuctions = 0;
      let closedAuctions = 0;
      let scheduledAuctions = 0;

      const liveAuctionIds = [];
      const closedAuctionIds = [];
      const scheduledAuctionIds = [];
      const totalAuctionIds = [];

      const now = new Date();

      rfqs.forEach((rfq) => {
        const auction = rfq.data?.auction_data;
        if (!auction) return;

        totalAuctions++;

        const startTime = new Date(auction.startTime);
        const endTime = new Date(auction.endTime);

        const item = {
          rfq_number: rfq.rfq_number,
          auction_number: rfq.auction_number,
        };

        totalAuctionIds.push(item);

        if (startTime > now) {
          scheduledAuctions++;
          scheduledAuctionIds.push(item);
        } else if (endTime < now) {
          closedAuctions++;
          closedAuctionIds.push(item);
        } else {
          liveAuctions++;
          liveAuctionIds.push(item);
        }
      });

      const totalQuotes = await QuotesData.count();

      const totalUsers = await User.count({
        where: { role: { [Op.ne]: "vendor" } },
      });

      // =============================
      // ✅ RESPONSE
      // =============================
      return res.json({
        success: true,
        data: {
          totalUsers,
          totalRFQs,
          totalQuotes,
          totalAuctions,
          liveAuctions,
          closedAuctions,
          scheduledAuctions,
          totalRFQIds,
          totalAuctionIds,
          liveAuctionIds,
          closedAuctionIds,
          scheduledAuctionIds,
        },
      });
    } catch (error) {
      console.error("Dashboard Summary Error:", error);
      return res.status(500).json({
        success: false,
        message: "Server Error",
      });
    }
  },

  // -----------------------------------------------------------
  // AUCTION / RFQ ACTIVITY (MAIN ANALYTICS)
  // -----------------------------------------------------------
  getAuctionActivity: async (req, res) => {
    const { start, end, companies } = req.query;

    let dateFilter = { is_deleted: false };

    if (start && end) {
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);

      dateFilter.createdAt = {
        [Op.between]: [startDate, endDate],
      };
    }

    try {
      let rfqs = await RfqData.findAll({
        where: dateFilter,
        order: [["createdAt", "ASC"]],
      });

      if (companies && companies.trim() !== "") {
        const companyList = companies.split(",").map((c) => c.trim());

        rfqs = rfqs.filter((rfq) => {
          const vendors = rfq.data?.vendors || [];

          return vendors.some((v) => companyList.includes(v.company));
        });
      }

      const weeklyData = {};

      rfqs.forEach((rfq) => {
        const week = new Date(rfq.createdAt).toISOString().slice(0, 10);
        weeklyData[week] = (weeklyData[week] || 0) + 1;
      });

      const weeklyActivity = {
        labels: Object.keys(weeklyData),
        data: Object.values(weeklyData),
      };

      let all = await RfqData.findAll({
        where: dateFilter,
      });

      if (companies && companies.trim() !== "") {
        const companyList = companies.split(",").map((c) => c.trim());

        all = all.filter((rfq) => {
          const vendors = rfq.data?.vendors || [];

          return vendors.some((v) => companyList.includes(v.company));
        });
      }

      const industryCount = {};
      all.forEach((rfq) => {
        const industry = rfq.data?.industry || "Unknown";
        industryCount[industry] = (industryCount[industry] || 0) + 1;
      });

      const byIndustry = Object.keys(industryCount).map((key) => ({
        industry: key,
        count: industryCount[key],
      }));

      const transportCount = {};
      all.forEach((rfq) => {
        const t = rfq.data?.subindustry || "Unknown";
        transportCount[t] = (transportCount[t] || 0) + 1;
      });

      const byTransport = Object.keys(transportCount).map((key) => ({
        type: key,
        count: transportCount[key],
      }));

      const recent = await RfqData.findAll({
        where: dateFilter,
        limit: 10,
        order: [["createdAt", "DESC"]],
      });

      const vendorsPerRfq = all
        .map((rfq) => {
          const vendors = rfq.data?.vendors || [];
          return {
            rfq_number: rfq.data?.rfq_number || rfq.rfq_number || "Unknown",
            vendor_count: vendors.length,
            vendors: vendors.map((v) => ({
              id: v.id,
              name: v.name || "Unknown Vendor",
            })),
          };
        })
        .slice(0, 10);

      return res.json({
        success: true,
        data: {
          weekly_activity: weeklyActivity,
          by_industry: byIndustry,
          by_transport: byTransport,
          recent,
          vendors_per_rfq: vendorsPerRfq,
        },
      });
    } catch (error) {
      console.error("Auction Activity Error:", error);
      return res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  getNotifications: async (req, res) => {
    const { start, end } = req.query;

    let dateFilter = {};

    // if (start && end) {
    //   dateFilter.createdAt = {
    //     [Op.between]: [new Date(start), new Date(end)],
    //   };
    // }

    try {
      const notifications = await QuotesData.findAll({
        where: {
          ...dateFilter,
        },
        limit: 10,
        order: [["createdAt", "DESC"]],
      });

      const formatted = notifications.map((item) => {
        const d = item.data || {};
        const hod = d.hodAcceptRequestDetails || {};
        const accepted = d.acceptedDetails || {};

        return {
          id: item.id,
          rfq_id: d.rfq_id,
          vendor: d.company || "Unknown Vendor",
          airline: hod.requested_airline || accepted.accepted_airline || null,
          status: hod.status || null,
          message:
            hod.status === "hod_approved"
              ? `HOD approved ${hod.requested_airline}`
              : hod.status === "hod_rejected"
                ? `HOD rejected ${hod.requested_airline}`
                : hod.requested_airline
                  ? `HOD approval requested for ${hod.requested_airline}`
                  : "New quote update",
          createdAt: item.createdAt,
        };
      });

      return res.json({ success: true, data: formatted });
    } catch (error) {
      console.error("Notifications Error:", error);
      return res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  downloadRfqExcel: async (req, res) => {
    const { start, end } = req.query;

    let dateFilter = { is_deleted: false };

    if (start && end) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(start), new Date(end)],
      };
    }

    try {
      const rfqs = await RfqData.findAll({
        where: dateFilter,
        order: [["createdAt", "DESC"]],
      });

      console.log("RFQ COUNT:", rfqs.length);

      const ExcelJS = require("exceljs");

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("RFQ Report");

      // =======================
      // ✅ DEFINE COLUMNS
      // =======================
      sheet.columns = [
        { header: "RFQ Number", key: "rfq", width: 20 },
        { header: "Title", key: "title", width: 30 },
        { header: "Status", key: "status", width: 20 },
        { header: "RFQ Type", key: "rfq_type", width: 20 },

        { header: "Buyer Name", key: "buyer", width: 25 },
        { header: "Buyer Email", key: "email", width: 30 },

        { header: "Industry", key: "industry", width: 20 },
        { header: "Sub Industry", key: "subindustry", width: 20 },

        { header: "Origin", key: "origin", width: 25 },
        { header: "Destination", key: "destination", width: 25 },

        { header: "Auction Number", key: "auction", width: 20 },

        { header: "Vendor Name", key: "vendor", width: 25 },
        { header: "Vendor Company", key: "company", width: 25 },

        // =======================
        // ✅ PACKAGE QUOTE DETAILS
        // =======================
        { header: "Shipment Index", key: "shipment_index", width: 20 },
        { header: "Airline Name", key: "airline", width: 25 },
        { header: "Airport", key: "airport", width: 20 },
        { header: "Currency", key: "currency", width: 15 },

        { header: "Base Rate", key: "base_rate", width: 15 },
        { header: "Chargeable Weight", key: "chargeable_weight", width: 20 },
        { header: "Gross Weight", key: "gross_weight", width: 20 },
        { header: "Volume Weight", key: "volume_weight", width: 20 },

        { header: "AMS", key: "ams", width: 15 },
        { header: "AWB", key: "awb", width: 15 },
        { header: "PAC", key: "pac", width: 15 },

        { header: "Other Charges", key: "other_charges", width: 20 },
        { header: "DAP/DDP Charges", key: "dap_ddp_charges", width: 20 },

        { header: "Total Charges", key: "total_charges", width: 20 },
        { header: "Grand Total", key: "grand_total", width: 20 },

        { header: "First Bid Price", key: "first_bid_price", width: 20 },

        { header: "Transit Days", key: "transit_days", width: 20 },
        { header: "Rate Validity", key: "rate_validity", width: 20 },

        { header: "Remarks", key: "remarks", width: 30 },

        // =======================
        // ✅ INVOICE DETAILS
        // =======================
        { header: "Invoice Status", key: "invoice_status", width: 20 },
        { header: "Invoice Remarks", key: "invoice_remarks", width: 30 },

        { header: "Freight Amount", key: "freight_amount", width: 20 },
        { header: "DAP Amount", key: "dap_amount", width: 20 },
        { header: "Other Amount", key: "others_amount", width: 20 },
        { header: "Custom Duty Amount", key: "custom_duty_amount", width: 25 },

        {
          header: "Invoice Submitted On",
          key: "invoice_submitted_on",
          width: 25,
        },

        // =======================
        // ✅ HOD DETAILS
        // =======================
        { header: "HOD Status", key: "hod_status", width: 20 },
        { header: "HOD Remarks", key: "hod_remarks", width: 30 },
        { header: "HOD Message", key: "hod_msg", width: 30 },
        { header: "HOD Name", key: "hod_name", width: 20 },
        { header: "HOD Email", key: "hod_email", width: 30 },

        { header: "Requested Airline", key: "requested_airline", width: 25 },

        { header: "Accepted At", key: "accepted_at", width: 25 },
        { header: "HOD Approved On", key: "hod_approved_on", width: 25 },

        // =======================
        // ✅ MARKETING DETAILS
        // =======================
        { header: "Marketing Status", key: "marketing_status", width: 25 },
        { header: "Marketing Remarks", key: "marketing_remarks", width: 30 },
        { header: "Marketing Name", key: "marketing_name", width: 25 },
        { header: "Marketing Email", key: "marketing_email", width: 30 },

        // =======================
        // ✅ BUYER DOCUMENT DETAILS
        // =======================
        { header: "Buyer Doc Status", key: "buyer_doc_status", width: 25 },
        { header: "Buyer Doc Remarks", key: "buyer_doc_remarks", width: 30 },
        { header: "Buyer Vendor Name", key: "buyer_vendor_name", width: 25 },
        { header: "Buyer Vendor Email", key: "buyer_vendor_email", width: 30 },

        { header: "Buyer Airline", key: "buyer_airline", width: 25 },

        { header: "Buyer Submitted At", key: "buyer_submitted_at", width: 25 },
      ];

      // =======================
      // 🔁 LOOP RFQs
      // =======================
      for (const rfq of rfqs) {
        const data = rfq.data || {};

        const baseRow = {
          rfq: data.rfq_number || "",
          title: data.title || "",
          status: data.status || "",
          rfq_type: data.rfq_type || "",

          buyer: data.buyer?.name || "",
          email: data.buyer?.email || "",

          industry: data.industry || "",
          subindustry: data.subindustry || "",

          origin: data.origin_address || "",
          destination: data.destination_address || "",

          auction: data.auction_data?.auction_number || "",
        };

        // =======================
        // 🔹 FETCH QUOTES
        // =======================
        const quotes = await QuotesData.findAll({
          where: {
            rfq_id: data.rfq_number,
          },
        });

        console.log(`RFQ ${data.rfq_number} -> Quotes Count:`, quotes.length);

        if (!quotes.length) {
          sheet.addRow(baseRow);
          continue;
        }

        // =======================
        // 🔁 LOOP QUOTES
        // =======================
        for (const quote of quotes) {
          try {
            const quoteData = quote.data || {};

            console.log(
              "Processing Quote:",
              quote.id,
              JSON.stringify(quoteData, null, 2),
            );

            // =======================
            // ✅ VENDOR
            // =======================
            const vendor =
              data.vendors?.find(
                (v) => String(v.id) === String(quote.vendor_id),
              ) || {};

            // =======================
            // ✅ DETAILS
            // =======================
            const invoice = quoteData.invoiceDetails || {};
            const hod = quoteData.hodAcceptRequestDetails || {};
            const marketing = quoteData.sharedtoMarketingTeamDetails || {};
            const buyerDocs = quoteData.buyerDocumentsUploadedDetails || {};

            // =======================
            // ✅ PACKAGE QUOTES
            // =======================
            const packageQuotes = Array.isArray(quoteData.package_quotes)
              ? quoteData.package_quotes
              : [];

            // =======================
            // 🔁 LOOP PACKAGE QUOTES
            // =======================
            if (packageQuotes.length > 0) {
              for (const pkg of packageQuotes) {
                const quotesArray = Array.isArray(pkg?.quotes)
                  ? pkg.quotes
                  : [];

                if (quotesArray.length > 0) {
                  for (const q of quotesArray) {
                    sheet.addRow({
                      ...baseRow,

                      vendor: vendor?.name || "",
                      company: vendor?.company || "",

                      shipment_index: pkg?.shipment_index ?? "",

                      airline: q?.airline_name || "",
                      airport: q?.airport || "",
                      currency: q?.currency || "",

                      base_rate: q?.base_rate || 0,
                      chargeable_weight: q?.chargeable_weight || 0,
                      gross_weight: q?.gross_weight || "",
                      volume_weight: q?.volume_weight || "",

                      ams: q?.ams || 0,
                      awb: q?.awb || 0,
                      pac: q?.pac || 0,

                      other_charges: q?.other_charges || 0,
                      dap_ddp_charges: q?.dap_ddp_charges || 0,

                      total_charges: q?.total_charges || 0,
                      grand_total: q?.grandTotalValue || 0,

                      first_bid_price: q?.FirstBidPrice || 0,

                      transit_days: q?.transit_days || "",
                      rate_validity: q?.rate_validity || "",

                      remarks: q?.remarks || "",

                      // =======================
                      // ✅ INVOICE
                      // =======================
                      invoice_status: invoice?.status || "",
                      invoice_remarks: invoice?.remarks || "",

                      freight_amount: invoice?.freight_amount || 0,
                      dap_amount: invoice?.dap_amount || 0,
                      others_amount: invoice?.others_amount || 0,
                      custom_duty_amount: invoice?.custom_duty_amount || 0,

                      invoice_submitted_on: invoice?.submitted_on || "",

                      // =======================
                      // ✅ HOD
                      // =======================
                      hod_status: hod?.status || "",
                      hod_remarks: hod?.remarks || "",
                      hod_msg: hod?.hod_msg || "",
                      hod_name: hod?.hod_name || "",
                      hod_email: hod?.hod_email || "",

                      requested_airline: hod?.requested_airline || "",

                      accepted_at: hod?.accepted_at || "",
                      hod_approved_on: hod?.hod_approved_on || "",

                      // =======================
                      // ✅ MARKETING
                      // =======================
                      marketing_status: marketing?.status || "",

                      marketing_remarks: marketing?.remarks || "",

                      marketing_name: marketing?.marketing_name || "",

                      marketing_email: marketing?.marketing_email || "",

                      // =======================
                      // ✅ BUYER DOCS
                      // =======================
                      buyer_doc_status: buyerDocs?.status || "",

                      buyer_doc_remarks: buyerDocs?.remarks || "",

                      buyer_vendor_name: buyerDocs?.vendor_name || "",

                      buyer_vendor_email: buyerDocs?.vendor_email || "",

                      buyer_airline: buyerDocs?.airline_name || "",

                      buyer_submitted_at: buyerDocs?.submitted_at || "",
                    });
                  }
                }
              }
            } else {
              // =======================
              // 🚨 FALLBACK ROW
              // =======================
              sheet.addRow({
                ...baseRow,

                vendor: vendor?.name || "",
                company: vendor?.company || "",

                invoice_status: invoice?.status || "",
                hod_status: hod?.status || "",
                marketing_status: marketing?.status || "",
              });
            }
          } catch (quoteError) {
            console.error("Error processing quote:", quote.id, quoteError);
          }
        }
      }

      // =======================
      // ✅ HEADER STYLING
      // =======================
      sheet.getRow(1).font = {
        bold: true,
      };

      sheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      // =======================
      // ✅ SEND FILE
      // =======================
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=RFQ_Auction_Report.xlsx",
      );

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );

      await workbook.xlsx.write(res);

      res.end();
    } catch (error) {
      console.error("❌ Excel Error:", error);

      res.status(500).json({
        message: "Error generating Excel",
        error: error.message,
      });
    }
  },

  // -----------------------------------------------------------
  // VENDOR SUMMARY
  // -----------------------------------------------------------
  getVendorSummary: async (req, res) => {
    try {
      const vendorId = req.query.vendor_id;
      const vendorCondition = Sequelize.literal(
        `JSON_CONTAINS(data->'$.vendors', JSON_OBJECT('id', ${vendorId}))`,
      );

      const receivedRFQs = await RfqData.count({
        where: {
          is_deleted: false,
          [Sequelize.Op.and]: vendorCondition,
        },
      });

      const submittedQuotes = await QuotesData.count({
        where: {
          vendor_id: vendorId,
        },
      });

      const recentRFQs = await RfqData.findAll({
        where: {
          is_deleted: false,
          [Sequelize.Op.and]: vendorCondition,
        },
        limit: 10,
        order: [["createdAt", "DESC"]],
      });

      const rfq = await RfqData.findOne({
        where: {
          is_deleted: false,
          [Sequelize.Op.and]: vendorCondition,
        },
        attributes: ["data"],
      });

      let vendorEmail = null;

      if (rfq?.data?.vendors?.length) {
        const vendor = rfq.data.vendors.find(
          (v) => Number(v.id) === Number(vendorId),
        );

        vendorEmail = vendor?.email || null;
      }
      console.log(vendorEmail);

      const auctionCondition = Sequelize.literal(
        `JSON_CONTAINS(
     data->'$.auction_data.invited',
     JSON_QUOTE('${vendorEmail}')
   )`,
      );

      const rfqsWithAuctions = await RfqData.findAll({
        where: {
          is_deleted: false,
          [Sequelize.Op.and]: auctionCondition,
        },
        attributes: ["rfq_number", "auction_number", "data"],
        order: [["createdAt", "DESC"]],
      });

      const now = new Date();

      let totalAuctions = 0;
      let liveAuctions = 0;
      let closedAuctions = 0;
      let scheduledAuctions = 0;

      const auctionDetails = [];
      const liveAuctionIds = [];
      const closedAuctionIds = [];
      const scheduledAuctionIds = [];

      rfqsWithAuctions.forEach((rfq) => {
        const auction = rfq.data?.auction_data;
        if (!auction) return;

        totalAuctions++;

        const start = new Date(auction.startTime);
        const end = new Date(auction.endTime);

        const auctionInfo = {
          rfq_number: rfq.rfq_number,
          auction_number: rfq.auction_number,
          startTime: auction.startTime,
          endTime: auction.endTime,
        };

        let status = "live";

        if (start > now) {
          scheduledAuctions++;
          status = "scheduled";
          scheduledAuctionIds.push(auctionInfo);
        } else if (end < now) {
          closedAuctions++;
          status = "closed";
          closedAuctionIds.push(auctionInfo);
        } else {
          liveAuctions++;
          liveAuctionIds.push(auctionInfo);
        }

        auctionDetails.push({
          rfq_number: rfq.rfq_number,
          auction_number: rfq.auction_number,
          status,
          startTime: auction.startTime,
          endTime: auction.endTime,
        });
      });

      return res.json({
        success: true,
        data: {
          receivedRFQs,
          submittedQuotes,
          recentRFQs,
          totalAuctions,
          liveAuctions,
          closedAuctions,
          scheduledAuctions,
          auctionDetails,
          liveAuctionIds,
          closedAuctionIds,
          scheduledAuctionIds,
        },
      });
    } catch (error) {
      console.error("Vendor Summary Error:", error);
      return res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // -----------------------------------------------------------
  // VENDOR AUCTION ACTIVITY
  // -----------------------------------------------------------
  getVendorAuctionActivity: async (req, res) => {
    try {
      const vendorId = req.query.vendor_id;
      const vendorCondition = Sequelize.literal(
        `JSON_CONTAINS(data->'$.vendors', JSON_OBJECT('id', ${vendorId}))`,
      );

      // Get only RFQs assigned to vendor
      const all = await RfqData.findAll({
        where: {
          is_deleted: false,
          [Sequelize.Op.and]: vendorCondition,
        },
        order: [["createdAt", "DESC"]],
      });

      // 1️⃣ Weekly Activity
      const weeklyData = {};
      for (let i = 0; i < 12; i++) {
        const week = new Date(Date.now() - i * 7 * 86400000)
          .toISOString()
          .slice(0, 10);
        weeklyData[week] = 0;
      }

      all.forEach((rfq) => {
        const date = rfq.createdAt.toISOString().slice(0, 10);
        const bucket = Object.keys(weeklyData).find((w) => date >= w);
        if (bucket) weeklyData[bucket]++;
      });

      const weeklyActivity = {
        labels: Object.keys(weeklyData).reverse(),
        data: Object.values(weeklyData).reverse(),
      };

      // 2️⃣ By Industry
      const industryMap = {};
      all.forEach((rfq) => {
        const industry = rfq.data?.industry || "Unknown";
        industryMap[industry] = (industryMap[industry] || 0) + 1;
      });

      const byIndustry = Object.keys(industryMap).map((k) => ({
        industry: k,
        count: industryMap[k],
      }));

      // 3️⃣ By Transport (subindustry)
      const transportMap = {};
      all.forEach((rfq) => {
        const t = rfq.data?.subindustry || "Unknown";
        transportMap[t] = (transportMap[t] || 0) + 1;
      });

      const byTransport = Object.keys(transportMap).map((k) => ({
        type: k,
        count: transportMap[k],
      }));

      // 4️⃣ Recent RFQs assigned to this vendor
      const recent = all.slice(0, 10);

      // 5️⃣ Vendors per RFQ (but restrict only for vendor)
      const vendorsPerRfq = all.map((rfq) => {
        const vendors = rfq.data?.vendors || [];
        return {
          rfq_number: rfq.data?.rfq_number,
          vendor_count: vendors.length,
          vendors,
        };
      });

      return res.json({
        success: true,
        data: {
          weekly_activity: weeklyActivity,
          by_industry: byIndustry,
          by_transport: byTransport,
          recent,
          vendors_per_rfq: vendorsPerRfq,
        },
      });
    } catch (error) {
      console.error("Vendor Activity Error:", error);
      return res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // -----------------------------------------------------------
  // VENDOR NOTIFICATIONS
  // -----------------------------------------------------------
  getVendorNotifications: async (req, res) => {
    try {
      const vendorId = req.query.vendor_id;

      // 1️⃣ Fetch vendor's quote notifications
      const notifications = await QuotesData.findAll({
        where: { vendor_id: vendorId },
        limit: 20,
        order: [["createdAt", "DESC"]],
      });

      // Extract RFQ IDs from notifications
      const rfqIds = notifications
        .map((n) => n.data?.rfq_id)
        .filter((id) => id);

      // 2️⃣ Fetch related RFQ data separately
      const rfqDataList = await RfqData.findAll({
        where: {
          is_deleted: false,
          rfq_number: rfqIds, // Fetch only required RFQs
        },
        attributes: ["rfq_number", "form_type", "status"],
      });

      // Convert rfq_data into a quick lookup map
      const rfqMap = {};
      rfqDataList.forEach((r) => {
        rfqMap[r.rfq_number] = {
          form_type: r.form_type,
          rfq_status: r.status,
        };
      });

      // 3️⃣ Format final output (add form_type & status)
      const formatted = notifications.map((item) => {
        const d = item.data || {};
        const hod = d.hodAcceptRequestDetails || {};
        const accepted = d.acceptedDetails || {};

        const rfq_id = d.rfq_id;
        const rfqInfo = rfqMap[rfq_id] || {};

        return {
          id: item.id,
          rfq_id,
          airline: hod.requested_airline || accepted.accepted_airline || null,
          status: hod.status || null,
          message:
            hod.status === "hod_approved"
              ? `HOD approved ${hod.requested_airline}`
              : hod.status === "hod_rejected"
                ? `HOD rejected ${hod.requested_airline}`
                : hod.requested_airline
                  ? `HOD approval requested for ${hod.requested_airline}`
                  : "Quote Updated",

          // ⭐ NEW fields from rfq_data
          form_type: rfqInfo.form_type || null,
          rfq_status: rfqInfo.rfq_status || null,

          createdAt: item.createdAt,
        };
      });

      return res.json({
        success: true,
        data: formatted,
      });
    } catch (error) {
      console.error("Vendor Notifications Error:", error);
      return res.status(500).json({ success: false, message: "Server Error" });
    }
  },
};
