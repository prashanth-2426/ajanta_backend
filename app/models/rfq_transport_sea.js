"use strict";

module.exports = (sequelize, DataTypes) => {
  const RFQTransportSea = sequelize.define(
    "RFQTransportSea",
    {
      rfq_id: DataTypes.INTEGER,
      pol_port_of_loading: DataTypes.STRING,
      pod_port_of_discharge: DataTypes.STRING,
      commodity: DataTypes.STRING,
      container_type: DataTypes.STRING,
      cargo_weight: DataTypes.DECIMAL,
      cargo_volume: DataTypes.DECIMAL,
      cargo_value_with_currency: DataTypes.STRING,
      consignee_details: DataTypes.TEXT,
      hsn_codes: DataTypes.TEXT,
      notes: DataTypes.TEXT,
    },
    {
      tableName: "rfq_transport_sea",
      underscored: true,
      timestamps: true,
    }
  );

  RFQTransportSea.associate = (models) => {
    RFQTransportSea.belongsTo(models.RFQ, { foreignKey: "rfq_id" });
  };

  return RFQTransportSea;
};
