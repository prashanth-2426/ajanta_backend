const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.get("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ isSuccess: false, msg: "Unauthorized!!" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    return res.status(401).json({ isSuccess: false, msg: "Unauthorized!!" });
  }
};

module.exports = {
  verifyToken,
};
