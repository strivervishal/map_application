import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import { io } from "socket.io-client";
import axios from "axios";
import { ArrowUpDown, Map as MapIcon, X, LocateFixed } from "lucide-react";
import "leaflet/dist/leaflet.css";

const socket = io("https://map-application-8i6f.vercel.app");

const MapComponent = ({ locations, updateLocations }) => {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [distance, setDistance] = useState(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [route, setRoute] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Prevent multiple calls

  useEffect(() => {
    socket.on("locationsUpdated", (data) => {
      updateLocations(data);
      calculateDistance(data.sourceCoords, data.destinationCoords);
      setRoute([data.sourceCoords, data.destinationCoords]);
    });

    return () => socket.off("locationsUpdated");
  }, [updateLocations]); // Only runs when locations change

  const handleSwap = () => {
    setSource(destination);
    setDestination(source);
    setDistance(null); // Reset distance when swapping
  };

  const handleSearch = async () => {
    if (!source || !destination) {
      alert("Please enter both source and destination.");
      return;
    }

    if (isLoading) return; // Prevent multiple calls
    setIsLoading(true);

    try {
      const response = await axios.post(
        "https://map-application-8i6f.vercel.app/api/locations",
        {
          source,
          destination,
        }
      );

      updateLocations(response.data);
      calculateDistance(
        response.data.sourceCoords,
        response.data.destinationCoords
      );
      setRoute([response.data.sourceCoords, response.data.destinationCoords]);
      setIsMapOpen(true);
    } catch (error) {
      console.error("Search Error:", error);
    } finally {
      setIsLoading(false);
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

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation([latitude, longitude]);

        try {
          const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const locationName = res.data.display_name || "Current Location";
          setSource(locationName);
        } catch (error) {
          console.error("Error fetching location name:", error);
          setSource(`${latitude}, ${longitude}`);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Could not fetch your location.");
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
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

      {/* Location & Search Buttons */}
      <div className="flex space-x-4 mt-4">
        <button
          onClick={getCurrentLocation}
          className="w-1/3 bg-purple-500 text-white text-lg font-semibold py-3 rounded-lg hover:bg-purple-600 transition duration-300 shadow-md flex justify-center items-center"
        >
          <LocateFixed size={24} className="mr-2" />
          Use My Location
        </button>

        <button
          onClick={handleSearch}
          className="w-2/3 bg-blue-500 text-white text-lg font-semibold py-3 rounded-lg hover:bg-blue-600 transition duration-300 shadow-md"
        >
          🔍 Search Route
        </button>
      </div>

      {/* Distance Display */}
      {distance && source && destination && (
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
              className="absolute top-5 right-5 bg-red-500 text-white p-3 rounded-full shadow-md hover:bg-red-600 transition text-lg z-50"
            >
              <X size={24} />
            </button>

            <MapContainer
              center={currentLocation || [20, 78]}
              zoom={currentLocation ? 12 : 5}
              className="h-[500px] w-full rounded-lg relative z-10"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              {currentLocation && (
                <Marker position={currentLocation}>
                  <Popup>📍 You are here</Popup>
                </Marker>
              )}

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

              {route.length === 2 && (
                <Polyline positions={route} color="blue" />
              )}
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
