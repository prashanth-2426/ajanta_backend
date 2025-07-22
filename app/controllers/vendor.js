const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { User } = require("../models");
const { Op } = require("sequelize");

const vendorsFile = path.join(__dirname, "..", "..", "public", "vendors.json");

const getVendors = async (req, res) => {
  try {
    const vendors = await User.findAll({
      where: { role: "vendor" },
      order: [["createdAt", "DESC"]],
    });

    res.json(vendors);
  } catch (err) {
    console.error("Failed to fetch vendors:", err);
    res.status(500).json({ error: "Failed to fetch vendor records" });
  }
};

const uploadVendors = async (req, res) => {
  try {
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const parsedData = XLSX.utils.sheet_to_json(sheet);

    const incomingEmails = parsedData
      .map((row) => row["email"])
      .filter(Boolean);

    const existingUsers = await User.findAll({
      where: { email: { [Op.in]: incomingEmails } },
      attributes: ["email"],
    });

    const existingEmailsSet = new Set(
      existingUsers.map((user) => user.email.toLowerCase())
    );

    const newUsers = parsedData
      .filter(
        (row) =>
          row["email"] && !existingEmailsSet.has(row["email"].toLowerCase())
      )
      .map((row) => ({
        name: row["name"] || "",
        email: row["email"],
        password: row["password"] || "default123",
        passwordExpiry:
          row["passwordExpiry"] ||
          new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days default
        token: row["token"] || "",
        lastLogin: row["lastLogin"] || null,
        role: row["role"] || "vendor",
        profilePictrue: row["profilePictrue"] || "",
        company: row["company"] || "",
        mobile: row["mobile"] || "",
        industry: row["industry"] || "",
        subIndustry: row["subIndustry"] || "",
        product: row["product"] || "",
        gst_number: row["gst_number"] || "",
        pan_number: row["pan_number"] || "",
        address_line1: row["address_line1"] || "",
        address_line2: row["address_line2"] || "",
        city: row["city"] || "",
        state: row["state"] || "",
        country: row["country"] || "",
        zipcode: row["zipcode"] || "",
        is_approved:
          row["is_approved"] === true || row["is_approved"] === "true",
        registration_source: row["registration_source"] || "excel",
      }));

    if (newUsers.length > 0) {
      await User.bulkCreate(newUsers);
    }

    return res.json({
      message: "Vendor upload completed",
      inserted: newUsers.length,
      skipped: existingEmailsSet.size,
    });
  } catch (err) {
    console.error("Upload Vendors Error:", err);
    res.status(500).json({ error: "Failed to process the Excel file" });
  }
};

module.exports = {
  getVendors,
  uploadVendors,
};
