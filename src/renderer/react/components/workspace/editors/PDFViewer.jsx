import React, { useState, useEffect } from 'react';

const PDFViewer = ({ file }) => {
  const [pdfLoaded, setPdfLoaded] = useState(false);
  
  useEffect(() => {
    // In a real implementation, this would load the PDF.js library
    // and render the PDF document
    
    // Simulate loading
    const timer = setTimeout(() => {
      setPdfLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [file]);
  
  return (
    <div className="file-content active">
      <div className="pdf-viewer">
        {!pdfLoaded ? (
          <div className="loading">Loading PDF...</div>
        ) : (
          <div className="pdf-container">
            <div className="pdf-toolbar">
              <button>Previous</button>
              <span>Page 1 of 1</span>
              <button>Next</button>
              <button>Zoom In</button>
              <button>Zoom Out</button>
            </div>
            <div className="pdf-content">
              <div className="pdf-placeholder">
                <p>PDF Viewer (Placeholder)</p>
                <p>File: {file.name}</p>
                <p>In a real implementation, PDF.js would be used to render the PDF here.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer; 