import React from 'react';
import TextEditor from './editors/TextEditor';
import MarkdownEditor from './editors/MarkdownEditor';
import ImageViewer from './editors/ImageViewer';
import PDFViewer from './editors/PDFViewer';

const ContentArea = ({ openFiles, activeFile }) => {
  // Find the active file object
  const activeFileObj = openFiles.find(file => file.path === activeFile);
  
  // If no files are open or no active file, show empty state
  if (!activeFileObj) {
    return (
      <div className="content-area">
        <div className="empty-workspace">
          <h2>Welcome to AI Notes</h2>
          <p>Select a file from the sidebar to get started</p>
        </div>
      </div>
    );
  }
  
  // Determine file type based on extension
  const fileExtension = activeFileObj.name.split('.').pop().toLowerCase();
  
  // Render appropriate editor/viewer based on file type
  return (
    <div className="content-area">
      {['md', 'markdown'].includes(fileExtension) ? (
        <MarkdownEditor file={activeFileObj} />
      ) : ['txt', 'text', 'log', 'js', 'jsx', 'ts', 'tsx', 'css', 'html', 'json', 'yml', 'yaml', 'xml'].includes(fileExtension) ? (
        <TextEditor file={activeFileObj} />
      ) : ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(fileExtension) ? (
        <ImageViewer file={activeFileObj} />
      ) : fileExtension === 'pdf' ? (
        <PDFViewer file={activeFileObj} />
      ) : (
        // Default to text editor for unknown file types
        <TextEditor file={activeFileObj} />
      )}
    </div>
  );
};

export default ContentArea; 