import React from 'react';

const SidebarNav = ({ activePanel, changePanel, openSettings }) => {
  return (
    <div className="sidebar-nav">
      <button 
        className={`sidebar-btn ${activePanel === 'file-tree-panel' ? 'active' : ''}`} 
        onClick={() => changePanel('file-tree-panel')}
        aria-label="File Tree"
      >
        <span className="icon">📁</span>
        <span className="label">Files</span>
      </button>
      
      <button 
        className={`sidebar-btn ${activePanel === 'ai-chat-panel' ? 'active' : ''}`} 
        onClick={() => changePanel('ai-chat-panel')}
        aria-label="AI Chat"
      >
        <span className="icon">🤖</span>
        <span className="label">AI Chat</span>
      </button>
      
      <button 
        className="sidebar-btn" 
        onClick={openSettings}
        aria-label="Settings"
      >
        <span className="icon">⚙️</span>
        <span className="label">Settings</span>
      </button>
    </div>
  );
};

export default SidebarNav; 