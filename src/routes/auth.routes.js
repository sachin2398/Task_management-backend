const express = require("express");

const router = express.Router();

const {
  register,
  login,
  
   logout,
   getMe,
} = require("../controllers/auth.controller");

const validate = require("../middleware/validate.middleware");

const {
  registerValidation,
  loginValidation,
} = require("../validators/auth.validator");
const authenticate = require("../middleware/auth.middleware");
router.post(
  "/register",
  registerValidation,
  validate,
  register
);

router.post(
  "/login",
  loginValidation,
  validate,
  login
);
router.get("/me", authenticate, getMe);
router.post("/logout", logout);

module.exports = router;