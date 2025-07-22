"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("rfq_transport_air", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      rfq_id: {
        type: Sequelize.INTEGER,
        references: { model: "rfqs", key: "id" },
        onDelete: "CASCADE",
      },
      gross_weight: Sequelize.DECIMAL,
      volume_weight: Sequelize.DECIMAL,
      temperature: Sequelize.STRING,
      factory_location: Sequelize.STRING,
      customs_clearance_location: Sequelize.STRING,
      delivery_terms: Sequelize.STRING,
      pickup_by_freight_forwarder: Sequelize.BOOLEAN,
      commodity: Sequelize.STRING,
      number_of_cartoons: Sequelize.INTEGER,
      hs_code: Sequelize.STRING,
      door_delivery_address: Sequelize.TEXT,
      incoterm_selection: Sequelize.STRING,
      notes: Sequelize.TEXT,
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });

    await queryInterface.addIndex("rfq_transport_air", ["rfq_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("rfq_transport_air");
  },
};
