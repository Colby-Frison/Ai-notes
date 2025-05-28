/**
 * AI Notes - Chat Manager
 * 
 * Handles the AI chat functionality, including sending messages to the backend,
 * managing chat history, and displaying responses.
 */

export class ChatManager {
  constructor() {
    this.chatMessages = document.getElementById('chat-messages');
    this.chatInput = document.getElementById('chat-input');
    this.sendButton = document.getElementById('send-message');
    this.clearButton = document.getElementById('clear-chat');
    
    // Initialize event listeners
    this.init();
    
    // Chat history
    this.chatHistory = [];
    
    // Load chat history from local storage
    this.loadChatHistory();
  }
  
  /**
   * Initialize event listeners and chat UI
   */
  init() {
    // Send message on button click
    this.sendButton.addEventListener('click', () => {
      this.sendMessage();
    });
    
    // Send message on Enter key (but allow Shift+Enter for new line)
    this.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // Clear chat history
    this.clearButton.addEventListener('click', () => {
      this.clearChat();
    });
    
    // Load chat history on init
    this.renderChatHistory();
  }
  
  /**
   * Send a message to the AI and display in the chat
   */
  async sendMessage() {
    const message = this.chatInput.value.trim();
    
    if (!message) return;
    
    // Clear input
    this.chatInput.value = '';
    
    // Add user message to chat
    this.addMessageToChat('user', message);
    
    try {
      // Show loading indicator
      this.showTypingIndicator();
      
      // Get API key from settings
      const apiKey = await window.electronAPI.getConfig('aiApiKey');
      
      if (!apiKey) {
        this.removeTypingIndicator();
        this.addMessageToChat('system', 'No API key found. Please add your Gemini API key in Settings.');
        return;
      }
      
      // Get current file context if enabled
      let fileContext = '';
      if (await window.electronAPI.getConfig('includeFileContext')) {
        const currentFile = await window.electronAPI.getConfig('currentFile');
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
        message,
        fileContext,
        temperature,
        maxTokens,
        apiKey,
        history: this.chatHistory
      };
      
      // Make API request to backend or directly to Gemini API
      const response = await this.makeAiRequest(payload);
      
      // Remove typing indicator
      this.removeTypingIndicator();
      
      if (response.error) {
        this.addMessageToChat('error', `Error: ${response.error}`);
      } else {
        // Add AI response to chat
        this.addMessageToChat('ai', response.content);
        
        // Update chat history
        this.chatHistory.push({
          role: 'user',
          content: message
        });
        this.chatHistory.push({
          role: 'ai',
          content: response.content
        });
        
        // Save chat history to local storage
        this.saveChatHistory();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      this.removeTypingIndicator();
      this.addMessageToChat('error', `Something went wrong. Please try again.`);
    }
  }
  
  /**
   * Make a request to the AI API
   * @param {Object} payload - Message payload
   * @returns {Promise<Object>} Response from AI
   */
  async makeAiRequest(payload) {
    try {
      // Call the backend server API endpoint
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: payload.message,
          fileContext: payload.fileContext,
          apiKey: payload.apiKey,
          temperature: payload.temperature,
          maxTokens: payload.maxTokens,
          history: payload.history
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { error: error.error || 'API request failed' };
      }
      
      const data = await response.json();
      return { content: data.content };
    } catch (error) {
      console.error('AI API request error:', error);
      return { error: error.message || 'Failed to get response from AI' };
    }
  }
  
  /**
   * Add a message to the chat UI
   * @param {string} role - 'user', 'ai', 'system', or 'error'
   * @param {string} content - Message content
   */
  addMessageToChat(role, content) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', role);
    
    const avatarElement = document.createElement('div');
    avatarElement.classList.add('avatar');
    
    const avatarIcon = document.createElement('span');
    avatarIcon.classList.add('avatar-icon');
    
    // Set avatar icon based on role
    if (role === 'user') {
      avatarIcon.textContent = '👤';
    } else if (role === 'ai') {
      avatarIcon.textContent = '🤖';
    } else if (role === 'system' || role === 'error') {
      avatarIcon.textContent = '⚠️';
    }
    
    avatarElement.appendChild(avatarIcon);
    
    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content');
    
    // Format message content (handle markdown, code blocks, etc.)
    contentElement.innerHTML = this.formatMessageContent(content);
    
    messageElement.appendChild(avatarElement);
    messageElement.appendChild(contentElement);
    
    this.chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }
  
  /**
   * Format message content (convert markdown, highlight code, etc.)
   * @param {string} content - Raw message content
   * @returns {string} Formatted HTML content
   */
  formatMessageContent(content) {
    // This is a simple implementation - for a full app you might use a library like marked.js
    // Convert code blocks
    content = content.replace(/```([\s\S]*?)```/g, '<pre class="code-block">$1</pre>');
    
    // Convert inline code
    content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Convert line breaks to <br>
    content = content.replace(/\n/g, '<br>');
    
    return content;
  }
  
  /**
   * Show typing indicator in chat
   */
  showTypingIndicator() {
    // Remove any existing typing indicators
    this.removeTypingIndicator();
    
    // Create typing indicator
    const typingElement = document.createElement('div');
    typingElement.classList.add('chat-message', 'ai', 'typing-indicator');
    
    const avatarElement = document.createElement('div');
    avatarElement.classList.add('avatar');
    
    const avatarIcon = document.createElement('span');
    avatarIcon.classList.add('avatar-icon');
    avatarIcon.textContent = '🤖';
    
    avatarElement.appendChild(avatarIcon);
    
    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content');
    contentElement.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    
    typingElement.appendChild(avatarElement);
    typingElement.appendChild(contentElement);
    
    this.chatMessages.appendChild(typingElement);
    
    // Scroll to bottom
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }
  
  /**
   * Remove typing indicator from chat
   */
  removeTypingIndicator() {
    const typingIndicator = this.chatMessages.querySelector('.typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }
  
  /**
   * Clear chat history
   */
  clearChat() {
    // Confirm before clearing
    if (confirm('Are you sure you want to clear the chat history? This cannot be undone.')) {
      this.chatMessages.innerHTML = `
        <div class="empty-state">
          <p>Chat history cleared</p>
          <p>Start a new conversation</p>
        </div>
      `;
      
      this.chatHistory = [];
      this.saveChatHistory();
    }
  }
  
  /**
   * Save chat history to local storage
   */
  saveChatHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
  }
  
  /**
   * Load chat history from local storage
   */
  loadChatHistory() {
    try {
      const savedHistory = localStorage.getItem('chatHistory');
      if (savedHistory) {
        this.chatHistory = JSON.parse(savedHistory);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      this.chatHistory = [];
    }
  }
  
  /**
   * Render chat history in the UI
   */
  renderChatHistory() {
    if (this.chatHistory.length === 0) {
      // Show empty state
      this.chatMessages.innerHTML = `
        <div class="empty-state">
          <p>Welcome to AI Chat</p>
          <p>Ask questions about your notes and files</p>
        </div>
      `;
      return;
    }
    
    // Clear chat messages
    this.chatMessages.innerHTML = '';
    
    // Add each message to the chat
    for (const message of this.chatHistory) {
      this.addMessageToChat(message.role, message.content);
    }
  }
} 