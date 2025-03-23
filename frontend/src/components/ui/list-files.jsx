import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IconFile, IconTrash } from "@tabler/icons-react";
import { CustomCheckbox } from "./custom-checkbox";
import { useToast } from "@/hooks/use-toast";

export const ListFiles = ({ files = [], onSelect, onRemove, selectedFiles = [], onFileSelect, activeFile = null, socket }) => {
  const [allFiles, setAllFiles] = useState(files);
  const { toast } = useToast();

  // Listen for new files from other participants
  useEffect(() => {
    if (!socket) return;

    socket.on("newFile", (fileData) => {
      setAllFiles((prevFiles) => {
        // Check if file already exists
        const exists = prevFiles.some(f => f.id === fileData.id);
        if (exists) return prevFiles;

        // Create a file object that matches the local file structure
        const newFile = {
          id: fileData.id,
          name: fileData.name,
          size: fileData.size,
          type: fileData.type,
          lastModified: new Date(fileData.uploadedAt).getTime(),
          isRemote: true,
          sharedBy: fileData.sharedBy
        };

        toast({
          title: "New file shared",
          description: `${fileData.sharedBy} shared ${fileData.name}`,
        });

        return [...prevFiles, newFile];
      });
    });

    return () => {
      socket.off("newFile");
    };
  }, [socket, toast]);

  // Update local files when files prop changes
  useEffect(() => {
    setAllFiles((prevFiles) => {
      const newFiles = files.filter(file => !prevFiles.some(pf => pf.name === file.name));
      return [...prevFiles, ...newFiles];
    });
  }, [files]);

  return (
    <div className="files-list w-full space-y-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Files</h3>
        <span className="text-sm text-neutral-400">
          {allFiles.length} file{allFiles.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-2">
        {allFiles.map((file) => (
          <motion.div
            key={file.id || file.name + file.lastModified}
            layoutId={file.name}
            className={`relative flex items-center space-x-2 p-2 rounded-lg transition-colors ${
              activeFile === file ? "bg-neutral-800" : "bg-neutral-900 hover:bg-neutral-800"
            }`}
          >
            <CustomCheckbox
              checked={selectedFiles.includes(file)}
              onCheckedChange={(checked) => onFileSelect(file, checked)}
            />
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => onSelect(file)}
            >
              <div className="flex items-center space-x-2">
                <IconFile className="flex-shrink-0 w-5 h-5 text-neutral-400" />
                <span className="text-sm font-medium text-white truncate">
                  {file.name}
                </span>
              </div>
              <div className="flex text-xs text-neutral-400 mt-1">
                <span className="truncate">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </span>
                {file.isRemote && (
                  <span className="ml-2 text-sky-400">
                    Shared by {file.sharedBy}
                  </span>
                )}
              </div>
            </div>
            {!file.isRemote && (
              <button
                onClick={() => onRemove(file)}
                className="p-1 hover:bg-neutral-700 rounded transition-colors"
              >
                <IconTrash className="w-4 h-4 text-neutral-400" />
              </button>
            )}
          </motion.div>
        ))}

        {allFiles.length === 0 && (
          <div className="text-center py-4 text-neutral-400">
            No files uploaded yet
          </div>
        )}
      </div>
    </div>
  );
};
