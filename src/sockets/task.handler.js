const Task = require("../models/Task");
const User = require("../models/User");

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

module.exports = (io, socket) => {
  

  socket.on("task:create", async (data, callback) => {
    try {
      const { title, description, assignedTo } = data;
      const currentUser = socket.user;
      let assigneeId = currentUser._id;

      if (assignedTo) {
        const assignee = await User.findById(assignedTo);
        if (!assignee) return callback({ success: false, message: "Assigned user not found" });
        if (!canAssignTask(currentUser, assignee)) {
          return callback({ success: false, message: "You are not authorized to assign a task to this user." });
        }
        assigneeId = assignee._id;
      }

      const task = await Task.create({
        title, description, status: "Pending",
        createdBy: currentUser._id, assignedBy: currentUser._id, assignedTo: assigneeId,
      });

      io.emit("task:created", task);
      callback({ success: true, message: "Task created successfully.", data: task });
    } catch (error) {
      callback({ success: false, message: error.message });
    }
  });


  socket.on("task:update", async (data, callback) => {
    try {
      const { id, title, description, status, assignedTo } = data;
      const currentUser = socket.user;
      
      const task = await Task.findById(id).populate("assignedTo", "role");
      if (!task) return callback({ success: false, message: "Task not found" });

      if (currentUser.role === "Employee") {
        if (task.assignedTo._id.toString() !== currentUser._id.toString()) {
          return callback({ success: false, message: "You can update only your own tasks." });
        }
      } else if (currentUser.role === "TeamLead") {
        if (task.assignedTo._id.toString() !== currentUser._id.toString() && task.assignedTo.role !== "Employee") {
          return callback({ success: false, message: "You are not allowed to update this task." });
        }
      }

      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) task.status = status;
      
      if (assignedTo && assignedTo !== task.assignedTo._id.toString()) {
        const assignee = await User.findById(assignedTo);
        if (!assignee) return callback({ success: false, message: "Assigned user not found" });
        if (!canAssignTask(currentUser, assignee)) {
          return callback({ success: false, message: "You are not authorized to assign a task to this user." });
        }
        task.assignedTo = assignee._id;
      }

      await task.save();
      io.emit("task:updated", task);
      callback({ success: true, message: "Task updated successfully.", data: task });
    } catch (error) {
      callback({ success: false, message: error.message });
    }
  });


  socket.on("task:delete", async (data, callback) => {
    try {
      const { id } = data;
      const currentUser = socket.user;
      
      const task = await Task.findById(id).populate("assignedTo", "role");
      if (!task) return callback({ success: false, message: "Task not found" });

      if (currentUser.role === "Employee") {
        if (task.assignedTo._id.toString() !== currentUser._id.toString()) {
          return callback({ success: false, message: "You can delete only your own tasks." });
        }
      } else if (currentUser.role === "TeamLead") {
        if (task.assignedTo._id.toString() !== currentUser._id.toString() && task.assignedTo.role !== "Employee") {
          return callback({ success: false, message: "You are not authorized to delete this task." });
        }
      }

      const taskId = task._id;
      await task.deleteOne();
      
      io.emit("task:deleted", { _id: taskId });
      callback({ success: true, message: "Task deleted successfully." });
    } catch (error) {
      callback({ success: false, message: error.message });
    }
  });


  socket.on("task:assign", async (data, callback) => {
    try {
      const { id, assignedTo } = data;
      const currentUser = socket.user;
      
      if (!assignedTo) return callback({ success: false, message: "assignedTo is required." });

      const task = await Task.findById(id);
      if (!task) return callback({ success: false, message: "Task not found." });

      const assignee = await User.findById(assignedTo);
      if (!assignee) return callback({ success: false, message: "Assigned user not found." });

      if (currentUser.role === "Employee") {
        return callback({ success: false, message: "Employees cannot assign tasks." });
      }

      if (!canAssignTask(currentUser, assignee)) {
        return callback({ success: false, message: "You are not authorized to assign a task to this user." });
      }

      task.assignedTo = assignee._id;
      task.assignedBy = currentUser._id;
      await task.save();

      io.emit("task:assigned", task);
      callback({ success: true, message: "Task assigned successfully.", data: task });
    } catch (error) {
      callback({ success: false, message: error.message });
    }
  });


  socket.on("task:updateStatus", async (data, callback) => {
    try {
      const { id, status } = data;
      const currentUser = socket.user;

      if (!["Pending", "Completed"].includes(status)) {
        return callback({ success: false, message: "Status must be Pending or Completed." });
      }

      const task = await Task.findById(id).populate("assignedTo", "role");
      if (!task) return callback({ success: false, message: "Task not found." });

      if (currentUser.role === "Employee") {
        if (task.assignedTo._id.toString() !== currentUser._id.toString()) {
          return callback({ success: false, message: "You can update only your own tasks." });
        }
      } else if (currentUser.role === "TeamLead") {
        if (task.assignedTo._id.toString() !== currentUser._id.toString() && task.assignedTo.role !== "Employee") {
          return callback({ success: false, message: "You are not allowed to update this task." });
        }
      }

      task.status = status;
      await task.save();

      io.emit("task:statusChanged", task);
      callback({ success: true, message: "Task status updated successfully.", data: task });
    } catch (error) {
      callback({ success: false, message: error.message });
    }
  });


  socket.on("task:getAll", async (data, callback) => {
    try {
      const currentUser = socket.user;
      const status = data?.status;
      let query = {};

      if (currentUser.role === "Employee") {
        query.assignedTo = currentUser._id;
      } else if (currentUser.role === "TeamLead") {
        const employees = await User.find({ role: "Employee" }).select("_id");
        const employeeIds = employees.map(e => e._id);
        query.$or = [
          { assignedTo: currentUser._id },
          { assignedTo: { $in: employeeIds } },
        ];
      } else if (currentUser.role === "Manager") {
        const users = await User.find({ role: { $in: ["Employee", "TeamLead"] } }).select("_id");
        const userIds = users.map(u => u._id);
        query.$or = [
          { assignedTo: currentUser._id },
          { assignedTo: { $in: userIds } },
        ];
      }

      if (status) {
        query.status = status;
      }

      const tasks = await Task.find(query)
        .populate("createdBy", "username email role")
        .populate("assignedBy", "username email role")
        .populate("assignedTo", "username email role")
        .sort({ createdAt: -1 });

      callback({ success: true, count: tasks.length, data: tasks });
    } catch (error) {
      callback({ success: false, message: error.message });
    }
  });


  socket.on("task:getById", async (data, callback) => {
    try {
      const { id } = data;
      const currentUser = socket.user;

      const task = await Task.findById(id)
        .populate("createdBy", "username email role")
        .populate("assignedBy", "username email role")
        .populate("assignedTo", "username email role");

      if (!task) return callback({ success: false, message: "Task not found." });

      if (currentUser.role === "Employee") {
        if (task.assignedTo._id.toString() !== currentUser._id.toString()) {
          return callback({ success: false, message: "You are not authorized to view this task." });
        }
      } else if (currentUser.role === "TeamLead") {
        if (task.assignedTo._id.toString() !== currentUser._id.toString() && task.assignedTo.role !== "Employee") {
          return callback({ success: false, message: "You are not authorized to view this task." });
        }
      }

      callback({ success: true, data: task });
    } catch (error) {
      callback({ success: false, message: error.message });
    }
  });

};
