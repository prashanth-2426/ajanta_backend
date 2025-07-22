"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("rfq_transport_sea", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      rfq_id: {
        type: Sequelize.INTEGER,
        references: { model: "rfqs", key: "id" },
        onDelete: "CASCADE",
      },
      pol_port_of_loading: Sequelize.STRING,
      pod_port_of_discharge: Sequelize.STRING,
      commodity: Sequelize.STRING,
      container_type: Sequelize.STRING,
      cargo_weight: Sequelize.DECIMAL,
      cargo_volume: Sequelize.DECIMAL,
      cargo_value_with_currency: Sequelize.STRING,
      consignee_details: Sequelize.TEXT,
      hsn_codes: Sequelize.TEXT,
      notes: Sequelize.TEXT,
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });

    await queryInterface.addIndex("rfq_transport_sea", ["rfq_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("rfq_transport_sea");
  },
};
