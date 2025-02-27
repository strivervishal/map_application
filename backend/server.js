// Backend: server.js (Express + Socket.io + MongoDB)
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://map-vng5.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins or specify frontend origins
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});


io.on("connection", (socket) => {
  console.log("User connected: ", socket.id);

  socket.on("updateLocations", (data) => {
    console.log("Received location data: ", data);
    io.emit("locationsUpdated", data); // Broadcast to all users
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: ", socket.id);
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
