"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("rfq_items", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      rfq_id: {
        type: Sequelize.INTEGER,
        references: { model: "rfqs", key: "id" },
        onDelete: "CASCADE",
      },
      item_name: Sequelize.STRING,
      quantity: Sequelize.DECIMAL,
      unit: Sequelize.STRING,
      target_price: Sequelize.DECIMAL,
      notes: Sequelize.TEXT,
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });

    await queryInterface.addIndex("rfq_items", ["rfq_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("rfq_items");
  },
};
