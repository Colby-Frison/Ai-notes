import React, { useState, useEffect } from 'react';

const MarkdownEditor = ({ file }) => {
  const [content, setContent] = useState(file.content);
  const [isModified, setIsModified] = useState(file.modified);
  const [mode, setMode] = useState('edit'); // edit, preview, split
  
  // Update content when file changes
  useEffect(() => {
    setContent(file.content);
    setIsModified(file.modified);
  }, [file]);
  
  // Handle content change
  const handleChange = (e) => {
    setContent(e.target.value);
    if (!isModified) {
      setIsModified(true);
      // TODO: Update file modified state in parent component
    }
  };
  
  // Render markdown preview (placeholder for now)
  const renderMarkdown = () => {
    return content.replace(/\n/g, '<br>');
  };
  
  return (
    <div className="file-content active">
      <div className="editor-container">
        <div className="editor-toolbar">
          <button 
            className={`editor-mode-btn ${mode === 'edit' ? 'active' : ''}`}
            onClick={() => setMode('edit')}
          >
            Edit
          </button>
          <button 
            className={`editor-mode-btn ${mode === 'preview' ? 'active' : ''}`}
            onClick={() => setMode('preview')}
          >
            Preview
          </button>
          <button 
            className={`editor-mode-btn ${mode === 'split' ? 'active' : ''}`}
            onClick={() => setMode('split')}
          >
            Split
          </button>
        </div>
        
        <div className="editor-content">
          {/* Edit Mode */}
          <div className={`editor-mode edit-mode ${mode === 'edit' ? 'active' : ''}`}>
            <textarea
              className="editor-textarea"
              value={content}
              onChange={handleChange}
              spellCheck="false"
            />
          </div>
          
          {/* Preview Mode */}
          <div className={`editor-mode preview-mode ${mode === 'preview' ? 'active' : ''}`}>
            <div 
              className="markdown-content"
              dangerouslySetInnerHTML={{ __html: renderMarkdown() }}
            />
          </div>
          
          {/* Split Mode */}
          <div className={`editor-mode split-mode ${mode === 'split' ? 'active' : ''}`}>
            <div className="split-editor">
              <textarea
                className="editor-textarea"
                value={content}
                onChange={handleChange}
                spellCheck="false"
              />
            </div>
            <div className="split-preview">
              <div 
                className="markdown-content"
                dangerouslySetInnerHTML={{ __html: renderMarkdown() }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;