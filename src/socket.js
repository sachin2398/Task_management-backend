let io;

module.exports = {
  setIO: (socketIO) => {
    io = socketIO;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.IO not initialized!");
    }
    return io;
  }
};
