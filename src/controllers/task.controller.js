
const Task = require("../models/Task");
const User = require("../models/User");
const { getIO } = require("../socket");
const {
  checkTaskVisibility,
  emitTaskEvent,
  emitTaskDeleteEvent
} = require("../utils/taskHelper");

const canAssignTask = (currentUser, assignee) => {
  if (currentUser._id.toString() === assignee._id.toString()) {
    return true;
  }
  if (currentUser.role === "Employee") {
    return false;
  }
  if (currentUser.role === "TeamLead") {
    return assignee.role === "Employee";
  }
  if (currentUser.role === "Manager") {
    return assignee.role !== "Manager";
  }
  return false;
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, assignedTo } = req.body;

    const currentUser = req.user;

    let assigneeId = currentUser._id;


    if (assignedTo) {
      const assignee = await User.findById(assignedTo);

      if (!assignee) {
        return res.status(404).json({
          success: false,
          message: "Assigned user not found",
        });
      }

      if (!canAssignTask(currentUser, assignee)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to assign a task to this user.",
        });
      }

      assigneeId = assignee._id;
    }

    const task = await Task.create({
      title,
      description,
      status: "Pending",

      createdBy: currentUser._id,

      assignedBy: currentUser._id,

      assignedTo: assigneeId,
    });

    await emitTaskEvent("task:created", task);

    return res.status(201).json({
      success: true,
      message: "Task created successfully.",
      data: task,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const currentUser = req.user;
    const { status } = req.query;

    let query = {};


    if (currentUser.role === "Employee") {
      query.assignedTo = currentUser._id;
    }


    else if (currentUser.role === "TeamLead") {
      const employees = await User.find({
        role: "Employee",
      }).select("_id");

      const employeeIds = employees.map((employee) => employee._id);

      query.$or = [
        {
          assignedTo: currentUser._id,
        },
        {
          assignedTo: {
            $in: employeeIds,
          },
        },
      ];
    }


    else if (currentUser.role === "Manager") {
      const users = await User.find({
        role: {
          $in: ["Employee", "TeamLead"],
        },
      }).select("_id");

      const userIds = users.map((user) => user._id);

      query.$or = [
        {
          assignedTo: currentUser._id,
        },
        {
          assignedTo: {
            $in: userIds,
          },
        },
      ];
    }



    if (status) {
      query.status = status;
    }

    let tasks = await Task.find(query)
      .populate("createdBy", "username email role")
      .populate("assignedBy", "username email role")
      .populate("assignedTo", "username email role")
      .sort({
        createdAt: -1,
      });

    tasks = tasks.filter(task => checkTaskVisibility(task, currentUser));

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { title, description, status, assignedTo } = req.body;

    const currentUser = req.user;

    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "role")
      .populate("createdBy", "role");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!checkTaskVisibility(task, currentUser)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this task.",
      });
    }

    if (title !== undefined) task.title = title;

    if (description !== undefined) task.description = description;

    if (status !== undefined) task.status = status;

    if (assignedTo && assignedTo !== task.assignedTo._id.toString()) {
      const assignee = await User.findById(assignedTo);
      if (!assignee) {
        return res.status(404).json({ success: false, message: "Assigned user not found" });
      }
      if (!canAssignTask(currentUser, assignee)) {
        return res.status(403).json({ success: false, message: "You are not authorized to assign a task to this user." });
      }
      task.assignedTo = assignee._id;
    }

    await task.save();

    await emitTaskEvent("task:updated", task);

    return res.status(200).json({
      success: true,
      message: "Task updated successfully.",
      data: task,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

exports.deleteTask = async (req, res) => {
  try {
    const currentUser = req.user;

    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "role")
      .populate("createdBy", "role");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    if (!checkTaskVisibility(task, currentUser)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this task.",
      });
    }

    const taskId = task._id;

    await emitTaskDeleteEvent(task);

    await task.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully.",
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

exports.assignTask = async (req, res) => {
  try {
    const { assignedTo } = req.body;

    const currentUser = req.user;

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: "assignedTo is required.",
      });
    }

    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "role")
      .populate("createdBy", "role");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    if (!checkTaskVisibility(task, currentUser)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to assign this task.",
      });
    }

    const assignee = await User.findById(assignedTo);

    if (!assignee) {
      return res.status(404).json({
        success: false,
        message: "Assigned user not found.",
      });
    }

    if (!canAssignTask(currentUser, assignee)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to assign a task to this user.",
      });
    }

    task.assignedTo = assignee._id;

    task.assignedBy = currentUser._id;

    await task.save();

    await emitTaskEvent("task:assigned", task);

    return res.status(200).json({
      success: true,
      message: "Task assigned successfully.",
      data: task,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const currentUser = req.user;

    if (!["Pending", "Completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Pending or Completed.",
      });
    }

    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "role")
      .populate("createdBy", "role");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    if (!checkTaskVisibility(task, currentUser)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this task.",
      });
    }

    task.status = status;

    await task.save();

    await emitTaskEvent("task:statusChanged", task);

    return res.status(200).json({
      success: true,
      message: "Task status updated successfully.",
      data: task,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



exports.getTaskById = async (req, res) => {
  try {

    const currentUser = req.user;

    const task = await Task.findById(req.params.id)
      .populate("createdBy", "username email role")
      .populate("assignedBy", "username email role")
      .populate("assignedTo", "username email role");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }
    if (!checkTaskVisibility(task, currentUser)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this task.",
      });
    }



    return res.status(200).json({
      success: true,
      data: task,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};