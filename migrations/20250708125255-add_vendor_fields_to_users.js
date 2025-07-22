"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "company", {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn("users", "mobile", {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn("users", "industry", {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn("users", "subIndustry", {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn("users", "product", {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn("users", "gst_number", {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn("users", "pan_number", {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn("users", "address_line1", {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn("users", "address_line2", {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn("users", "city", { type: Sequelize.STRING });
    await queryInterface.addColumn("users", "state", {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn("users", "country", {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn("users", "zipcode", {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn("users", "is_approved", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn("users", "registration_source", {
      type: Sequelize.STRING,
      defaultValue: "excel",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "company");
    await queryInterface.removeColumn("users", "mobile");
    await queryInterface.removeColumn("users", "industry");
    await queryInterface.removeColumn("users", "subIndustry");
    await queryInterface.removeColumn("users", "product");
    await queryInterface.removeColumn("users", "gst_number");
    await queryInterface.removeColumn("users", "pan_number");
    await queryInterface.removeColumn("users", "address_line1");
    await queryInterface.removeColumn("users", "address_line2");
    await queryInterface.removeColumn("users", "city");
    await queryInterface.removeColumn("users", "state");
    await queryInterface.removeColumn("users", "country");
    await queryInterface.removeColumn("users", "zipcode");
    await queryInterface.removeColumn("users", "is_approved");
    await queryInterface.removeColumn("users", "registration_source");
  },
};
