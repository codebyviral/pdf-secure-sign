import { useState } from "react";
import "./App.css"; // Import the CSS file

function App() {

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Please choose a PDF first");
    setLoading(true);

    const formData = new FormData();
    formData.append("pdf", file);
    // Call our backend
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/sign-pdf`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      alert("Signing failed!");
      setLoading(false);
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "digitally-signed.pdf";
    link.click();
    setLoading(false);
  };

  return (
    <div className="app-container">
      <div className="card">
        <h2>📄 Digital PDF Signature</h2>
        <p className="subtitle">Upload and digitally sign your PDF instantly</p>

        <div className="upload-section">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="file-input"
          />
          {file && <p className="file-name">Selected: {file.name}</p>}
        </div>

        <button onClick={handleUpload} disabled={loading} className="btn">
          {loading ? "Signing..." : "Upload & Digitally Sign"}
        </button>
      </div>
    </div>
  );
}

export default App;
