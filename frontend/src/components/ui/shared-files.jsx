import React, { useState, useEffect } from "react";
import { Button } from "./button";
import { Card } from "./card";
import { IconFileDownload, IconExternalLink } from "@tabler/icons-react";
import { useToast } from "@/hooks/use-toast";

const SharedFiles = ({ socket, user }) => {
  const [sharedFiles, setSharedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!socket) return;

    // Listen for initial files list
    socket.on("initialFiles", (files) => {
      setSharedFiles(files);
    });

    // Listen for new shared files
    socket.on("newFile", (fileData) => {
      setSharedFiles((prevFiles) => [...prevFiles, fileData]);

      toast({
        title: "New file shared",
        description: `${fileData.sharedBy} shared ${fileData.name}`,
      });
    });

    return () => {
      socket.off("initialFiles");
      socket.off("newFile");
    };
  }, [socket, toast]);

  const downloadFile = async (fileId, fileName) => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/download-file/${fileId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Create a blob from the response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = fileName;

      // Add to DOM, trigger download, and clean up
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download successful",
        description: `File "${fileName}" has been downloaded`,
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Download failed",
        description: "Could not download the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format file size to a human-readable format
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Format date to a human-readable format
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (sharedFiles.length === 0) {
    return (
      <Card className="p-4 w-full">
        <h3 className="text-lg font-medium mb-2">Shared Files</h3>
        <p className="text-neutral-400">No files have been shared yet.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 w-full">
      <h3 className="text-lg font-medium mb-4">Shared Files</h3>
      <div className="space-y-3">
        {sharedFiles.map((file) => (
          <div
            key={file.id}
            className="p-3 bg-neutral-800 rounded-lg flex items-center justify-between"
          >
            <div className="flex-1">
              <h4 className="font-medium text-white truncate max-w-xs">
                {file.name}
              </h4>
              <div className="flex flex-col sm:flex-row sm:space-x-4 text-sm text-neutral-400">
                <span>{formatFileSize(file.size)}</span>
                <span>Shared by: {file.sharedBy}</span>
                <span>{formatDate(file.sharedAt || file.uploadedAt)}</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadFile(file.id, file.name)}
                disabled={loading}
              >
                <IconFileDownload className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default SharedFiles;
