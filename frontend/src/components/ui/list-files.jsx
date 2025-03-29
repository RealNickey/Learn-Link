import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { CustomCheckbox } from "./custom-checkbox";
import { TextShimmer } from "./text-shimmer"; // Import TextShimmer component

export const ListFiles = ({
  files,
  onSelect,
  onRemove,
  selectedFiles,
  onFileSelect,
  activeFile,
  sharedFiles = [], // Add default empty array for shared files
}) => {
  return (
    <div className="file-list w-full max-w-xl mx-auto">
      {files.length === 0 && sharedFiles.length === 0 ? (
        <div className="text-center py-8 text-neutral-400">
          <TextShimmer>Add files To Start</TextShimmer>
        </div>
      ) : (
        <>
          {/* Local Files Section */}
          {files.length > 0 && (
            <div className="files-section">
              <h4 className="text-sm font-medium text-neutral-300 mb-2">
                Your Files
              </h4>
              {files.map((file, idx) => (
                <motion.div
                  key={file.name + file.lastModified}
                  layoutId={`file-list-${idx}`}
                  onClick={() => onSelect(file)}
                  className={cn(
                    "relative overflow-hidden z-40 bg-neutral-900 flex flex-col items-start justify-start h-16 p-4 mt-4 w-full mx-auto rounded-md",
                    "shadow-sm hover:bg-neutral-800 cursor-pointer group",
                    activeFile === file
                      ? "border-2 border-blue-500"
                      : "border border-transparent"
                  )}
                >
                  <div className="flex justify-between w-full items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <CustomCheckbox
                          checked={selectedFiles?.includes(file)}
                          onChange={(checked) => onFileSelect(file, checked)}
                          className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
                        />
                      </div>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        layout
                        title={file.name}
                        className="text-base text-neutral-300 max-w-[135px] truncate"
                      >
                        {file.name}
                      </motion.p>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(file);
                      }}
                      variant="ghost"
                      size="icon"
                      className="text-white hover:text-red-700 text-lg"
                    >
                      &times;
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Shared Files Section */}
          {sharedFiles.length > 0 && (
            <div className="shared-files-section mt-6">
              <h4 className="text-sm font-medium text-neutral-300 mb-2">
                Shared Files
              </h4>
              {sharedFiles.map((file, idx) => (
                <motion.div
                  key={`shared-${file.filename || idx}`}
                  layoutId={`shared-file-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden z-40 bg-neutral-800 flex flex-col items-start justify-start h-16 p-4 mt-4 w-full mx-auto rounded-md border border-blue-500/20 hover:border-blue-500/50 transition-all"
                >
                  <div className="flex justify-between w-full items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-blue-400"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="12" y1="18" x2="12" y2="12"></line>
                        <line x1="9" y1="15" x2="15" y2="15"></line>
                      </svg>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={file.originalName || "Shared file"}
                        className="text-base text-blue-300 max-w-[135px] truncate hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {file.originalName || "Shared file"}
                      </a>
                    </div>
                    <div className="text-sm text-neutral-500">
                      {file.sharedByUsername &&
                        `From: ${file.sharedByUsername}`}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
