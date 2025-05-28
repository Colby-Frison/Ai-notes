import React from 'react';

const TabsBar = ({ openFiles, activeFile, setActiveFile, closeFile }) => {
  if (openFiles.length === 0) {
    return (
      <div className="tabs-bar">
        <div className="tab-placeholder">No files open</div>
      </div>
    );
  }

  return (
    <div className="tabs-bar">
      {openFiles.map(file => (
        <div 
          key={file.path}
          className={`tab ${file.path === activeFile ? 'active' : ''}`}
          onClick={() => setActiveFile(file.path)}
        >
          {file.modified && <span className="tab-unsaved"></span>}
          <span className="tab-title">{file.name}</span>
          <button 
            className="tab-close" 
            onClick={(e) => {
              e.stopPropagation();
              closeFile(file.path);
            }}
            aria-label="Close tab"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default TabsBar; 