import { useState } from "react";
import { useUploadControlsMutation } from "../store/controlsApiSlice";
import { toast } from "react-toastify";
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  ImportIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const UploadControls = ({ checklistId }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadControls, { isLoading }] = useUploadControlsMutation();

  const handleFileSelect = (file) => {
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
      } else {
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
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ImportIcon className="w-5 h-5" /> Upload Controls
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[min(900px,95vw)] max-h-[85vh] overflow-hidden flex flex-col gap-6 p-6">
        <DialogHeader className="text-left">
          <DialogTitle>Upload Controls from File</DialogTitle>
          <DialogDescription>
            Upload Excel (.xlsx, .xls) or CSV files containing control data
          </DialogDescription>
        </DialogHeader>

        {/* Template Download */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Download Template</span>
            </div>
            <Button
              onClick={downloadTemplate}
              variant="ghost"
              size="sm"
              className="gap-1"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV Template</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Required columns: control_area, severity, control_text. Optional:
            description
          </p>
        </div>

        {/* File Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-muted"
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
            <Upload className="w-12 h-12 text-muted-foreground mx-auto" />

            {selectedFile ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  Size: {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  Remove file
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Drag and drop your file here, or{" "}
                  <span className="text-primary font-medium">browse</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports Excel (.xlsx, .xls) and CSV files up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Required Format Info */}
        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-2">File Format Requirements:</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>
                  • <strong>control_area:</strong> Area/category of the control
                  (required)
                </li>
                <li>
                  • <strong>severity:</strong> Must be one of: Low, Medium,
                  High, Critical (required)
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
          <Button
            type="button"
            variant="secondary"
            onClick={() => setSelectedFile(null)}
          >
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || isLoading}>
            {isLoading ? "Uploading..." : "Upload Controls"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadControls;
