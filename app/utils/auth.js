const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const hashPassword = async (password) => {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(password, salt);
};

const generateToken = async (user) => {
  return jwt.sign(user, process.env.SECRET_KEY);
};

module.exports = {
  hashPassword,
  generateToken,
};
