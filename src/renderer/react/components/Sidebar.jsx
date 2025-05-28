import React from 'react';
import FileTree from './sidebar/FileTree';
import AIChat from './sidebar/AIChat';
import SidebarNav from './sidebar/SidebarNav';

const Sidebar = ({ 
  collapsed, 
  toggleSidebar, 
  activePanel, 
  changePanel,
  rootDirectory,
  setRootDirectory,
  openFile,
  openSettings
}) => {
  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : 'expanded'}`}>
      <button 
        className="sidebar-toggle" 
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar"
      >
        <span className="toggle-icon">◀</span>
      </button>
      
      <SidebarNav 
        activePanel={activePanel} 
        changePanel={changePanel}
        openSettings={openSettings}
      />
      
      <div className="sidebar-content">
        {activePanel === 'file-tree-panel' && (
          <FileTree 
            rootDirectory={rootDirectory}
            setRootDirectory={setRootDirectory}
            openFile={openFile}
          />
        )}
        
        {activePanel === 'ai-chat-panel' && (
          <AIChat />
        )}
      </div>
    </div>
  );
};

export default Sidebar; 