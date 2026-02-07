// app/sockets/index.js
const auctionSocket = require("./auction");
const chatSocket = require("./chat");

module.exports = (io, auctions, computeRanks) => {
  auctionSocket(io, auctions, computeRanks);
  chatSocket(io, auctions);
};
