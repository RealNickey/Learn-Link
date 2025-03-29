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
}) => {
  return (
    <div className="file-list w-full max-w-xl mx-auto">
      {files.length === 0 ? (
        <div className="text-center py-8 text-neutral-400">
          <TextShimmer>Add files To Start</TextShimmer>
        </div>
      ) : (
        files.map((file, idx) => (
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
        ))
      )}
    </div>
  );
};
