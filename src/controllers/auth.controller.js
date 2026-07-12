const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const cookieOptions = require("../utils/cookieOptions");
const userResponse = require("../utils/userResponse");
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      role,
    });

    const token = generateToken(user);
res.cookie("token", token, cookieOptions);

return res.status(201).json({
  success: true,
  message: "User registered successfully",
  data: userResponse(user),
});
  
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user);

  res.cookie("token", token, cookieOptions);

return res.status(200).json({
  success: true,
  message: "Login successful",
  data:  userResponse(user),
});
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getMe = async (req, res) => {

    return res.status(200).json({

        success: true,

        data: {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role
        }

    });

};
exports.logout = async (req, res) => {
  res.clearCookie("token");

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
};