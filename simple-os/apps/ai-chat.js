// AI Chatbot App
os.registerApp({
    id: 'ai-chat',
    name: 'AI Chat',
    icon: '🤖',
    category: 'ai',

    onLaunch(windowId) {
        this.windowId = windowId;
        this.messages = [];
        this.apiKey = this.loadApiKey();
        this.apiProvider = this.loadApiProvider() || 'openai';
        this.model = this.loadModel() || 'gpt-3.5-turbo';

        const content = os.getWindowContent(windowId);
        this.render(content);
    },

    loadApiKey() {
        return localStorage.getItem('ai_chat_api_key') || '';
    },

    saveApiKey(key) {
        localStorage.setItem('ai_chat_api_key', key);
        this.apiKey = key;
    },

    loadApiProvider() {
        return localStorage.getItem('ai_chat_provider') || 'openai';
    },

    saveApiProvider(provider) {
        localStorage.setItem('ai_chat_provider', provider);
        this.apiProvider = provider;
    },

    loadModel() {
        return localStorage.getItem('ai_chat_model') || 'gpt-3.5-turbo';
    },

    saveModel(model) {
        localStorage.setItem('ai_chat_model', model);
        this.model = model;
    },

    render(content) {
        content.innerHTML = `
            <div class="ai-chat-app">
                <div class="ai-chat-header">
                    <h2>🤖 AI Chat Assistant</h2>
                    <button onclick="os.apps['ai-chat'].showSettings()" class="ai-settings-btn">⚙️ Settings</button>
                </div>

                ${!this.apiKey ? this.renderSetup() : this.renderChat()}
            </div>
        `;
    },

    renderSetup() {
        return `
            <div class="ai-setup">
                <div class="ai-setup-content">
                    <h3>Welcome to AI Chat!</h3>
                    <p>To get started, please configure your API settings.</p>

                    <div class="ai-setup-form">
                        <label>API Provider:</label>
                        <select id="ai-provider" onchange="os.apps['ai-chat'].updateModelOptions()">
                            <option value="openai" ${this.apiProvider === 'openai' ? 'selected' : ''}>OpenAI</option>
                            <option value="anthropic" ${this.apiProvider === 'anthropic' ? 'selected' : ''}>Anthropic (Claude)</option>
                            <option value="google" ${this.apiProvider === 'google' ? 'selected' : ''}>Google (Gemini)</option>
                        </select>

                        <label>Model:</label>
                        <select id="ai-model">
                            ${this.getModelOptions()}
                        </select>

                        <label>API Key:</label>
                        <input type="password" id="ai-api-key" placeholder="Enter your API key" value="${this.apiKey}">

                        <button onclick="os.apps['ai-chat'].saveConfig()" class="ai-save-btn">💾 Save & Start</button>
                    </div>

                    <div class="ai-setup-info">
                        <h4>ℹ️ Getting API Keys:</h4>
                        <ul>
                            <li><strong>OpenAI:</strong> <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com/api-keys</a></li>
                            <li><strong>Anthropic:</strong> <a href="https://console.anthropic.com/settings/keys" target="_blank">console.anthropic.com/settings/keys</a></li>
                            <li><strong>Google:</strong> <a href="https://aistudio.google.com/app/apikey" target="_blank">aistudio.google.com/app/apikey</a></li>
                        </ul>
                        <p class="ai-privacy-note">🔒 Your API key is stored locally in your browser and never sent to our servers.</p>
                    </div>
                </div>
            </div>
        `;
    },

    getModelOptions() {
        const models = {
            'openai': ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
            'anthropic': ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
            'google': ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash']
        };

        const providerModels = models[this.apiProvider] || models.openai;
        return providerModels.map(model =>
            `<option value="${model}" ${this.model === model ? 'selected' : ''}>${model}</option>`
        ).join('');
    },

    updateModelOptions() {
        const provider = document.getElementById('ai-provider').value;
        this.apiProvider = provider;
        const modelSelect = document.getElementById('ai-model');

        const models = {
            'openai': ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
            'anthropic': ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
            'google': ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash']
        };

        const providerModels = models[provider] || models.openai;
        modelSelect.innerHTML = providerModels.map(model =>
            `<option value="${model}">${model}</option>`
        ).join('');
    },

    saveConfig() {
        const apiKey = document.getElementById('ai-api-key').value.trim();
        const provider = document.getElementById('ai-provider').value;
        const model = document.getElementById('ai-model').value;

        if (!apiKey) {
            alert('Please enter an API key');
            return;
        }

        this.saveApiKey(apiKey);
        this.saveApiProvider(provider);
        this.saveModel(model);

        const content = os.getWindowContent(this.windowId);
        this.render(content);
    },

    showSettings() {
        const content = os.getWindowContent(this.windowId);
        content.innerHTML = `
            <div class="ai-chat-app">
                <div class="ai-chat-header">
                    <h2>⚙️ AI Chat Settings</h2>
                    <button onclick="os.apps['ai-chat'].backToChat()" class="ai-back-btn">← Back to Chat</button>
                </div>
                ${this.renderSetup()}
            </div>
        `;
    },

    backToChat() {
        const content = os.getWindowContent(this.windowId);
        this.render(content);
    },

    renderChat() {
        return `
            <div class="ai-chat-container">
                <div class="ai-chat-messages" id="ai-messages">
                    ${this.messages.length === 0 ? `
                        <div class="ai-welcome-message">
                            <h3>👋 Hello! I'm your AI assistant.</h3>
                            <p>How can I help you today?</p>
                        </div>
                    ` : this.renderMessages()}
                </div>
                <div class="ai-chat-input-container">
                    <textarea id="ai-input" placeholder="Type your message... (Shift+Enter for new line, Enter to send)" rows="3" onkeydown="if(event.key==='Enter' && !event.shiftKey){event.preventDefault(); os.apps['ai-chat'].sendMessage();}"></textarea>
                    <button onclick="os.apps['ai-chat'].sendMessage()" class="ai-send-btn" id="ai-send-btn">
                        Send 📤
                    </button>
                </div>
            </div>
        `;
    },

    renderMessages() {
        return this.messages.map(msg => `
            <div class="ai-message ai-message-${msg.role}">
                <div class="ai-message-avatar">${msg.role === 'user' ? '👤' : '🤖'}</div>
                <div class="ai-message-content">
                    <div class="ai-message-text">${this.formatMessage(msg.content)}</div>
                </div>
            </div>
        `).join('');
    },

    formatMessage(text) {
        // Basic markdown-like formatting
        return text
            .replace(/\n/g, '<br>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>');
    },

    async sendMessage() {
        const input = document.getElementById('ai-input');
        const message = input.value.trim();

        if (!message) return;

        // Add user message
        this.messages.push({ role: 'user', content: message });
        input.value = '';

        // Update UI
        this.updateMessages();

        // Disable send button
        const sendBtn = document.getElementById('ai-send-btn');
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';

        try {
            // Send to API
            const response = await this.callAPI(message);

            // Add assistant response
            this.messages.push({ role: 'assistant', content: response });
            this.updateMessages();
        } catch (error) {
            this.messages.push({
                role: 'assistant',
                content: `❌ Error: ${error.message}\n\nPlease check your API key and settings.`
            });
            this.updateMessages();
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send 📤';
        }
    },

    updateMessages() {
        const messagesContainer = document.getElementById('ai-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = this.renderMessages();
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    },

    async callAPI(message) {
        if (this.apiProvider === 'openai') {
            return await this.callOpenAI(message);
        } else if (this.apiProvider === 'anthropic') {
            return await this.callAnthropic(message);
        } else if (this.apiProvider === 'google') {
            return await this.callGoogle(message);
        }
    },

    async callOpenAI(message) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    ...this.messages.map(m => ({ role: m.role, content: m.content }))
                ]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    },

    async callAnthropic(message) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: 1024,
                messages: this.messages.map(m => ({ role: m.role, content: m.content }))
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        const data = await response.json();
        return data.content[0].text;
    },

    async callGoogle(message) {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: message }]
                    }]
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }
});
