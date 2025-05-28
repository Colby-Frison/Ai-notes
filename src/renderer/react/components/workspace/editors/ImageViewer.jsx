import React, { useState } from 'react';

const ImageViewer = ({ file }) => {
  const [zoom, setZoom] = useState(100);
  
  // Handle zoom in
  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 400));
  };
  
  // Handle zoom out
  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25));
  };
  
  // Handle reset zoom
  const resetZoom = () => {
    setZoom(100);
  };
  
  return (
    <div className="file-content active">
      <div className="image-viewer">
        <div className="image-toolbar">
          <button onClick={zoomOut}>-</button>
          <span>{zoom}%</span>
          <button onClick={zoomIn}>+</button>
          <button onClick={resetZoom}>Reset</button>
        </div>
        <div className="image-container">
          <img 
            src={`file://${file.path}`} 
            alt={file.name}
            style={{ 
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'center'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageViewer; 