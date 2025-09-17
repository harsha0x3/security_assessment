import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useImportResposesMutation } from "@/store/apiSlices/responsesApiSlice";
import { toast } from "react-toastify";
import { Upload } from "lucide-react";

const ImportResponsesDialog = ({ checklistId, open, onClose }) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [importResponses, { isLoading, error }] = useImportResposesMutation();

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
    setFile(file);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
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

  const handleImport = async () => {
    if (!file) return alert("Please select a CSV file");
    try {
      const formData = new FormData();
      formData.append("file", file);

      await importResponses({ checklistId, payload: formData }).unwrap();
      toast.info("Responses imported successfully!");
      setFile(null);
      onClose();
    } catch (err) {
      console.error("Failed to import responses:", err);
      alert("Failed to import responses. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Responses</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Upload a CSV or Excel file to import responses into this checklist.
        </DialogDescription>

        <div
          className={`relative space-y-4 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
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
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-600
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-50 file:text-blue-700
                       hover:file:bg-blue-100"
          />
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            {file ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  Selected File: {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  Size: {(file.size / 1024).toFixed(2)} KB
                </p>
                <Button
                  onClick={() => setFile(null)}
                  className="text-sm text-red-600 hover:text-red-800 hover:cursor-pointer"
                  variant="ghost"
                >
                  Remove file
                </Button>
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
          {error && (
            <p className="text-sm text-red-600">
              Failed: {error?.data?.detail || "Unknown error"}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isLoading}>
            {isLoading ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportResponsesDialog;
