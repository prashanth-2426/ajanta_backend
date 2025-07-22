"use strict";

module.exports = (sequelize, DataTypes) => {
  const RFQTransportSeaRate = sequelize.define(
    "RFQTransportSeaRate",
    {
      rfq_id: DataTypes.INTEGER,
      vendor_id: DataTypes.INTEGER,
      freight_per_container: DataTypes.DECIMAL,
      freight_per_cbm: DataTypes.DECIMAL,
      dap_ddp_charges: DataTypes.DECIMAL,
      temperature: DataTypes.STRING,
      transit_time: DataTypes.STRING,
      rate_validity: DataTypes.DATE,
      charges_without_tax: DataTypes.BOOLEAN,
      origin_charges: DataTypes.DECIMAL,
      destination_charges: DataTypes.DECIMAL,
      shipping_line_freight: DataTypes.TEXT,
      port_name: DataTypes.STRING,
      port_location: DataTypes.STRING,
      remarks: DataTypes.TEXT,
    },
    {
      tableName: "rfq_transport_sea_rates",
      underscored: true,
      timestamps: true,
    }
  );

  RFQTransportSeaRate.associate = (models) => {
    RFQTransportSeaRate.belongsTo(models.RFQ, { foreignKey: "rfq_id" });
    RFQTransportSeaRate.belongsTo(models.User, { foreignKey: "vendor_id" });
  };

  return RFQTransportSeaRate;
};
