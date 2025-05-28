import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import './styles/index.css';

// Create root element
const container = document.getElementById('react-root');
const root = createRoot(container);
root.render(<App />); 