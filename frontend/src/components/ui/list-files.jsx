import React from "react";

export const ListFiles = ({ files, onSelect }) => {
  return (
    <div className="file-list">
      {files.map((file, idx) => (
        <div key={idx} className="file-item" onClick={() => onSelect(file)}>
          <div className="file-info">
            <p className="file-name">{file.name}</p>
            <p className="file-size">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            <p className="file-type">{file.type}</p>
            <p className="file-date">{new Date(file.lastModified).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
