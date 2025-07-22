const { User } = require("../models");

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    return res.json({ isSuccess: true, users });
  } catch (error) {
    return res.status(500).json({ isSuccess: false, error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user)
      return res.status(404).json({ isSuccess: false, msg: "User not found" });
    return res.json({ isSuccess: true, user });
  } catch (error) {
    return res.status(500).json({ isSuccess: false, error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await User.update(req.body, { where: { id } });
    if (!updated)
      return res.status(404).json({ isSuccess: false, msg: "User not found" });
    return res.json({ isSuccess: true, msg: "User updated successfully" });
  } catch (error) {
    return res.status(500).json({ isSuccess: false, error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const deleted = await User.destroy({ where: { id: req.params.id } });
    if (!deleted)
      return res.status(404).json({ isSuccess: false, msg: "User not found" });
    return res.json({ isSuccess: true, msg: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ isSuccess: false, error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
