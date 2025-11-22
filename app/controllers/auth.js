const bcrypt = require("bcrypt");

const { User } = require("../models");
const { generateToken } = require("../utils/auth");

const register = async (req, res) => {
  const { name, email, password, role, isEdit, id } = req.body;
  const { confirmPassword, ...otherFields } = req.body;

  try {
    if (isEdit && id) {
      const user = await User.findByPk(id);
      if (!user) {
        return res
          .status(404)
          .json({ isSuccess: false, msg: "User not found." });
      }

      if (email !== user.email) {
        const existingEmailUser = await User.findOne({ where: { email } });
        if (existingEmailUser) {
          return res
            .status(400)
            .json({ isSuccess: false, msg: "Email already in use." });
        }
      }

      await user.update({
        name,
        email,
        role,
        ...otherFields,
        ...(password && { password }),
      });

      return res.status(200).json({
        isSuccess: true,
        msg: "User updated successfully!",
      });
    }
  } catch (error) {
    console.error("Error in user Editing:", error);
    return res.status(500).json({
      isSuccess: false,
      error: "Something went wrong while processing your request!",
    });
  }

  const user = await User.findOne({ where: { email: email } });

  if (user) {
    return res.json({
      isSuccess: false,
      msg: "User Already exist! Please login with your credentials.",
    });
  }
  try {
    const todayDate = new Date();
    const result = todayDate.setDate(
      todayDate.getDate() + process.env.PASSWORDEXPIRY
    );

    const newUser = await User.create({
      name,
      email,
      password,
      passwordExpiry: new Date(result),
      role,
      ...otherFields,
    });

    return res.status(201).send({
      isSuccess: true,
      msg: "User is created successfully! Please login",
    });
  } catch (error) {
    console.error("Error in user creation:", error);
    return res.status(500).json({
      isSuccess: false,
      error: "Something went wrong while creating the account!",
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email: email } });

  if (user) {
    const validatePassword = await bcrypt.compare(password, user.password);
    if (validatePassword) {
      const token = await generateToken({
        userId: user.id,
        email,
        name: user.name,
      });
      user.token = token;
      user.lastLogin = new Date();
      await user.save();

      return res.status(200).json({
        isSuccess: true,
        user: {
          id: user.id,
          name: user.name,
          email: email,
          token,
          role: user.role,
          company: user.company,
        },
      });
    } else {
      return res
        .status(403)
        .json({ isSuccess: false, msg: "Credentials are not matching!!" });
    }
  } else {
    return res
      .status(403)
      .json({ isSuccess: false, msg: "User not registerd!!" });
  }
};

const logout = async (req, res) => {
  const user = await User.findOne({
    where: { email: req.user.email, token: req.token },
  });

  user.token = null;
  await user.save();

  return res
    .status(200)
    .json({ isSuccess: true, msg: "Successfully logged out!" });
};

const validateEmail = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email: email } });
  if (user) {
    return res.json({
      isSuccess: true,
      msg: "Please enter your new password",
    });
  } else {
    return res.json({
      isSuccess: false,
      msg: "User not exist!!",
    });
  }
};

const updatePassword = async (req, res) => {
  const { email, password, newPassword } = req.body;

  const user = await User.findOne({ where: { email: email } });
  if (user) {
    const validPass = await bcrypt.compare(password, user.password);
    if (validPass) {
      const todayDate = new Date();
      const result = todayDate.setDate(
        todayDate.getDate() + process.env.PASSWORDEXPIRY
      );

      user.password = newPassword;
      user.passwordExpiry = new Date(result);
      await user.save();

      return res.json({
        isSuccess: true,
        msg: "Password has been updated successfully",
      });
    } else {
      return res
        .status(400)
        .json({ isSuccess: false, msg: "Old Password does not match!" });
    }
  } else {
    return res.status(403).json({
      isSuccess: false,
      msg: "You are trying to mulfunctioning!!",
    });
  }
};

const verifyToken = async (req, res) => {
  const user = await User.findOne({
    where: { email: req.user.email, token: req.token },
  });

  if (user)
    return res.status(200).json({ isSuccess: true, msg: "Valid user", user });
  return res.status(401).json({ isSuccess: false, msg: "Unauthorized!!" });
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        isSuccess: false,
        msg: "User not found",
      });
    }

    await user.destroy();

    return res.status(200).json({
      isSuccess: true,
      msg: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete User Error:", error);
    return res.status(500).json({
      isSuccess: false,
      msg: "Something went wrong while deleting the user",
    });
  }
};

const toggleUserApproval = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        isSuccess: false,
        msg: "User not found",
      });
    }

    user.is_approved = !user.is_approved;
    await user.save();

    return res.status(200).json({
      isSuccess: true,
      msg: `User is now ${user.is_approved ? "approved" : "unapproved"}`,
      is_approved: user.is_approved,
    });
  } catch (error) {
    console.error("Toggle Approval Error:", error);
    return res.status(500).json({
      isSuccess: false,
      msg: "Failed to update user status",
    });
  }
};

const getUserById = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user)
    return res.status(404).json({ isSuccess: false, msg: "User not found" });

  return res.json({ isSuccess: true, user });
};

const updateUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user)
    return res.status(404).json({ isSuccess: false, msg: "User not found" });

  await user.update(req.body);
  return res.json({ isSuccess: true, msg: "User updated successfully" });
};

module.exports = {
  register,
  login,
  logout,
  validateEmail,
  updatePassword,
  verifyToken,
  deleteUser,
  toggleUserApproval,
  getUserById,
  updateUser,
};
