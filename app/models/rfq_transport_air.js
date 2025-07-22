"use strict";

module.exports = (sequelize, DataTypes) => {
  const RFQTransportAir = sequelize.define(
    "RFQTransportAir",
    {
      rfq_id: DataTypes.INTEGER,
      gross_weight: DataTypes.DECIMAL,
      volume_weight: DataTypes.DECIMAL,
      temperature: DataTypes.STRING,
      factory_location: DataTypes.STRING,
      customs_clearance_location: DataTypes.STRING,
      delivery_terms: DataTypes.STRING,
      pickup_by_freight_forwarder: DataTypes.BOOLEAN,
      commodity: DataTypes.STRING,
      number_of_cartoons: DataTypes.INTEGER,
      hs_code: DataTypes.STRING,
      door_delivery_address: DataTypes.TEXT,
      incoterm_selection: DataTypes.STRING,
      notes: DataTypes.TEXT,
    },
    {
      tableName: "rfq_transport_air",
      underscored: true,
      timestamps: true,
    }
  );

  RFQTransportAir.associate = (models) => {
    RFQTransportAir.belongsTo(models.RFQ, { foreignKey: "rfq_id" });
  };

  return RFQTransportAir;
};
