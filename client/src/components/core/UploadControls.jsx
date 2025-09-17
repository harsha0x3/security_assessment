import { useState } from "react";
import { useUploadControlsMutation } from "../../store/apiSlices/controlsApiSlice";
import { toast } from "react-toastify";
import { Upload, Download, FileText, AlertCircle } from "lucide-react";

const UploadControls = ({ checklistId, onClose }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadControls, { isLoading }] = useUploadControlsMutation();

  const handleFileSelect = (file) => {
    // Validate file type
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv", // .csv
    ];

    if (
      !allowedTypes.includes(file.type) &&
      !file.name.match(/\.(xlsx|xls|csv)$/i)
    ) {
      toast.error("Please select an Excel (.xlsx, .xls) or CSV file");
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    try {
      const result = await uploadControls({
        input_file: selectedFile,
        checklistId: checklistId,
      }).unwrap();

      if (result.success) {
        toast.success(result.message);
        setSelectedFile(null);
        onClose && onClose();
      } else {
        // Show validation errors
        toast.error(result.message);
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach((error) => {
            toast.error(error, { autoClose: 8000 });
          });
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error?.data?.detail || "Failed to upload file. Please try again."
      );
    }
  };

  const downloadTemplate = () => {
    // Create a sample CSV template
    const csvContent = `control_area,severity,control_text,description
IAM,High,"Ensure that multi-factor authentication is enabled for all non-service accounts","Setup multi-factor authentication for Google Cloud Platform accounts."`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "controls_template.csv";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Upload Controls from File
        </h3>
        <p className="text-sm text-gray-600">
          Upload Excel (.xlsx, .xls) or CSV files containing control data
        </p>
      </div>

      {/* Template Download */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Download Template
            </span>
          </div>
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV Template</span>
          </button>
        </div>
        <p className="text-xs text-blue-700 mt-2">
          Required columns: control_area, severity, control_text. Optional:
          description
        </p>
      </div>

      {/* File Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          onChange={handleFileChange}
          accept=".xlsx,.xls,.csv"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="space-y-4">
          <Upload className="w-12 h-12 text-gray-400 mx-auto" />

          {selectedFile ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">
                Selected File: {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                Size: {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Drag and drop your file here, or{" "}
                <span className="text-blue-600 font-medium">browse</span>
              </p>
              <p className="text-xs text-gray-400">
                Supports Excel (.xlsx, .xls) and CSV files up to 10MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Required Format Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-2">File Format Requirements:</p>
            <ul className="space-y-1 text-xs">
              <li>
                • <strong>control_area:</strong> Area/category of the control
                (required)
              </li>
              <li>
                • <strong>severity:</strong> Must be one of: Low, Medium, High,
                Critical (required)
              </li>
              <li>
                • <strong>control_text:</strong> Description of the control
                (required)
              </li>
              <li>
                • <strong>description:</strong> Additional details (optional)
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isLoading}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Uploading..." : "Upload Controls"}
        </button>
      </div>
    </div>
  );
};

export default UploadControls;
