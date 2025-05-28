/**
 * AI Notes - Backend Server
 * 
 * Express server for handling AI API requests and other backend functionality.
 * This server is started by the main process and provides API endpoints for the renderer.
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { createServer } = require('http');
const WebSocket = require('ws');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors({ origin: 'file://' })); // Allow only the Electron app to access
app.use(express.json({ limit: '10mb' })); // Limit request size to prevent abuse

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, fileContext, apiKey, temperature, maxTokens, history } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    try {
      // Prepare messages array with history and current message
      const messages = [];
      
      // Add history messages
      if (history && Array.isArray(history)) {
        for (const entry of history) {
          if (entry.role && entry.content) {
            messages.push({
              role: entry.role === 'ai' ? 'model' : 'user',
              parts: [{ text: entry.content }]
            });
          }
        }
      }
      
      // Add current message with file context if available
      const userContent = fileContext ? `${fileContext}\n\n${message}` : message;
      messages.push({
        role: 'user',
        parts: [{ text: userContent }]
      });
      
      // Make request to Google Gemini API
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({
            contents: messages,
            generationConfig: {
              temperature: parseFloat(temperature) || 0.7,
              maxOutputTokens: parseInt(maxTokens) || 2048,
              topP: 0.95,
              topK: 40
            }
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        return res.status(response.status).json({ 
          error: errorData.error?.message || 'Error from Gemini API' 
        });
      }
      
      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        return res.status(500).json({ error: 'No response generated' });
      }
      
      // Extract the response text
      const aiResponse = data.candidates[0].content.parts[0].text;
      
      return res.json({ content: aiResponse });
    } catch (error) {
      console.error('Error processing AI request:', error);
      return res.status(500).json({ error: error.message || 'Failed to process AI request' });
    }
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// WebSocket connection for real-time updates
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  
  ws.on('message', (message) => {
    console.log('Received message:', message);
    // Handle WebSocket messages if needed
  });
  
  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });
});

// Start the server only if this file is run directly
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
}

// Export for use in main process
module.exports = { 
  startServer: () => {
    return new Promise((resolve, reject) => {
      try {
        server.listen(PORT, () => {
          console.log(`Backend server running on port ${PORT}`);
          resolve(PORT);
        });
      } catch (error) {
        console.error('Failed to start server:', error);
        reject(error);
      }
    });
  },
  stopServer: () => {
    return new Promise((resolve, reject) => {
      try {
        server.close(() => {
          console.log('Backend server stopped');
          resolve();
        });
      } catch (error) {
        console.error('Failed to stop server:', error);
        reject(error);
      }
    });
  }
}; 