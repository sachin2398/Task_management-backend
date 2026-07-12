const User = require("../models/User");

// ================================
// Get All Users (Manager)
// ================================

exports.getAllUsers = async (req, res) => {
  try {
    // Get all users except managers (return only team leads and employees)
    const users = await User.find({
      role: { $ne: "Manager" }
    }).select("-password");

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// Get Employees
// ================================

exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.find({
      role: "Employee",
    }).select("-password");

    return res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================================
// Get Team Leads
// ================================

exports.getTeamLeads = async (req, res) => {
  try {
    const teamLeads = await User.find({
      role: "TeamLead",
    }).select("-password");

    return res.status(200).json({
      success: true,
      count: teamLeads.length,
      data: teamLeads,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAssignableUsers = async (req, res) => {
  try {

    let users = [];

    switch (req.user.role) {

      case "Manager":

        users = await User.find({
          role: { $in: ["TeamLead", "Employee"] },
          _id: { $ne: req.user._id }
        }).select("-password");

        break;

      case "TeamLead":

        users = await User.find({
          role: "Employee"
        }).select("-password");

        break;

      case "Employee":

        users = [];

        break;
    }

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};