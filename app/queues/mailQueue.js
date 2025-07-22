// queues/mailQueue.js
const Queue = require("bull");
const Redis = require("ioredis");

const redisConfig = {
  host: "127.0.0.1",
  port: 6379,
};

const mailQueue = new Queue("mailQueue", { redis: redisConfig });

module.exports = mailQueue;
