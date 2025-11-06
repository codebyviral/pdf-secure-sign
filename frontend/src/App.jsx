import { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  CheckCircle,
  Shield,
  Lock,
  Download,
} from "lucide-react";

function App() {
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    commonName: "",
    organizationName: "",
    organizationalUnit: "",
    countryName: "",
    stateName: "",
    localityName: "",
    validityDays: 365,
    notBefore: "",
    notAfter: "",
  });
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [disableValidity, setDisableValidity] = useState(false);

  const steps = [
    { icon: "📄", text: "Processing PDF" },
    { icon: "🔐", text: "Generating Certificate" },
    { icon: "✍️", text: "Applying Digital Signature" },
    { icon: "✅", text: "Finalizing Document" },
  ];

  // Automatically disable validityDays if user sets both dates
  useEffect(() => {
    if (form.notBefore && form.notAfter) {
      setDisableValidity(true);
    } else {
      setDisableValidity(false);
    }
  }, [form.notBefore, form.notAfter]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleUpload = async () => {
    if (!file) return alert("Please choose a PDF first");
    if (!form.commonName.trim()) return alert("Please enter your name");
    if (!form.organizationName.trim())
      return alert("Please enter your organization");

    setLoading(true);
    setCurrentStep(0);

    const formData = new FormData();
    formData.append("pdf", file);

    // Send field names exactly as backend expects
    formData.append("commonName", form.commonName);
    formData.append("organizationName", form.organizationName);
    formData.append("organizationalUnit", form.organizationalUnit);
    formData.append("countryName", form.countryName);
    formData.append("stateName", form.stateName);
    formData.append("localityName", form.localityName);
    formData.append("validityDays", form.validityDays);
    formData.append("notBefore", form.notBefore);
    formData.append("notAfter", form.notAfter);

    // Simulate progress steps
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 800);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/sign-pdf`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Signing failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "digitally-signed.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to sign PDF. Please try again.");
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
      setCurrentStep(0);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-100 via-purple-50 to-pink-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Digital PDF Signature
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Secure your documents with cryptographically signed certificates.
            Generate and apply digital signatures in seconds.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left Panel - Form */}
            <div className="p-8 md:p-10 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                  <Lock className="w-6 h-6 text-indigo-600" />
                  Certificate Details
                </h2>
                <p className="text-sm text-gray-500">
                  Fill in your information for the digital certificate
                </p>
              </div>

              {/* Form Grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="commonName"
                      placeholder="John Doe"
                      value={form.commonName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Organization */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Organization *
                    </label>
                    <input
                      type="text"
                      name="organizationName"
                      placeholder="Acme Corporation"
                      value={form.organizationName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Department */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      name="organizationalUnit"
                      placeholder="IT Department"
                      value={form.organizationalUnit}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Country Code
                    </label>
                    <input
                      type="text"
                      name="countryName"
                      placeholder="IN"
                      maxLength="2"
                      value={form.countryName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors uppercase"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      State/Province
                    </label>
                    <input
                      type="text"
                      name="stateName"
                      placeholder="Gujarat"
                      value={form.stateName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="localityName"
                      placeholder="Ahmedabad"
                      value={form.localityName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Validity Days */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Validity (Days)
                    </label>
                    <input
                      type="number"
                      name="validityDays"
                      value={form.validityDays}
                      onChange={handleChange}
                      disabled={disableValidity}
                      className={`w-full px-4 py-3 rounded-xl border-2 ${
                        disableValidity
                          ? "border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                          : "border-gray-200 focus:border-indigo-500"
                      } focus:outline-none transition-colors`}
                    />
                    {disableValidity && (
                      <p className="text-xs text-gray-500 mt-1">
                        Disabled since custom validity dates are set
                      </p>
                    )}
                  </div>

                  {/* Valid From */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Valid From
                    </label>
                    <input
                      type="date"
                      name="notBefore"
                      value={form.notBefore}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Valid Until */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Valid Until
                    </label>
                    <input
                      type="date"
                      name="notAfter"
                      value={form.notAfter}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Upload & Action */}
            <div className="bg-linear-to-br from-indigo-50 to-purple-50 p-8 md:p-10 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                    <Upload className="w-6 h-6 text-indigo-600" />
                    Upload PDF
                  </h2>
                  <p className="text-sm text-gray-500">
                    Select the document you want to sign
                  </p>
                </div>

                {/* Upload Area */}
                <div className="relative">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-48 border-3 border-dashed border-indigo-300 rounded-2xl cursor-pointer hover:bg-white/50 transition-all duration-300 group"
                  >
                    {file ? (
                      <div className="text-center">
                        <FileText className="w-16 h-16 text-indigo-600 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-gray-700">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Click to change
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-12 h-12 text-indigo-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                        <p className="text-sm font-semibold text-gray-700">
                          Click to upload PDF
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          or drag and drop
                        </p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Features */}
                <div className="bg-white rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <p className="text-sm text-gray-700">Protected with 2048-bit RSA encryption</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      Legally binding signatures
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      Instant certificate generation
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleUpload}
                disabled={loading}
                className="w-full bg-linear-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 mt-6"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Sign & Download PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>🔒 Your files are processed securely and never stored on our servers</p>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold text-center mb-8 text-gray-800">
              Processing Your Document
            </h3>
            <div className="space-y-4">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
                    idx === currentStep
                      ? "bg-linear-to-r from-indigo-600 to-purple-600 text-white scale-105 shadow-lg"
                      : idx < currentStep
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <div className="text-3xl">{step.icon}</div>
                  <div className="flex-1 font-semibold">{step.text}</div>
                  {idx === currentStep && (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {idx < currentStep && (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
