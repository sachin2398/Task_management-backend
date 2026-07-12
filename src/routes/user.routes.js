const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  getAllUsers,
  getEmployees,
  getTeamLeads,
  getAssignableUsers,
} = require("../controllers/user.controller");


router.get(
  "/",
  authenticate,
  authorizeRoles("Manager"),
  getAllUsers
);


router.get(
  "/employees",
  authenticate,
  authorizeRoles("Manager", "TeamLead"),
  getEmployees
);

router.get(
  "/teamleads",
  authenticate,
  authorizeRoles("Manager"),
  getTeamLeads
);
router.get(
  "/assignable",
  authenticate,
  getAssignableUsers
);
module.exports = router;