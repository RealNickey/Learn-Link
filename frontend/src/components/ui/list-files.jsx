import React from "react";

export const ListFiles = ({ files, onSelect }) => {
  return (
    <div className="file-list">
      {files.map((file, idx) => (
        <div key={idx} className="file-item" onClick={() => onSelect(file)}>
          <div className="file-info">
            <p className="file-name">{file.name}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
