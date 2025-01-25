import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { Button } from "./button";

export const ListFiles = ({ files, onSelect, onRemove }) => {
  return (
    <div className="file-list w-full max-w-xl mx-auto">
      {files.map((file, idx) => (
        <motion.div
          key={file.name + file.lastModified}
          layoutId={`file-list-${idx}`}
          onClick={() => onSelect(file)}
          className={cn(
            "relative overflow-hidden z-40 bg-neutral-900 flex flex-col items-start justify-start h-16 p-4 mt-4 w-full mx-auto rounded-md",
            "shadow-sm hover:bg-neutral-800 cursor-pointer"
          )}>
          <div className="flex justify-between w-full items-center gap-4">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              layout
              className="text-base text-neutral-300 truncate max-w-xs">
              {file.name}
            </motion.p>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(file);
              }}
              variant="ghost"
              size="icon"
              className="text-white hover:text-red-700 text-2xl">
              &times;
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
