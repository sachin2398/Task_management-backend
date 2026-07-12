const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie;
    let token = null;

    if (cookieHeader) {
      const cookies = cookieHeader.split("; ").reduce((acc, currentCookie) => {
        const [key, value] = currentCookie.split("=");
        acc[key] = value;
        return acc;
      }, {});
      token = cookies.token;
    }

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Authentication failed"));
  }
};
