document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chatContainer');
    const messagesArea = document.getElementById('messagesArea');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const menuUploadBtn = document.getElementById('menuUploadBtn');
    const fileInput = document.getElementById('fileInput');
    
    // Sidebar Elements
    const chatHistoryList = document.getElementById('chatHistoryList');
    const chatHistoryListMobile = document.getElementById('chatHistoryListMobile');
    const newChatBtn = document.getElementById('newChatBtn');
    const newChatBtnMobile = document.getElementById('newChatBtnMobile');
    const noChatsMsg = document.getElementById('noChatsMsg');
    const themeToggleBtn = document.getElementById('themeToggleBtn');

    // State Management
    let healthChats = JSON.parse(localStorage.getItem('healthChats')) || [];
    let currentChatId = null;
    let isDarkMode = localStorage.getItem('theme') === 'dark';
    
    // Camera Modal Elements
    const cameraModal = document.getElementById('cameraModal');
    const cameraStream = document.getElementById('cameraStream');
    const capturePhotoBtn = document.getElementById('capturePhotoBtn');
    const cameraLoading = document.getElementById('cameraLoading');
    const cameraCanvas = document.getElementById('cameraCanvas');
    let videoStream = null;

    // Auto-resize textarea
    userInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.value.trim().length > 0) {
            sendBtn.removeAttribute('disabled');
        } else {
            sendBtn.setAttribute('disabled', 'true');
        }
    });

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    sendBtn.addEventListener('click', handleSend);
    
    if (menuUploadBtn) {
        menuUploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            fileInput.click();
        });
    }

    fileInput.addEventListener('change', handleFileUpload);

    // --- Camera Logic ---

    // When modal opens, start camera
    if (cameraModal) {
        cameraModal.addEventListener('show.bs.modal', async () => {
            cameraLoading.style.display = 'flex';
            cameraStream.style.display = 'none';
            capturePhotoBtn.disabled = true;

            try {
                // Request back camera on mobile, or default webcam on desktop
                videoStream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' }, 
                    audio: false 
                });
                cameraStream.srcObject = videoStream;
                cameraStream.onloadedmetadata = () => {
                    cameraLoading.style.display = 'none';
                    cameraStream.style.display = 'block';
                    capturePhotoBtn.disabled = false;
                };
            } catch (err) {
                console.error("Camera access error:", err);
                cameraLoading.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-danger fs-4 mb-2"></i><span class="text-center px-3">Could not access camera.<br>Please ensure you have granted camera permissions.</span>`;
            }
        });

        // When modal closes, stop camera
        cameraModal.addEventListener('hidden.bs.modal', () => {
            if (videoStream) {
                videoStream.getTracks().forEach(track => track.stop());
                videoStream = null;
            }
            cameraStream.srcObject = null;
        });
    }

   if (capturePhotoBtn) {
        capturePhotoBtn.addEventListener('click', () => {
            if (!videoStream) return;

            cameraCanvas.width = cameraStream.videoWidth;
            cameraCanvas.height = cameraStream.videoHeight;
            const ctx = cameraCanvas.getContext('2d');
            ctx.drawImage(cameraStream, 0, 0, cameraCanvas.width, cameraCanvas.height);
            
            // Convert canvas directly to a File Blob instead of Base64
            cameraCanvas.toBlob((blob) => {
                const bsModal = bootstrap.Modal.getInstance(cameraModal);
                if (bsModal) bsModal.hide();

                const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
                processImageUpload(file); // Pass the file object
            }, 'image/jpeg', 0.8);
        });
    }

    function scrollToBottom() {
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
        });
    }

    function appendMessage(text, isUser = false, imageUrl = null, saveToHistory = true) {
        const wrapper = document.createElement('div');
        wrapper.className = `chat-message-row ${isUser ? 'user' : 'bot'}`;

        let innerContent = '';
        if (imageUrl) {
            innerContent += `<img src="${imageUrl}" alt="Uploaded Image" />`;
        }

        // Basic markdown formatting
        let formattedText = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br/>');

        innerContent += `<span>${formattedText}</span>`;

        wrapper.innerHTML = `
            <div class="chat-bubble-wrapper">
                <div class="chat-avatar ${isUser ? 'user' : 'bot'}">
                    <i class="fa-solid ${isUser ? 'fa-user' : 'fa-robot'}"></i>
                </div>
                <div class="chat-bubble ${isUser ? 'user' : 'bot'}">
                    ${innerContent}
                </div>
            </div>
        `;

        messagesArea.appendChild(wrapper);
        scrollToBottom();

        if (saveToHistory) {
            saveMessageToCurrentChat(text, isUser, imageUrl);
        }
    }

    // --- State Management for Multiple Chats ---

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    function generateChatTitle(text) {
        if (text === "Please identify this medication.") return "Medication Scan";
        const words = text.trim().split(/\s+/);
        const titleWords = words.slice(0, 5).join(' ');
        return titleWords + (words.length > 5 ? '...' : '');
    }

    function saveMessageToCurrentChat(text, isUser, imageUrl) {
        if (!currentChatId) {
            currentChatId = generateId();
            const newChat = {
                id: currentChatId,
                title: isUser ? generateChatTitle(text) : 'New Chat',
                messages: [],
                updatedAt: Date.now()
            };
            healthChats.unshift(newChat);
        }

        const chat = healthChats.find(c => c.id === currentChatId);
        if (chat) {
            chat.messages.push({ text, isUser, imageUrl });
            chat.updatedAt = Date.now();
            
            // If the chat didn't have a good title and the user sent a message, update it
            if (chat.title === 'New Chat' && isUser) {
                chat.title = generateChatTitle(text);
            }
            
            // Sort chats by updatedAt descending
            healthChats.sort((a, b) => b.updatedAt - a.updatedAt);
            localStorage.setItem('healthChats', JSON.stringify(healthChats));
            renderSidebar();
        }
    }

    function renderSidebar() {
        const createHTML = (chat) => `
            <div class="chat-history-item ${chat.id === currentChatId ? 'active' : ''}" data-id="${chat.id}">
                <i class="fa-regular fa-message text-muted me-2"></i>
                <span class="chat-history-title">${chat.title}</span>
                <button class="chat-history-delete" title="Delete Chat" data-id="${chat.id}">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;

        if (healthChats.length === 0) {
            if (noChatsMsg) noChatsMsg.style.display = 'block';
            if (chatHistoryList) chatHistoryList.innerHTML = noChatsMsg ? noChatsMsg.outerHTML : '<div class="text-center text-muted small mt-4 p-3">No previous chats.</div>';
            if (chatHistoryListMobile) chatHistoryListMobile.innerHTML = '';
        } else {
            if (noChatsMsg) noChatsMsg.style.display = 'none';
            const html = healthChats.map(createHTML).join('');
            if (chatHistoryList) chatHistoryList.innerHTML = html;
            if (chatHistoryListMobile) chatHistoryListMobile.innerHTML = html;
        }

        // Attach event listeners to sidebar items
        document.querySelectorAll('.chat-history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // If clicked on delete button, let the delete handler take care of it
                if (e.target.closest('.chat-history-delete')) return;
                const id = item.getAttribute('data-id');
                switchChat(id);
                // Close offcanvas if on mobile
                const offcanvasEl = document.getElementById('sidebarOffcanvas');
                if (offcanvasEl) {
                    const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
                    if (bsOffcanvas) bsOffcanvas.hide();
                }
            });
        });

        document.querySelectorAll('.chat-history-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                deleteChat(id);
            });
        });
    }

    function switchChat(id) {
        if (currentChatId === id) return;
        currentChatId = id;
        
        const chat = healthChats.find(c => c.id === id);
        if (chat) {
            messagesArea.innerHTML = ''; // clear area
            chat.messages.forEach(msg => {
                appendMessage(msg.text, msg.isUser, msg.imageUrl, false);
            });
            renderSidebar();
        }
    }

    function deleteChat(id) {
        healthChats = healthChats.filter(c => c.id !== id);
        localStorage.setItem('healthChats', JSON.stringify(healthChats));
        
        if (currentChatId === id) {
            createNewChat();
        } else {
            renderSidebar();
        }
    }

    function createNewChat() {
        currentChatId = null;
        messagesArea.innerHTML = `
            <div class="chat-message-row bot">
                <div class="chat-bubble-wrapper">
                    <div class="chat-avatar bot">
                        <i class="fa-solid fa-robot"></i>
                    </div>
                    <div class="chat-bubble bot">
                        Hello! I am Salvia AI. How can I help you today? You can ask me health-related questions or upload an image of a medication packaging to identify it.
                    </div>
                </div>
            </div>
        `;
        renderSidebar();
        
        // Close offcanvas if on mobile
        const offcanvasEl = document.getElementById('sidebarOffcanvas');
        if (offcanvasEl) {
            const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
            if (bsOffcanvas) bsOffcanvas.hide();
        }
    }

    // --- Theme Toggle Logic ---
    function initTheme() {
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            if (themeToggleBtn) {
                themeToggleBtn.innerHTML = '<i class="fa-regular fa-sun"></i> <span class="d-none d-sm-inline">Light Mode</span>';
            }
        }
        
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                isDarkMode = !isDarkMode;
                if (isDarkMode) {
                    document.body.classList.add('dark-mode');
                    localStorage.setItem('theme', 'dark');
                    themeToggleBtn.innerHTML = '<i class="fa-regular fa-sun"></i> <span class="d-none d-sm-inline">Light Mode</span>';
                } else {
                    document.body.classList.remove('dark-mode');
                    localStorage.setItem('theme', 'light');
                    themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i> <span class="d-none d-sm-inline">Dark Mode</span>';
                }
            });
        }
    }

    // Initialize state
    function init() {
        // Clear the old sessionStorage implementation if it exists to avoid confusion
        sessionStorage.removeItem('chatHistory');
        
        initTheme();
        
        if (newChatBtn) newChatBtn.addEventListener('click', createNewChat);
        if (newChatBtnMobile) newChatBtnMobile.addEventListener('click', createNewChat);

        createNewChat();
    }

    init();

    function showTypingIndicator() {
        const id = 'loader-' + Date.now();
        const wrapper = document.createElement('div');
        wrapper.id = id;
        wrapper.className = "chat-message-row bot";
        wrapper.innerHTML = `
            <div class="chat-bubble-wrapper">
                <div class="chat-avatar bot">
                    <i class="fa-solid fa-robot"></i>
                </div>
                <div class="chat-bubble bot p-2" style="display: flex; align-items: center; justify-content: center; height: 44px; width: 64px;">
                    <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        `;
        messagesArea.appendChild(wrapper);
        scrollToBottom();
        return id;
    }

    function removeTypingIndicator(id) {
        const loader = document.getElementById(id);
        if (loader) loader.remove();
    }

    async function handleSend() {
        const message = userInput.value.trim();
        if (!message) return;

        // Render user bubble immediately but DON'T save to history yet
        appendMessage(message, true, null, false);
        userInput.value = '';
        userInput.style.height = 'auto';
        sendBtn.setAttribute('disabled', 'true');

        const loaderId = showTypingIndicator();

        try {
            // Get chat history to give the AI context (filtering out image uploads for text chat)
            const chat = healthChats.find(c => c.id === currentChatId);
            const history = chat ? chat.messages
                .filter(m => !m.imageUrl) // only text
                .map(m => ({
                    role: m.isUser ? 'user' : 'model',
                    parts: [{ text: m.text }]
                })) : [];

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, history })
            });

            const data = await response.json();
            removeTypingIndicator(loaderId);

            if (response.ok) {
                // Only NOW save the user message to history (after successful response)
                saveMessageToCurrentChat(message, true, null);
                appendMessage(data.reply);
                
                if (data.action === 'OPEN_MAP') {
                    const type = data.facilityType || 'hospital';
                    setTimeout(() => {
                        window.location.href = `/map.html?auto=true&type=${type}`;
                    }, 5000); // 5 seconds delay to let user read the message
                }
            } else {
                // On error: show message in UI but do NOT save to history
                const errDiv = document.createElement('div');
                errDiv.className = 'chat-message-row bot';
                errDiv.innerHTML = `<div class="chat-bubble-wrapper"><div class="chat-avatar bot"><i class="fa-solid fa-robot"></i></div><div class="chat-bubble bot" style="color:#ef4444;">⚠️ Error: ${data.error || 'Failed to connect to server.'}</div></div>`;
                messagesArea.appendChild(errDiv);
                scrollToBottom();
            }
        } catch (error) {
            console.error('Chat Error:', error);
            removeTypingIndicator(loaderId);
            // Show error in UI but do NOT save to history
            const errDiv = document.createElement('div');
            errDiv.className = 'chat-message-row bot';
            errDiv.innerHTML = `<div class="chat-bubble-wrapper"><div class="chat-avatar bot"><i class="fa-solid fa-robot"></i></div><div class="chat-bubble bot" style="color:#ef4444;">⚠️ Network error. Please check if the server is running.</div></div>`;
            messagesArea.appendChild(errDiv);
            scrollToBottom();
        }
    }

    async function handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please upload a valid image file.');
            return;
        }

        // Pass the file directly, no Base64 conversion
        processImageUpload(file);
        fileInput.value = '';
    }

    async function processImageUpload(file) {
        // Create a temporary URL just for the UI so it looks instant
        const tempUrl = URL.createObjectURL(file);
        
        // Show in UI immediately, but pass 'false' so it DOES NOT save the tempUrl to localStorage
        appendMessage("Please identify this medication.", true, tempUrl, false);

        const loaderId = showTypingIndicator();

        // Use FormData to send the actual file to Multer
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/api/identify', {
                method: 'POST',
                body: formData // Note: Do not set Content-Type header when using FormData
            });

            const data = await response.json();
            removeTypingIndicator(loaderId);

            if (response.ok) {
                // NOW we save the message to localStorage using the lightweight URL from the server
                saveMessageToCurrentChat("Please identify this medication.", true, data.imageUrl);
                // Append AI reply
                appendMessage(data.reply);
            } else {
                appendMessage('⚠️ Error: ' + (data.error || 'Failed to analyze image.'));
            }
        } catch (error) {
            console.error('Upload Error:', error);
            removeTypingIndicator(loaderId);
            appendMessage('⚠️ Network error during upload.');
        }
    }
    
});
