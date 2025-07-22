"use strict";

module.exports = (sequelize, DataTypes) => {
  const RFQTransportAirRate = sequelize.define(
    "RFQTransportAirRate",
    {
      rfq_id: DataTypes.INTEGER,
      vendor_id: DataTypes.INTEGER,
      chargeable_weight: DataTypes.DECIMAL,
      airline: DataTypes.TEXT,
      airport: DataTypes.TEXT,
      transit_days: DataTypes.INTEGER,
      freight_per_kg: DataTypes.DECIMAL,
      dap_ddp_charges: DataTypes.DECIMAL,
      other_charges: DataTypes.DECIMAL,
      remarks: DataTypes.TEXT,
      rate_validity: DataTypes.DATE,
    },
    {
      tableName: "rfq_transport_air_rates",
      underscored: true,
      timestamps: true,
    }
  );

  RFQTransportAirRate.associate = (models) => {
    RFQTransportAirRate.belongsTo(models.RFQ, { foreignKey: "rfq_id" });
    RFQTransportAirRate.belongsTo(models.User, { foreignKey: "vendor_id" });
  };

  return RFQTransportAirRate;
};
