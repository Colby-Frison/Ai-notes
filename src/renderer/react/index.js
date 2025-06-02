import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import './styles/index.css';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('React application initializing');
    
    // Create root element
    const container = document.getElementById('react-root');
    if (!container) {
      console.error('Could not find #react-root element to mount React app');
      return;
    }
    
    // Ensure we create a new root rather than trying to render into an existing one
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    // Delay React initialization slightly to ensure DOM is fully ready
    setTimeout(() => {
      try {
        const root = createRoot(container);
        root.render(<App />);
        console.log('React application initialized');
      } catch (error) {
        console.error('Error initializing React application:', error);
      }
    }, 50);
  } catch (error) {
    console.error('Error during React initialization:', error);
  }
}); 