// app/sockets/chat.js
module.exports = function chatSocket(io, auctions) {
  io.of("/chat").on("connection", (socket) => {
    const { role, userId } = socket.handshake.query;

    socket.on("chatMessage", ({ auctionId, to, message }) => {
      const auction = auctions[auctionId];
      if (!auction) return;

      const from = userId;

      // Buyer -> Vendor
      if (role === "buyer" && auction.bids[to] && auction.bids[to].socketId) {
        io.of("/chat").to(auction.bids[to].socketId).emit("chat", {
          from,
          message,
          to,
        });

        io.of("/chat").to(socket.id).emit("chat", { from, message, to });
      }

      // Vendor -> Buyer
      if (role === "vendor") {
        io.of("/chat").to(auctionId).emit("chat", {
          from,
          message,
          to: "buyer",
        });
      }
    });

    socket.on("disconnect", () => {
      //console.log("Chat socket disconnected:", socket.id);
    });
  });
};
