require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { setIO } = require("./src/socket");

const PORT = process.env.PORT || 6060;

const startServer = async () => {

    try {

        await connectDB();

        const server = http.createServer(app);

        const io = new Server(server, {
            cors: {
                origin: "http://localhost:4200",
                credentials: true,
            },
        });

        setIO(io);

        const socketAuth = require("./src/middleware/socketAuth.middleware");
        const taskHandler = require("./src/sockets/task.handler");

        io.use(socketAuth);

        io.on("connection", (socket) => {
            console.log(`⚡ Authenticated client connected: ${socket.user.username} (${socket.id})`);

            taskHandler(io, socket);

            socket.on("disconnect", () => {
                console.log(`❌ Client disconnected: ${socket.id}`);
            });
        });

        server.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });

    } catch (error) {

        console.error(error.message);

        process.exit(1);

    }

};

startServer();