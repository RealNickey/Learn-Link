import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { CustomCheckbox } from "./custom-checkbox";

export const ListFiles = ({ files, onSelect, onRemove, selectedFile, selectedFiles, onFileSelect }) => {
  return (
    <div className="file-list w-full max-w-xl mx-auto">
      {files.map((file, idx) => (
        <motion.div 
          className="file-container" 
          key={file.name + file.lastModified}
          layoutId={`file-list-${idx}`}
          className={cn(
            "relative overflow-hidden z-40 bg-neutral-900 flex flex-col items-start justify-start h-16 p-4 mt-4 w-full mx-auto rounded-md",
            "shadow-sm hover:bg-neutral-800 cursor-pointer group"
          )}>
          <div className="flex justify-between w-full items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
                title={file.name} // Add title for hover tooltip
                className="text-base text-neutral-300 max-w-[135px] truncate"
                onClick={() => onSelect(file)}>
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
              className="text-white hover:text-red-700 text-lg">
              &times;
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
