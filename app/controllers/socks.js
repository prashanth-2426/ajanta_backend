// app/controllers/auction.js

const { name } = require("../queues/mailQueue");
const { RfqData } = require("../models");
const {
  sendVendorAuctionInvitation,
  sendAuctionResultEmails,
} = require("../queues/mailer");

let auctions = {};
let ioInstance = null;
let uuidv4 = null;

// Inject IO & UUID once from app.js
module.exports.init = ({ io, uuid }) => {
  ioInstance = io;
  uuidv4 = uuid;

  function computeRanks(auction) {
    const list = [];

    Object.entries(auction.bids || {}).forEach(([vendorId, airlines]) => {
      Object.entries(airlines || {}).forEach(([airline, data]) => {
        if (data?.latestBid) {
          list.push({
            vendorId,
            airline,
            bid: Number(data.latestBid.bid),
            time: data.latestBid.time,
          });
        }
      });
    });

    list.sort((a, b) => {
      if (auction.mode === "forward") {
        if (b.bid !== a.bid) return b.bid - a.bid;
      } else {
        if (a.bid !== b.bid) return a.bid - b.bid;
      }

      return a.time - b.time;
    });

    const ranks = {};

    list.forEach((row, index) => {
      ranks[row.vendorId] = ranks[row.vendorId] || {};

      ranks[row.vendorId][row.airline] = index + 1;
    });

    return ranks;
  }

  io.on("connection", (socket) => {
    const { role, userId } = socket.handshake.query;

    console.log(
      "New socket connection:",
      socket.id,
      "Role:",
      role,
      "UserID:",
      userId,
    );

    socket.on("joinAuction", ({ auctionId, user }) => {
      console.log("Join auction:", auctionId, "UserID:", userId, "User:", user);
      const auction = auctions[auctionId];
      if (!auction)
        return socket.emit("errorMsg", { message: "Auction not found" });

      socket.join(auctionId);
      socket.user = user;

      // 🔹 store users participating
      auction.users = auction.users || {};
      auction.users[user.id] = {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        socketId: socket.id,
        online: true,
      };

      console.log("Current auction users:", auction.users);

      console.log("auctions data after join auction:", auctions);

      // if (role === "vendor") {
      //   //console.log("Vendor joined auction:", auctionId, "UserID:", userId);
      //   auction.bids[userId] = auction.bids[userId] || {
      //     bid: null,
      //     time: null,
      //   };
      //   auction.bids[userId].socketId = socket.id;
      //   socket.emit("rankUpdate", {
      //     rank: null,
      //     bid: null,
      //     startTime: auction.startTime,
      //     endTime: auction.endTime,
      //   });
      // }

      // if (role === "buyer") {
      //   //console.log("Buyer joined auction:", auctionId, "UserID:", userId);
      //   socket.emit("auctionUpdate", {
      //     bids: auction.bids,
      //     ranks: computeRanks(auction),
      //     startTime: auction.startTime,
      //     endTime: auction.endTime,
      //     users: auction.users,
      //   });
      // }
    });

    socket.on(
      "placeBid",
      async ({
        auctionId,
        bid,
        airlineName,
        vendorBidCount,
        user,
        rfqNumber,
      }) => {
        const auction = auctions[auctionId];
        console.log(
          "Place bid:",
          auctionId,
          "UserID:",
          userId,
          "Bid:",
          bid,
          "Airline Name:",
          airlineName,
          "Vendor Bid Count:",
          vendorBidCount,
          "user:",
          user,
        );
        if (!auction)
          return socket.emit("errorMsg", { message: "Auction not found" });

        auction.bids = auction.bids || {};

        auction.bids[userId] = auction.bids[userId] || {};

        auction.bids[userId][airlineName] = auction.bids[userId][
          airlineName
        ] || {
          latestBid: null,
          history: [],
        };

        //----------------------------------------
        // latest bid
        //----------------------------------------

        auction.bids[userId][airlineName].latestBid = {
          bid: Number(bid),
          socketId: socket.id,
          time: Date.now(),
          name: user.name,
          company: user.company,
          vendorBidCount: Number(vendorBidCount),
          airlineName,
          userId: userId,
        };

        //----------------------------------------
        // history
        //----------------------------------------

        auction.bids[userId][airlineName].history.push({
          bid: Number(bid),
          time: Date.now(),
          vendorBidCount: Number(vendorBidCount),
          airlineName,
        });

        const ranks = computeRanks(auction);
        console.log("Updated ranks:", ranks);

        io.to(auctionId).emit("auctionUpdate", {
          bids: auction.bids,
          users: auction.users,
          ranks,
          startTime: auction.startTime,
          endTime: auction.endTime,
        });

        console.log("Sending rank updates to vendors");

        // send rank individually to each vendor
        Object.entries(auction.bids).forEach(([vendorId, airlines]) => {
          Object.entries(airlines).forEach(([airline, data]) => {
            const latestBid = data.latestBid;

            if (latestBid?.socketId) {
              io.to(latestBid.socketId).emit("rankUpdate", {
                rank: ranks?.[vendorId]?.[airline] || null,
                bid: latestBid.bid,
                airlineName: airline,
              });
            }
          });
        });

        console.log("Updating RFQ auction data in DB", auction);
        auction.ranks = ranks;

        await updateRfqAuctionData({
          rfqNumber,
          auctionData: auction,
        });
      },
    );

    socket.on("disconnect", () => {
      //console.log("Socket disconnected:", socket.id);

      // Find auction + user
      Object.values(auctions).forEach((auction) => {
        if (!auction.users) return;

        const userEntry = Object.values(auction.users).find(
          (u) => u.socketId === socket.id,
        );

        //console.log("Disconnected user entry:", userEntry);

        if (userEntry) {
          //console.log("Marking user as offline:", userEntry.id);
          userEntry.online = false;

          // 🔔 notify buyer
          io.to(auction.id).emit("userStatus", {
            userId: userEntry.id,
            online: false,
          });

          //console.log("Current auction users after disconnect:", auction.users);
        }
      });
    });

    socket.on(
      "chatMessage",
      async ({
        auctionId,
        to,
        message,
        user_name,
        user_company,
        rfqNumber,
      }) => {
        console.log(
          "Chat message:",
          auctionId,
          "From:",
          userId,
          "To:",
          to,
          "Message:",
          message,
        );
        console.log("auctions data", auctions);
        const auction = auctions[auctionId];
        console.log("auction data", auction);
        if (!auction) return;
        console.log("Reached log here for chat message");
        const from = userId;

        auction.messages = auction.messages || [];

        const chatPayload = {
          id: auctionId,
          from,
          to,
          message,
          user_name,
          user_company,
          role,
          time: Date.now(),
        };

        auction.messages.push(chatPayload);

        console.log("Chat message stored in auction data:", chatPayload);

        // buyer -> vendor
        // if (role === "buyer" && auction.bids[to] && auction.bids[to].socketId) {
        //   console.log("Forwarding message to vendor:", to);
        //   io.to(auction.bids[to].socketId).emit("chat", {
        //     from,
        //     message,
        //     to,
        //     user_name,
        //     user_company,
        //   });

        //   io.to(socket.id).emit("chat", { from, message, to });
        // }

        if (role === "buyer") {
          const vendorUser = Object.values(auction.users).find(
            (u) => String(u.id) === String(to),
          );

          console.log("Vendor User", vendorUser);

          if (vendorUser?.socketId) {
            console.log("Forwarding message to vendor", vendorUser.socketId);

            io.to(vendorUser.socketId).emit("chat", {
              from,
              to,
              message,
              user_name,
              user_company,
              role,
              time: Date.now(),
            });

            // echo back to buyer
            io.to(socket.id).emit("chat", {
              from,
              to,
              message,
              user_name,
              user_company,
              role,
              time: Date.now(),
            });
          }
        }

        // vendor -> buyer
        if (role === "vendor") {
          const buyer = Object.values(auction.users).find(
            (u) => u.role === "user",
          );

          if (buyer?.socketId) {
            io.to(buyer.socketId).emit("chat", {
              from,
              to: buyer.id,
              message,
              user_name,
              user_company,
              role,
              time: Date.now(),
            });

            io.to(socket.id).emit("chat", {
              from,
              to: buyer.id,
              message,
              user_name,
              user_company,
              role,
              time: Date.now(),
            });
          }
        }
        await updateRfqAuctionData({
          rfqNumber,
          auctionData: auction,
        });
      },
    );

    socket.on("typing", ({ auctionId, userId }) => {
      //console.log("Typing event:", auctionId, "UserID:", userId);
      socket.to(auctionId).emit("typing", { userId });
    });

    socket.on("stopTyping", () => {
      socket.broadcast.emit("stopTyping");
    });
  });
};

