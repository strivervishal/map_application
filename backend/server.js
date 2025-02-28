const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const http = require("http");

dotenv.config();
const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: "https://map-application-alpha.vercel.app", // ✅ Allow frontend domain
    methods: ["GET", "POST"], // ✅ Define allowed methods
    credentials: true, // ✅ Allow cookies if needed
  })
);
const io = new Server(server, {
  cors: {
    origin: "https://map-application-alpha.vercel.app",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Routes
const locationRoutes = require("./routes/locationRoutes");
app.use("/api", locationRoutes);

// Socket.io
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("updateLocations", async (data) => {
    io.emit("locationsUpdated", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
