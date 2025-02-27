import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import MapComponent from "./components/MapComponent";

const socket = io("http://localhost:5001");

function App() {
  const [locations, setLocations] = useState({
    source: null,
    sourceCoords: null,
    destination: null,
    destinationCoords: null,
  });

  useEffect(() => {
    socket.on("locationsUpdated", (data) => {
      console.log("Received location update:", data);
      setLocations((prevLocations) => ({
        ...prevLocations,
        ...data,
      }));
    });

    return () => {
      socket.off("locationsUpdated");
    };
  }, []);

  const updateLocations = (newLocations) => {
    if (!newLocations) return;

    console.log("Sending location update:", newLocations);
    socket.emit("updateLocations", newLocations);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      {/* ✅ Navbar with centered heading */}
      <nav className="w-full bg-blue-600 text-white py-4 shadow-md">
        <h1 className="text-center text-2xl font-bold">Live Map Tracker</h1>
      </nav>

      {/* ✅ Main Content Container */}
      <div className="w-full max-w-4xl mt-6 p-4 bg-white shadow-lg rounded-lg">
        <MapComponent locations={locations} updateLocations={updateLocations} />
      </div>
    </div>
  );
}

export default App;
