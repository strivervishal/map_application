const mongoose = require("mongoose");

const LocationSchema = new mongoose.Schema({
  source: { type: String, required: true },
  sourceCoords: { type: [Number], required: true }, // [lat, lon]
  destination: { type: String, required: true },
  destinationCoords: { type: [Number], required: true }, // [lat, lon]
});

module.exports = mongoose.model("Location", LocationSchema);
