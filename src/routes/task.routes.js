const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/auth.middleware");

const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  assignTask,
   updateTaskStatus,
} = require("../controllers/task.controller");

router.use(authenticate);

router.post("/", createTask);

router.get("/", getTasks);
router.get("/:id", getTaskById);

router.put("/:id", updateTask);

router.delete("/:id", deleteTask);

router.patch("/:id/assign", assignTask);
router.patch("/:id/status", updateTaskStatus);

module.exports = router;