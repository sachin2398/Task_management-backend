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

        const allowedOrigins = [
            process.env.FRONTEND_URL,
            "https://task-management-frontend-ashy-zeta.vercel.app",
            "http://localhost:4200",
            "http://localhost:3000",
        ].filter(Boolean);

        const io = new Server(server, {
            cors: {
                origin: (origin, callback) => {
                    if (!origin) return callback(null, true);
                    const cleanOrigin = origin.replace(/\/$/, "");
                    const isAllowed = allowedOrigins.some(allowed => allowed.replace(/\/$/, "") === cleanOrigin);
                    if (isAllowed || cleanOrigin.endsWith(".vercel.app") || cleanOrigin.includes("localhost")) {
                        callback(null, true);
                    } else {
                        callback(new Error(`Origin ${origin} not allowed by CORS`));
                    }
                },
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
