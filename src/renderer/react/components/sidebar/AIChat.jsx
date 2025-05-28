import React, { useState, useEffect, useRef } from 'react';

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history from localStorage
  const loadChatHistory = () => {
    try {
      const savedHistory = localStorage.getItem('chatHistory');
      if (savedHistory) {
        setMessages(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  // Save chat history to localStorage
  const saveChatHistory = (history) => {
    try {
      localStorage.setItem('chatHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Send a message to the AI
  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message to chat
    const updatedMessages = [
      ...messages,
      { role: 'user', content: inputValue }
    ];
    setMessages(updatedMessages);
    
    // Clear input
    setInputValue('');
    
    // Set typing indicator
    setIsTyping(true);

    try {
      // Get API key from settings
      const apiKey = await window.electronAPI.getConfig('apiKey');
      
      if (!apiKey) {
        addSystemMessage('No API key found. Please add your Gemini API key in Settings.');
        setIsTyping(false);
        return;
      }
      
      // Get current file context if enabled
      let fileContext = '';
      if (await window.electronAPI.getConfig('includeFileContext')) {
        const currentFile = await window.electronAPI.getConfig('activeFile');
        if (currentFile) {
          const fileContent = await window.electronAPI.readFile(currentFile);
          if (!fileContent.error) {
            fileContext = `Current file (${currentFile.split('/').pop()}):\n\`\`\`\n${fileContent.content}\n\`\`\`\n\n`;
          }
        }
      }
      
      // Get AI settings
      const temperature = await window.electronAPI.getConfig('temperature') || 0.7;
      const maxTokens = await window.electronAPI.getConfig('maxTokens') || 2048;
      
      // Prepare request payload
      const payload = {
        message: inputValue,
        fileContext,
        apiKey,
        temperature,
        maxTokens,
        history: messages
      };
      
      // Make API request
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
      }
      
      const data = await response.json();
      
      // Add AI response to chat
      const newMessages = [
        ...updatedMessages,
        { role: 'ai', content: data.content }
      ];
      
      setMessages(newMessages);
      saveChatHistory(newMessages);
      
    } catch (error) {
      console.error('Error sending message:', error);
      addSystemMessage(`Error: ${error.message}`);
    } finally {
      setIsTyping(false);
    }
  };

  // Add a system message
  const addSystemMessage = (content) => {
    const newMessages = [
      ...messages,
      { role: 'system', content }
    ];
    
    setMessages(newMessages);
    saveChatHistory(newMessages);
  };

  // Clear the chat history
  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history? This cannot be undone.')) {
      setMessages([]);
      saveChatHistory([]);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format message content
  const formatMessageContent = (content) => {
    // Convert code blocks
    let formatted = content.replace(/```([\s\S]*?)```/g, '<pre class="code-block">$1</pre>');
    
    // Convert inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Convert line breaks to <br>
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  };

  return (
    <div className="sidebar-panel active">
      <div className="panel-header">
        <h2>AI Chat</h2>
        <button 
          className="small-btn"
          onClick={clearChat}
        >
          Clear Chat
        </button>
      </div>
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>Welcome to AI Chat</p>
            <p>Ask questions about your notes and files</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`chat-message ${message.role}`}>
              <div className="avatar">
                <span className="avatar-icon">
                  {message.role === 'user' ? '👤' : 
                   message.role === 'ai' ? '🤖' : '⚠️'}
                </span>
              </div>
              <div 
                className="message-content"
                dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
              />
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="chat-message ai typing-indicator">
            <div className="avatar">
              <span className="avatar-icon">🤖</span>
            </div>
            <div className="message-content">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-container">
        <textarea
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder="Type your message here..."
          rows="3"
        />
        <button 
          className="chat-send-btn"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default AIChat; 