// REST: Create Auction
module.exports.createAuction = async (req, res) => {
  const {
    title,
    buyerId,
    invited = [],
    invitedAirlines = [],
    mode,
    startTime,
    endTime,
    rfqNumber,
    auctionId,
    directAuction = false,
  } = req.body;

  console.log("Create/Edit auction request received. Auction ID:", endTime);

  let aid = auctionId;

  // =====================  ==========
  // ✏️ EDIT EXISTING AUCTION
  // ===============================
  if (aid && auctions[aid]) {
    console.log("Editing auction:", aid);
    auctions[aid] = {
      ...auctions[aid], // ✅ preserve bids, auction_number
      title,
      invited,
      invitedAirlines,
      mode,
      startTime,
      endTime,
      directAuction: directAuction ?? false,
    };

    console.log("Updated auction:", auctions[aid]);

    const rfqRecord = await RfqData.findOne({
      where: { rfq_number: rfqNumber },
    });

    if (!rfqRecord) {
      throw new Error("RFQ record not found");
    }

    const existingData = rfqRecord.data || {};
    const existingAuctionData = existingData.auction_data || {};

    const updatedBids = { ...(existingAuctionData.bids || {}) };

    console.log("Existing bids before update:", updatedBids);

    Object.keys(updatedBids).forEach((vendorBidId) => {
      Object.keys(updatedBids[vendorBidId] || {}).forEach((airlineName) => {
        const airlineData = updatedBids[vendorBidId][airlineName];
        if (airlineData?.latestBid) {
          updatedBids[vendorBidId][airlineName] = {
            ...airlineData,

            latestBid: {
              ...airlineData.latestBid,
              vendorBidCount: 0,
            },
          };
        }
      });
    });

    console.log("Existing bids after update:", updatedBids);

    const updatedRfqData = {
      ...existingData,
      auction_data: {
        ...existingAuctionData, // 🔥 keep old values
        ...auctions[aid], // 🔥 update / overwrite only changed fields

        bids: updatedBids,
      },
    };

    await rfqRecord.update({
      data: updatedRfqData,
    });

    return res.json({
      success: true,
      auction: auctions[aid],
      isEdit: true,
    });
  } else {
    console.log("Creating new auction");

    const id = uuidv4();
    auctions[id] = {
      id,
      title,
      buyerId,
      invited,
      invitedAirlines,
      bids: {},
      mode,
      startTime,
      endTime,
      directAuction: directAuction ?? false,
      auction_number: rfqNumber ? rfqNumber.replace(/^RFQ/, "AUC") : null,
    };

    //console.log("Created auction:", auctions[id]);

    // const rfqRecord = await RfqData.findOne({ where: { rfq_number: rfqNumber } });

    // console.log("Found RFQ record for auction:", rfqRecord);

    // const updatedRfqData = {
    //   ...(rfqRecord.data || {}),
    //   auction_data: auctions[id],
    // };

    // await rfqRecord.update({
    //   data: updatedRfqData,
    // });

    const rfqRecord = await RfqData.findOne({
      where: { rfq_number: rfqNumber },
    });

    if (!rfqRecord) {
      throw new Error("RFQ record not found");
    }

    const existingData = rfqRecord.data || {};
    const existingAuctionData = existingData.auction_data || {};

    const updatedRfqData = {
      ...existingData,
      auction_data: {
        ...existingAuctionData, // 🔥 keep old values
        ...auctions[id], // 🔥 update / overwrite only changed fields
      },
    };

    await rfqRecord.update({
      data: updatedRfqData,
      auction_number: auctions[id].auction_number,
    });

    sendInvitationsToVendors({
      invited,
      title,
      auctionId: id,
      auction_number: auctions[id].auction_number,
      startTime,
      endTime,
    });

    res.json({ ok: true, auction: auctions[id] });
  }
};

