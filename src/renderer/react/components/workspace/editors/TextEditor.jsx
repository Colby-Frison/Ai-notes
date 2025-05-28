import React, { useState, useEffect } from 'react';

const TextEditor = ({ file }) => {
  const [content, setContent] = useState(file.content);
  const [isModified, setIsModified] = useState(file.modified);
  
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
  
  return (
    <div className="file-content active">
      <textarea
        className="editor-textarea"
        value={content}
        onChange={handleChange}
        spellCheck="false"
      />
    </div>
  );
};

export default TextEditor; 