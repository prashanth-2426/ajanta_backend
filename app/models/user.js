"use strict";
const { Model } = require("sequelize");
const { hashPassword } = require("../utils/auth");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init(
    {
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      passwordExpiry: DataTypes.DATE,
      token: DataTypes.STRING,
      lastLogin: DataTypes.DATE,
      role: DataTypes.STRING,
      profilePictrue: DataTypes.STRING,
      company: DataTypes.STRING,
      mobile: DataTypes.STRING,
      industry: DataTypes.STRING,
      subIndustry: DataTypes.STRING,
      product: DataTypes.STRING,
      gst_number: DataTypes.STRING,
      pan_number: DataTypes.STRING,
      address_line1: DataTypes.STRING,
      address_line2: DataTypes.STRING,
      city: DataTypes.STRING,
      state: DataTypes.STRING,
      country: DataTypes.STRING,
      zipcode: DataTypes.STRING,
      is_approved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      registration_source: {
        type: DataTypes.STRING,
        defaultValue: "excel",
      },
    },
    {
      sequelize,
      tableName: "users",
      modelName: "User",
    }
  );

  User.beforeCreate(async (user) => {
    user.password = await hashPassword(user.password);
  });

  User.beforeUpdate(async (user) => {
    if (user.changed("password")) {
      user.password = await hashPassword(user.password);
    }
  });

  return User;
};
