import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { io } from "socket.io-client";
import axios from "axios";
import { ArrowUpDown, Map as MapIcon, X } from "lucide-react"; // Swap & Map Icons
import "leaflet/dist/leaflet.css"; // Import Leaflet styles

const socket = io("http://localhost:5000");

const MapComponent = ({ locations, updateLocations }) => {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [distance, setDistance] = useState(null);
  const [isMapOpen, setIsMapOpen] = useState(false); // Modal for full-screen map

  useEffect(() => {
    socket.on("locationsUpdated", (data) => {
      updateLocations(data);
      calculateDistance(data.sourceCoords, data.destinationCoords);
    });

    return () => socket.off("locationsUpdated");
  }, []);

  const handleSwap = () => {
    setSource(destination);
    setDestination(source);
  };

  const handleSearch = async () => {
    try {
      if (!source || !destination) {
        alert("Please enter both source and destination.");
        return;
      }

      const response = await axios.post("http://localhost:5000/api/locations", {
        source,
        destination,
      });

      updateLocations(response.data);
      calculateDistance(
        response.data.sourceCoords,
        response.data.destinationCoords
      );
    } catch (error) {
      console.error("Search Error:", error);
    }
  };

  const calculateDistance = (coords1, coords2) => {
    if (!coords1 || !coords2) return;

    const [lat1, lon1] = coords1;
    const [lat2, lon2] = coords2;

    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    setDistance(distanceKm.toFixed(2));
  };

  return (
    <div className="max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg rounded-xl p-6">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
        🌍 Find Your Route
      </h2>

      {/* Input Fields & Swap Button */}
      <div className="flex items-center space-x-3">
        <input
          type="text"
          placeholder="Enter Source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="border border-gray-300 p-3 rounded-lg w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <button
          onClick={handleSwap}
          className="p-3 bg-gray-300 rounded-lg shadow-md hover:bg-gray-400 transition duration-300"
        >
          <ArrowUpDown size={24} className="text-gray-700" />
        </button>

        <input
          type="text"
          placeholder="Enter Destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="border border-gray-300 p-3 rounded-lg w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Search & View Map Buttons */}
      <div className="flex space-x-4 mt-4">
        <button
          onClick={handleSearch}
          className="w-full bg-blue-500 text-white text-lg font-semibold py-3 rounded-lg hover:bg-blue-600 transition duration-300 shadow-md"
        >
          🔍 Search Route
        </button>
        <button
          onClick={() => setIsMapOpen(true)}
          className="w-1/4 bg-green-500 text-white text-lg font-semibold py-3 rounded-lg hover:bg-green-600 transition duration-300 shadow-md flex justify-center items-center"
        >
          <MapIcon size={24} />
        </button>
      </div>

      {/* Distance Display */}
      {distance && (
        <div className="mt-4 text-center">
          <p className="text-lg font-semibold text-gray-600">
            🚗 Distance: <span className="text-blue-500">{distance} km</span>
          </p>
        </div>
      )}

      {/* Full-Screen Map Modal */}
      {isMapOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-4xl shadow-xl relative">
            <button
              onClick={() => setIsMapOpen(false)}
              className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-md hover:bg-red-600 transition"
            >
              <X size={20} />
            </button>

            <MapContainer
              center={[20, 78]}
              zoom={5}
              className="h-[500px] w-full rounded-lg"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {locations.sourceCoords && (
                <Marker position={locations.sourceCoords}>
                  <Popup>📍 Source: {locations.source}</Popup>
                </Marker>
              )}
              {locations.destinationCoords && (
                <Marker position={locations.destinationCoords}>
                  <Popup>📍 Destination: {locations.destination}</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
