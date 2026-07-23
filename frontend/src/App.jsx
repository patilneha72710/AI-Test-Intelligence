import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState("Checking backend connection...");

  useEffect(() => {
    fetch("http://127.0.0.1:5000/health")
      .then((res) => res.json())
      .then((data) => {
        setStatus(`Backend connected! Status: ${data.status}`);
      })
      .catch(() => {
        setStatus("Could not connect to backend.");
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-2xl p-10 text-center max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          AI Test Intelligence Platform
        </h1>
        <p className="text-gray-500 mb-4">
          AI-powered test automation dashboard
        </p>
        <p className="text-green-600 font-medium">{status}</p>
      </div>
    </div>
  );
}

export default App;