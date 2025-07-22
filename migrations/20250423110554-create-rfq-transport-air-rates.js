"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("rfq_transport_air_rates", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      rfq_id: {
        type: Sequelize.INTEGER,
        references: { model: "rfqs", key: "id" },
        onDelete: "CASCADE",
      },
      vendor_id: {
        type: Sequelize.INTEGER,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      chargeable_weight: Sequelize.DECIMAL,
      airline: Sequelize.TEXT,
      airport: Sequelize.TEXT,
      transit_days: Sequelize.INTEGER,
      freight_per_kg: Sequelize.DECIMAL,
      dap_ddp_charges: Sequelize.DECIMAL,
      other_charges: Sequelize.DECIMAL,
      remarks: Sequelize.TEXT,
      rate_validity: Sequelize.DATE,
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });

    await queryInterface.addIndex("rfq_transport_air_rates", ["rfq_id"]);
    await queryInterface.addIndex("rfq_transport_air_rates", ["vendor_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("rfq_transport_air_rates");
  },
};
