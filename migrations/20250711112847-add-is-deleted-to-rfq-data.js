module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("rfq_data", "is_deleted", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("rfq_data", "is_deleted");
  },
};
