import React from 'react';
import TabsBar from './workspace/TabsBar';
import ContentArea from './workspace/ContentArea';

const Workspace = ({ openFiles, activeFile, setActiveFile, closeFile }) => {
  return (
    <div className="workspace">
      <TabsBar 
        openFiles={openFiles} 
        activeFile={activeFile}
        setActiveFile={setActiveFile}
        closeFile={closeFile}
      />
      
      <ContentArea 
        openFiles={openFiles} 
        activeFile={activeFile}
      />
    </div>
  );
};

export default Workspace; 