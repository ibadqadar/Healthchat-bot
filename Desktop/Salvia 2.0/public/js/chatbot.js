document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');
    const chatContainer = document.getElementById('chatContainer');
    const sendBtn = document.getElementById('sendBtn');

    // Generate a simple session ID for the chat session
    const sessionId = Math.random().toString(36).substring(7);

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const message = userInput.value.trim();
        if (!message) return;

        // Append the user's message to the chat interface
        appendMessage(message, 'user');
        userInput.value = '';
        
        // Show loading
        const loaderId = showTypingIndicator();
        scrollToBottom();

        try {
            // Send the message to the backend API endpoint
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message, sessionId })
            });

            const data = await response.json();
            
            // Remove loader
            removeTypingIndicator(loaderId);
            
            if (response.ok) {
                appendMessage(data.reply || 'I am sorry, I do not have an answer to that.', 'bot');
            } else {
                appendMessage('Sorry, I encountered an error connecting to the server.', 'bot');
            }
        } catch (error) {
            console.error('Error:', error);
            removeTypingIndicator(loaderId);
            appendMessage('Network error. Please try again later.', 'bot');
        }
        
        scrollToBottom();
    });

    function appendMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `chat-bubble ${sender}`;
        
        const content = document.createElement('div');
        // Sanitize input text to prevent XSS attacks
        content.textContent = text; 
        div.appendChild(content);
        
        const timestamp = document.createElement('div');
        timestamp.className = 'chat-timestamp';
        const now = new Date();
        timestamp.innerHTML = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        div.appendChild(timestamp);

        chatContainer.appendChild(div);
    }

    function showTypingIndicator() {
        const id = 'loader-' + Date.now();
        const div = document.createElement('div');
        div.className = `typing-indicator`;
        div.id = id;
        
        div.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        
        chatContainer.appendChild(div);
        return id;
    }

    function removeTypingIndicator(id) {
        const loader = document.getElementById(id);
        if (loader) {
            loader.remove();
        }
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
});
