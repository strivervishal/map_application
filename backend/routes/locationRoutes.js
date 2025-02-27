const express = require("express");
const axios = require("axios");
const Location = require("../models/Location");
const router = express.Router();
const dotenv = require("dotenv");

dotenv.config();
const GEOCODING_API = process.env.GEOCODING_API;

if (!GEOCODING_API) {
  console.error("❌ ERROR: GEOCODING_API is not set in .env file");
}

// 🔹 Helper function to get coordinates and check if location is in India
const getCoordinates = async (location) => {
  try {
    const response = await axios.get(
      `${GEOCODING_API}?q=${location}&format=json`
    );
    if (response.data.length === 0) return null;

    const { lat, lon, display_name } = response.data[0];

    // ✅ Ensure the location is in India
    if (!display_name.includes("India")) {
      return null;
    }

    return {
      coords: [parseFloat(lat), parseFloat(lon)],
      name: display_name,
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

// 🔹 Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (coords1, coords2) => {
  const toRad = (degree) => (degree * Math.PI) / 180;
  const R = 6371; // Earth's radius in km

  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return (R * c).toFixed(2); // Distance in kilometers
};

// ✅ Fetch all locations
router.get("/locations", async (req, res) => {
  try {
    const locations = await Location.find();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// ✅ Save a new location and return distance
router.post("/locations", async (req, res) => {
  try {
    const { source, destination } = req.body;

    const sourceData = await getCoordinates(source);
    const destinationData = await getCoordinates(destination);

    if (!sourceData || !destinationData) {
      return res
        .status(400)
        .json({ message: "Invalid locations or not in India" });
    }

    const distance = calculateDistance(
      sourceData.coords,
      destinationData.coords
    );

    const newLocation = new Location({
      source: sourceData.name,
      sourceCoords: sourceData.coords,
      destination: destinationData.name,
      destinationCoords: destinationData.coords,
    });

    await newLocation.save();

    res.json({
      ...newLocation._doc,
      distance: `${distance} km`,
    });
  } catch (error) {
    res.status(500).json({ message: "Error saving location" });
  }
});

// ✅ Search locations
router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "No search query provided" });
    }

    console.log("Search Query:", query);

    const results = await Location.find({
      $or: [
        { source: { $regex: query, $options: "i" } },
        { destination: { $regex: query, $options: "i" } },
      ],
    });

    res.json(results);
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
