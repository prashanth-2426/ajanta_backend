// models/quotes_data.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class QuotesData extends Model {
    static associate(models) {
      // Optional: Add associations if needed
    }
  }

  QuotesData.init(
    {
      rfq_id: DataTypes.STRING,
      vendor_id: DataTypes.STRING,
      data: DataTypes.JSON, // stores full quote structure
    },
    {
      sequelize,
      tableName: "quotes_data",
      modelName: "QuotesData",
    }
  );

  return QuotesData;
};