// REST: Get Auction
module.exports.getAuction = (req, res) => {
  const id = req.params.id;
  if (!auctions[id])
    return res.status(404).json({ ok: false, message: "Not Found" });
  res.json({ ok: true, auction: auctions[id] });
};

const updateRfqAuctionData = async ({ rfqNumber, auctionData }) => {
  //console.log("Updating RFQ auction data for RFQ number:", rfqNumber);
  //console.log("Auction Data:", auctionData);
  const rfqRecord = await RfqData.findOne({
    where: { rfq_number: rfqNumber },
  });

  if (!rfqRecord) {
    throw new Error("RFQ record not found");
  }

  const existingData = rfqRecord.data || {};
  const existingAuctionData = existingData.auction_data || {};

  //console.log("Updating RFQ auction data for RFQ:", existingAuctionData);

  const updatedAuctionData = {
    ...existingAuctionData, // 🔒 keep everything same
    bids: auctionData.bids || {}, // ✅ update
    users: auctionData.users || {},
    ranks: auctionData.ranks || {},
    messages: auctionData.messages || {},
  };

  await rfqRecord.update({
    data: {
      ...existingData,
      auction_data: updatedAuctionData,
    },
  });
  //console.log("RFQ auction data updated successfully");
};

exports.updateAuctionData = async (req, res) => {
  try {
    const { rfqNumber, newEndTime, auctionId, extendMinutes } = req.body;

    const rfqRecord = await RfqData.findOne({
      where: { rfq_number: rfqNumber },
    });

    if (!rfqRecord) {
      throw new Error("RFQ record not found");
    }

    const existingData = rfqRecord.data || {};
    const existingAuctionData = existingData.auction_data || {};

    const updatedAuctionData = {
      ...existingAuctionData,
      endTime: newEndTime, // 🔥 override here
    };

    await rfqRecord.update({
      data: {
        ...existingData,
        auction_data: updatedAuctionData,
      },
    });

    // 🔥 Notify all users in the auction room
    ioInstance.to(auctionId).emit("auctionTimeExtended", {
      auctionId,
      endTime: newEndTime,
      extendedBy: "buyer",
      extendMinutes,
    });

    return res.status(200).json({
      success: true,
      message: "Auction data updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const sendInvitationsToVendors = async ({
  invited,
  title,
  auctionId,
  auction_number,
  startTime,
  endTime,
}) => {
  if (!Array.isArray(invited)) return;

  for (const email of invited) {
    await sendVendorAuctionInvitation({
      email,
      name: email.split("@")[0],
      rfqTitle: title,
      auctionId,
      auctionNumber: auction_number,
      startTime,
      endTime,
    });
  }
};

module.exports.sendAuctionResult = async (req, res) => {
  console.log("Sending auction result emails for RFQ:", req.body.rfqNumber);
  try {
    const { winner, nonWinners } = req.body;

    console.log("Current auction winner:", winner);
    console.log("Current auction non winners:", nonWinners);

    if (!winner) {
      return res.status(400).json({
        ok: false,
        message: "Winner data missing",
      });
    }

    const rfqRecord = await RfqData.findOne({
      where: { rfq_number: winner.rfq_number },
    });

    if (!rfqRecord) {
      throw new Error("RFQ record not found");
    }

    const existingData = rfqRecord.data || {};
    const existingAuctionData = existingData.auction_data || {};

    if (existingAuctionData.mailSent) {
      console.log("Emails already sent for this auction result");
      return res.json({
        ok: true,
        message: "Emails already sent",
      });
    }

    await sendAuctionResultEmails({ winner, nonWinners });

    const updatedAuctionData = {
      ...existingAuctionData,
      mailSent: true,
    };

    await rfqRecord.update({
      data: {
        ...existingData,
        auction_data: updatedAuctionData,
      },
    });

    return res.json({
      ok: true,
      message: "Auction result emails sent successfully",
    });
  } catch (error) {
    console.error("Error sending result emails:", error);
    return res.status(500).json({
      ok: false,
      message: "Server error",
    });
  }
};
