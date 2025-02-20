import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export const ListFiles = ({ files, onSelect, onRemove, selectedFile }) => {
  return (
    <div className="file-list w-full max-w-xl mx-auto">
      {files.map((file, idx) => (
        <motion.div 
          className="file-container" 
          key={file.name + file.lastModified}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          layout>
          <div className="file-border" onClick={() => onSelect(file)}>
            <div className="spin spin-blur"></div>
            <div className="spin spin-intense"></div>
            <div className="spin spin-inside"></div>
            <div className={cn(
              "file-content",
              selectedFile === file && "bg-neutral-900/50"
            )}>
              <span className="text-base text-neutral-300 truncate max-w-xs">
                {file.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(file);
                }}
                className="text-neutral-400 hover:text-red-500 text-xl">
                ×
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
