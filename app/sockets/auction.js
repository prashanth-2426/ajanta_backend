// app/sockets/auction.js
module.exports = function auctionSocket(io, auctions, computeRanks) {
  io.of("/auction").on("connection", (socket) => {
    const { role, userId } = socket.handshake.query;

    // JOIN AUCTION
    socket.on("joinAuction", ({ auctionId }) => {
      const auction = auctions[auctionId];
      if (!auction)
        return socket.emit("errorMsg", { message: "Auction not found" });

      socket.join(auctionId);

      if (role === "vendor") {
        auction.bids[userId] = auction.bids[userId] || {
          bid: null,
          time: null,
        };
        auction.bids[userId].socketId = socket.id;

        socket.emit("rankUpdate", {
          rank: null,
          bid: null,
          startTime: auction.startTime,
          endTime: auction.endTime,
        });
      }

      if (role === "buyer") {
        socket.emit("auctionUpdate", {
          bids: auction.bids,
          ranks: computeRanks(auction),
          startTime: auction.startTime,
          endTime: auction.endTime,
        });
      }
    });

    // PLACE BID
    socket.on("placeBid", ({ auctionId, bid }) => {
      const auction = auctions[auctionId];
      if (!auction)
        return socket.emit("errorMsg", { message: "Auction not found" });

      auction.bids[userId] = {
        bid: Number(bid),
        socketId: socket.id,
        time: Date.now(),
      };

      const ranks = computeRanks(auction);

      // Broadcast to auction room
      io.of("/auction").to(auctionId).emit("auctionUpdate", {
        bids: auction.bids,
        ranks,
        startTime: auction.startTime,
        endTime: auction.endTime,
      });

      // Send each vendor's rank separately
      Object.entries(auction.bids).forEach(([vendorId, info]) => {
        if (info.socketId) {
          io.of("/auction").to(info.socketId).emit("rankUpdate", {
            rank: ranks[vendorId],
            bid: info.bid,
          });
        }
      });
    });

    socket.on("disconnect", () => {
      //console.log("Auction socket disconnected:", socket.id);
    });
  });
};
