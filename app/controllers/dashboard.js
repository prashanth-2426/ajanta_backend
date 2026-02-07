const { User, QuotesData, RfqData } = require("../models");
const { Op, fn, col, where } = require("sequelize");
const sequelize = require("../models").sequelize;
const { Sequelize } = require("sequelize");

module.exports = {
  // -----------------------------------------------------------
  // SUMMARY COUNTS
  // -----------------------------------------------------------
  getSummary: async (req, res) => {
    try {
      const totalUsers = await User.count({
        where: { role: { [Op.ne]: "vendor" } },
      });

      const totalRFQs = await RfqData.count({
        where: { is_deleted: false },
      });

      const rfqsWithAuction = await RfqData.findAll({
        where: {
          is_deleted: false,
          auction_number: { [Op.ne]: null },
        },
        attributes: ["id", "rfq_number", "auction_number", "data"],
      });

      const now = new Date();

      let totalAuctions = 0;
      let liveAuctions = 0;
      let closedAuctions = 0;
      let scheduledAuctions = 0;

      // 🔹 collect identifiers
      const liveAuctionIds = [];
      const closedAuctionIds = [];
      const scheduledAuctionIds = [];

      rfqsWithAuction.forEach((rfq) => {
        const auction = rfq.data?.auction_data;
        if (!auction) return;

        totalAuctions++;

        const start = new Date(auction.startTime);
        const end = new Date(auction.endTime);

        const identifier = {
          rfq_number: rfq.rfq_number,
          auction_number: rfq.auction_number,
        };

        if (start > now) {
          scheduledAuctions++;
          scheduledAuctionIds.push(identifier);
        } else if (end < now) {
          closedAuctions++;
          closedAuctionIds.push(identifier);
        } else {
          liveAuctions++;
          liveAuctionIds.push(identifier);
        }
      });

      const totalQuotes = await QuotesData.count();

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
          liveAuctionIds,
          closedAuctionIds,
          scheduledAuctionIds,
        },
      });
    } catch (error) {
      console.error("Dashboard Summary Error:", error);
      return res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // -----------------------------------------------------------
  // AUCTION / RFQ ACTIVITY (MAIN ANALYTICS)
  // -----------------------------------------------------------
  getAuctionActivity: async (req, res) => {
    try {
      // -------------------------------------------------------
      // 1️⃣ Last 12 Weeks Activity (based on createdAt)
      // -------------------------------------------------------
      const last90Days = await RfqData.findAll({
        where: {
          is_deleted: false,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          },
        },
        order: [["createdAt", "ASC"]],
      });

      const weeklyData = {};
      for (let i = 0; i < 12; i++) {
        const week = new Date(Date.now() - i * 7 * 86400000)
          .toISOString()
          .slice(0, 10);

        weeklyData[week] = 0;
      }

      last90Days.forEach((rfq) => {
        const date = rfq.createdAt.toISOString().slice(0, 10);

        const weekBucket = Object.keys(weeklyData).find((w) => date >= w);
        if (weekBucket) weeklyData[weekBucket]++;
      });

      const weeklyActivity = {
        labels: Object.keys(weeklyData).reverse(),
        data: Object.values(weeklyData).reverse(),
      };

      // -------------------------------------------------------
      // 2️⃣ RFQs by Industry (data -> industry)
      // -------------------------------------------------------
      const all = await RfqData.findAll({
        where: { is_deleted: false },
      });

      const industryCount = {};
      all.forEach((rfq) => {
        const industry = rfq.data?.industry || "Unknown";
        industryCount[industry] = (industryCount[industry] || 0) + 1;
      });

      const byIndustry = Object.keys(industryCount).map((key) => ({
        industry: key,
        count: industryCount[key],
      }));

      // -------------------------------------------------------
      // 3️⃣ RFQs by Transport/Subindustry (data -> subindustry)
      // -------------------------------------------------------
      const transportCount = {};
      all.forEach((rfq) => {
        const t = rfq.data?.subindustry || "Unknown";
        transportCount[t] = (transportCount[t] || 0) + 1;
      });

      const byTransport = Object.keys(transportCount).map((key) => ({
        type: key,
        count: transportCount[key],
      }));

      // -------------------------------------------------------
      // 4️⃣ Recent RFQs (last 10)
      // -------------------------------------------------------
      const recent = await RfqData.findAll({
        where: { is_deleted: false },
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

  // -----------------------------------------------------------
  // NOTIFICATIONS
  // -----------------------------------------------------------
  getNotifications: async (req, res) => {
    try {
      const notifications = await QuotesData.findAll({
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
