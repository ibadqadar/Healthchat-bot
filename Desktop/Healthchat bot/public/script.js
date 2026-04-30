document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chatContainer');
    const messagesArea = document.getElementById('messagesArea');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const menuUploadBtn = document.getElementById('menuUploadBtn');
    const fileInput = document.getElementById('fileInput');
    
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

            // Set canvas dimensions to match video stream
            cameraCanvas.width = cameraStream.videoWidth;
            cameraCanvas.height = cameraStream.videoHeight;
            
            // Draw video frame to canvas
            const ctx = cameraCanvas.getContext('2d');
            ctx.drawImage(cameraStream, 0, 0, cameraCanvas.width, cameraCanvas.height);
            
            // Convert to base64 image (JPEG)
            const base64String = cameraCanvas.toDataURL('image/jpeg', 0.8);
            
            // Close modal
            const bsModal = bootstrap.Modal.getInstance(cameraModal);
            if (bsModal) bsModal.hide();

            // Process image
            processImageUpload(base64String);
        });
    }

    function scrollToBottom() {
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
        });
    }

    function appendMessage(text, isUser = false, imageUrl = null) {
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
    }

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

        appendMessage(message, true);
        userInput.value = '';
        userInput.style.height = 'auto';
        sendBtn.setAttribute('disabled', 'true');

        const loaderId = showTypingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            removeTypingIndicator(loaderId);

            if (response.ok) {
                appendMessage(data.reply);
            } else {
                appendMessage('⚠️ Error: ' + (data.error || 'Failed to connect to server.'));
            }
        } catch (error) {
            console.error('Chat Error:', error);
            removeTypingIndicator(loaderId);
            appendMessage('⚠️ Network error. Please check if the server is running.');
        }
    }

    async function handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please upload a valid image file.');
            return;
        }

        // Convert file to Base64
        const reader = new FileReader();
        reader.onload = function (event) {
            processImageUpload(event.target.result);
        };
        reader.readAsDataURL(file);

        // Reset file input
        fileInput.value = '';
    }

    async function processImageUpload(base64String) {
        // Show user message with image
        appendMessage("Please identify this medication.", true, base64String);

        const loaderId = showTypingIndicator();

        try {
            const response = await fetch('/api/identify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageBase64: base64String,
                    query: "Please identify this medication, its uses, and any precautions."
                })
            });

            const data = await response.json();
            removeTypingIndicator(loaderId);

            if (response.ok) {
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
