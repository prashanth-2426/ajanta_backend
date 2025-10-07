"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class RfqData extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  RfqData.init(
    {
      rfq_number: DataTypes.STRING,
      auction_number: DataTypes.STRING,
      rfq_type: DataTypes.STRING,
      form_type: DataTypes.STRING,
      status: DataTypes.STRING,
      quote_count: DataTypes.INTEGER,
      data: DataTypes.JSON,
      is_deleted: {
        type: DataTypes.BOOLEAN, // will map to TINYINT(1) in MySQL
        defaultValue: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        field: "createdAt", // ✅ maps Sequelize createdAt to DB column created_at
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: "updatedAt", // ✅ maps Sequelize updatedAt to DB column updated_at
      },
    },
    {
      sequelize,
      modelName: "RfqData",
      tableName: "rfq_data",
      timestamps: true,
      underscored: true,
    }
  );
  return RfqData;
};
