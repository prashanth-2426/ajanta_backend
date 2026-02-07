require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
let uuidv4;
import("uuid").then((m) => {
  uuidv4 = m.v4;
});
//const { v4: uuidv4 } = require("uuid");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const routers = require("./app/routes");

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
const cors = require("cors");

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/apis", routers);
app.use(
  "/uploads/rfq",
  express.static(path.join(__dirname, "app", "uploads", "rfq"))
);
//app.use("/api/exchange", require("./routes/exchange"));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

const socksController = require("./app/controllers/socks");
socksController.init({ io, uuid: () => uuidv4() });

module.exports = { app, server };
