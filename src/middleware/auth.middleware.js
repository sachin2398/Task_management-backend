const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  try {

    let token = null;



    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }



    if (
      !token &&
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }



    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login.",
      });
    }



    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

   

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    req.user = user;

    next();

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: "Invalid or expired session. Please login again.",
    });

  }
};

module.exports = authenticate;