"use strict";

module.exports = (sequelize, DataTypes) => {
  const RFQ = sequelize.define(
    "RFQ",
    {
      rfq_number: DataTypes.STRING,
      title: DataTypes.STRING,
      type: DataTypes.ENUM("forward", "reverse", "transport"),
      transport_type: DataTypes.ENUM("import", "export"),
      transport_mode: DataTypes.ENUM("local", "air", "sea"),
      description: DataTypes.TEXT,
      buyer_id: DataTypes.INTEGER,
      status: DataTypes.ENUM(
        "draft",
        "sent",
        "quoted",
        "evaluated",
        "auctioned",
        "closed"
      ),
      is_template: DataTypes.BOOLEAN,
      industry: DataTypes.STRING,
      subindustry: DataTypes.STRING,
      country: DataTypes.STRING,
      currency: DataTypes.STRING,
      open_date_time: DataTypes.DATE,
      close_date_time: DataTypes.DATE,
      same_bid_price_allowed: DataTypes.BOOLEAN,
      hide_current_bid_price: DataTypes.BOOLEAN,
    },
    {
      tableName: "rfqs",
      underscored: true,
      timestamps: true,
    }
  );

  RFQ.associate = (models) => {
    RFQ.belongsTo(models.User, { foreignKey: "buyer_id" });
    RFQ.hasMany(models.RFQItem, { foreignKey: "rfq_id" });
    RFQ.hasOne(models.RFQTransportAir, { foreignKey: "rfq_id" });
    RFQ.hasOne(models.RFQTransportSea, { foreignKey: "rfq_id" });
    RFQ.hasMany(models.RFQTransportAirRate, { foreignKey: "rfq_id" });
    RFQ.hasMany(models.RFQTransportSeaRate, { foreignKey: "rfq_id" });
    //RFQ.hasMany(models.RFQMessage, { foreignKey: "rfq_id" });
  };

  return RFQ;
};
