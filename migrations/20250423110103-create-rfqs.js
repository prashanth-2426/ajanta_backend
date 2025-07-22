"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("rfqs", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      rfq_number: Sequelize.STRING,
      title: Sequelize.STRING,
      type: Sequelize.ENUM("forward", "reverse", "transport"),
      transport_type: Sequelize.ENUM("import", "export"),
      transport_mode: Sequelize.ENUM("local", "air", "sea"),
      description: Sequelize.TEXT,
      buyer_id: {
        type: Sequelize.INTEGER,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      status: Sequelize.ENUM(
        "draft",
        "sent",
        "quoted",
        "evaluated",
        "auctioned",
        "closed"
      ),
      is_template: Sequelize.BOOLEAN,
      industry: Sequelize.STRING,
      subindustry: Sequelize.STRING,
      country: Sequelize.STRING,
      currency: Sequelize.STRING,
      open_date_time: Sequelize.DATE,
      close_date_time: Sequelize.DATE,
      same_bid_price_allowed: Sequelize.BOOLEAN,
      hide_current_bid_price: Sequelize.BOOLEAN,
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE,
    });

    await queryInterface.addIndex("rfqs", ["buyer_id"]);
    await queryInterface.addIndex("rfqs", ["type", "status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("rfqs");
  },
};
