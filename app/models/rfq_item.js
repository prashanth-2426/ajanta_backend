"use strict";

module.exports = (sequelize, DataTypes) => {
  const RFQItem = sequelize.define(
    "RFQItem",
    {
      rfq_id: DataTypes.INTEGER,
      item_name: DataTypes.STRING,
      quantity: DataTypes.DECIMAL,
      unit: DataTypes.STRING,
      target_price: DataTypes.DECIMAL,
      notes: DataTypes.TEXT,
    },
    {
      tableName: "rfq_items",
      underscored: true,
      timestamps: true,
    }
  );

  RFQItem.associate = (models) => {
    RFQItem.belongsTo(models.RFQ, { foreignKey: "rfq_id" });
  };

  return RFQItem;
};
