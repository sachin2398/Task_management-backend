const Task = require("../models/Task");
const { getIO } = require("../socket");

const checkTaskVisibility = (task, currentUser) => {
  const currentUserId = currentUser._id.toString();
  const currentUserRole = currentUser.role;

  const creatorId = task.createdBy._id ? task.createdBy._id.toString() : task.createdBy.toString();
  const creatorRole = task.createdBy.role || "Employee";

  const assigneeId = task.assignedTo._id ? task.assignedTo._id.toString() : task.assignedTo.toString();
  const assigneeRole = task.assignedTo.role || "Employee";

  // Rule 1: Manager assigns to self
  if (creatorRole === "Manager" && creatorId === assigneeId) {
    return currentUserId === creatorId;
  }

  // Rule 2: Assigned to Team Lead OR created by Team Lead
  if (assigneeRole === "TeamLead" || creatorRole === "TeamLead") {
    if (currentUserRole === "Manager") return true;
    if (currentUserRole === "TeamLead" && (currentUserId === creatorId || currentUserId === assigneeId)) return true;
    if (currentUserRole === "Employee" && currentUserId === assigneeId) return true;
    return false;
  }

  // Rule 3: Employee task (assigned to Employee)
  if (assigneeRole === "Employee") {
    if (currentUserRole === "Manager") return true;
    if (currentUserRole === "TeamLead") return true;
    if (currentUserId === assigneeId) return true;
    return false;
  }

  return currentUserId === creatorId || currentUserId === assigneeId;
};

const populateTask = async (task) => {
  return await Task.findById(task._id)
    .populate("createdBy", "username email role")
    .populate("assignedBy", "username email role")
    .populate("assignedTo", "username email role");
};

const emitTaskEvent = async (eventName, task) => {
  try {
    const io = getIO();
    const populatedTask = await populateTask(task);
    if (!populatedTask) return;
    const sockets = io.sockets.sockets;
    for (const [socketId, socket] of sockets.entries()) {
      if (socket.user && checkTaskVisibility(populatedTask, socket.user)) {
        socket.emit(eventName, populatedTask);
      }
    }
  } catch (error) {
    console.error(`Error emitting event ${eventName}:`, error);
  }
};

const emitTaskDeleteEvent = async (task) => {
  try {
    const io = getIO();
    const populatedTask = await populateTask(task);
    if (!populatedTask) return;
    const sockets = io.sockets.sockets;
    for (const [socketId, socket] of sockets.entries()) {
      if (socket.user && checkTaskVisibility(populatedTask, socket.user)) {
        socket.emit("task:deleted", { _id: task._id });
      }
    }
  } catch (error) {
    console.error("Error emitting task delete event:", error);
  }
};

module.exports = {
  checkTaskVisibility,
  populateTask,
  emitTaskEvent,
  emitTaskDeleteEvent,
};
