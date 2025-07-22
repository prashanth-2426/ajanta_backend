"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("rfq_transport_sea_rates", {
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
      freight_per_container: Sequelize.DECIMAL,
      freight_per_cbm: Sequelize.DECIMAL,
      dap_ddp_charges: Sequelize.DECIMAL,
      temperature: Sequelize.STRING,
      transit_time: Sequelize.STRING,
      rate_validity: Sequelize.DATE,
      charges_without_tax: Sequelize.BOOLEAN,
      origin_charges: Sequelize.DECIMAL,
      destination_charges: Sequelize.DECIMAL,
      shipping_line_freight: Sequelize.TEXT,
      port_name: Sequelize.STRING,
      port_location: Sequelize.STRING,
      remarks: Sequelize.TEXT,
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });

    await queryInterface.addIndex("rfq_transport_sea_rates", ["rfq_id"]);
    await queryInterface.addIndex("rfq_transport_sea_rates", ["vendor_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("rfq_transport_sea_rates");
  },
};
