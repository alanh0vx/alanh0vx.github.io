// AI Chatbot App
os.registerApp({
    id: 'ai-chat',
    name: 'AI Chat',
    icon: '🤖',
    category: 'ai',

    onLaunch(windowId) {
        this.windowId = windowId;
        this.messages = this.loadChatHistory();
        this.apiKey = this.loadApiKey();
        this.apiProvider = this.loadApiProvider() || 'openai';
        this.model = this.loadModel() || 'gpt-3.5-turbo';
        this.baseUrl = this.loadBaseUrl();

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

    loadBaseUrl() {
        return localStorage.getItem('ai_chat_base_url') || '';
    },

    saveBaseUrl(url) {
        localStorage.setItem('ai_chat_base_url', url);
        this.baseUrl = url;
    },

    loadChatHistory() {
        const history = localStorage.getItem('ai_chat_history');
        return history ? JSON.parse(history) : [];
    },

    saveChatHistory() {
        localStorage.setItem('ai_chat_history', JSON.stringify(this.messages));
    },

    clearChatHistory() {
        if (this.messages.length > 0 && confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
            localStorage.removeItem('ai_chat_history');
            this.messages = [];
            this.updateMessages();
        }
    },

    getModelTokenLimit() {
        const limits = {
            // OpenAI models
            'gpt-5': 128000,
            'gpt-5-mini': 32000,
            'gpt-5-nano': 16000,
            'gpt-4.1': 128000,
            'gpt-4.1-mini': 32000,
            'gpt-4.1-nano': 16000,
            'gpt-4o': 128000,
            'gpt-4o-mini': 32000,
            'gpt-4': 8192,
            'gpt-4-turbo': 128000,
            'gpt-3.5-turbo': 4096,
            
            // Anthropic models
            'claude-3-5-sonnet-20241022': 200000,
            'claude-3-opus-20240229': 200000,
            'claude-3-sonnet-20240229': 200000,
            'claude-3-haiku-20240307': 200000,
            
            // Google models
            'gemini-2.0-flash': 32000,
            'gemini-1.5-pro': 128000,
            'gemini-1.5-flash': 32000,
            'gemini-pro': 32000
        };
        return limits[this.model] || 4096; // Default fallback
    },

    estimateTokens(text) {
        // Rough estimation: ~4 characters per token for most languages
        // This is a simplified approximation
        return Math.ceil(text.length / 4);
    },

    trimConversationHistory(maxTokens) {
        const systemPrompt = 'You are a helpful assistant.';
        const systemTokens = this.estimateTokens(systemPrompt);
        const availableTokens = maxTokens - systemTokens - 500; // Reserve 500 tokens for response
        
        let totalTokens = 0;
        const trimmedMessages = [];
        
        // Work backwards from the most recent messages
        for (let i = this.messages.length - 1; i >= 0; i--) {
            const message = this.messages[i];
            if (message.isThinking) continue;
            
            const messageTokens = this.estimateTokens(message.content);
            
            if (totalTokens + messageTokens <= availableTokens) {
                totalTokens += messageTokens;
                trimmedMessages.unshift(message);
            } else {
                // If we can't fit this message, stop adding more
                break;
            }
        }
        
        // Always keep at least the last user message and response if possible
        if (trimmedMessages.length === 0 && this.messages.length > 0) {
            const lastMessage = this.messages[this.messages.length - 1];
            if (!lastMessage.isThinking) {
                trimmedMessages.push(lastMessage);
            }
        }
        
        // Set flag if conversation was trimmed
        const actualMessages = this.messages.filter(m => !m.isThinking);
        this.conversationTrimmed = trimmedMessages.length < actualMessages.length;
        
        return trimmedMessages;
    },

    getDefaultBaseUrl(provider) {
        const defaultUrls = {
            'openai': 'https://api.openai.com/v1/chat/completions',
            'anthropic': 'https://api.anthropic.com/v1/messages',
            'google': 'https://generativelanguage.googleapis.com/v1beta/models'
        };
        return defaultUrls[provider] || defaultUrls.openai;
    },

    getEffectiveBaseUrl() {
        return this.baseUrl || this.getDefaultBaseUrl(this.apiProvider);
    },

    render(content) {
        content.innerHTML = `
            <div class="ai-chat-app">
                <div class="ai-chat-header">
                    <h2>🤖 AI Chat Assistant${this.apiKey ? ` - ${this.model}` : ''}</h2>
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

                        <label>API Endpoint (optional):</label>
                        <input type="text" id="ai-base-url" placeholder="${this.getDefaultBaseUrl(this.apiProvider)}" value="${this.baseUrl}">
                        <small style="color: #666;">Leave empty to use default endpoint</small>

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
            'openai': ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4o', 'gpt-4o-mini', 'gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
            'anthropic': ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
            'google': ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro']
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
        const baseUrlInput = document.getElementById('ai-base-url');

        const models = {
            'openai': ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4o', 'gpt-4o-mini', 'gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
            'anthropic': ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
            'google': ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro']
        };

        const providerModels = models[provider] || models.openai;
        modelSelect.innerHTML = providerModels.map(model =>
            `<option value="${model}">${model}</option>`
        ).join('');

        // Update base URL placeholder
        if (baseUrlInput) {
            baseUrlInput.placeholder = this.getDefaultBaseUrl(provider);
        }
    },

    saveConfig() {
        const apiKey = document.getElementById('ai-api-key').value.trim();
        const provider = document.getElementById('ai-provider').value;
        const model = document.getElementById('ai-model').value;
        const baseUrl = document.getElementById('ai-base-url').value.trim();

        if (!apiKey) {
            alert('Please enter an API key');
            return;
        }

        this.saveApiKey(apiKey);
        this.saveApiProvider(provider);
        this.saveModel(model);
        this.saveBaseUrl(baseUrl);

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
        const trimmedWarning = this.conversationTrimmed ? ' | ⚠️ History trimmed' : '';
        
        return `
            <div class="ai-chat-container">
                <div class="ai-chat-status">
                    <small>Using: <strong>${this.apiProvider}</strong> | Model: <strong>${this.model}</strong>${this.baseUrl ? ' | Custom endpoint' : ''}${trimmedWarning}</small>
                    <button onclick="os.apps['ai-chat'].clearChatHistory()" class="ai-clear-btn" title="Clear chat history">🗑️</button>
                </div>
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
            <div class="ai-message ai-message-${msg.role}${msg.isThinking ? ' ai-thinking' : ''}">
                <div class="ai-message-avatar">${msg.role === 'user' ? '👤' : '🤖'}</div>
                <div class="ai-message-content">
                    <div class="ai-message-text">${msg.isThinking ? '<em style="opacity: 0.7;">thinking...</em>' : this.formatMessage(msg.content)}</div>
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

        // Save chat history after user message
        this.saveChatHistory();

        // Update UI
        this.updateMessages();

        // Add thinking message
        this.messages.push({ role: 'assistant', content: 'thinking...', isThinking: true });
        this.updateMessages();

        // Disable send button
        const sendBtn = document.getElementById('ai-send-btn');
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';

        try {
            // Check if we're approaching token limit before sending
            const currentTokens = this.messages.filter(m => !m.isThinking)
                .reduce((total, msg) => total + this.estimateTokens(msg.content), 0);
            const newMessageTokens = this.estimateTokens(message);
            const tokenLimit = this.getModelTokenLimit();
            
            if (currentTokens + newMessageTokens > tokenLimit * 0.8) {
                const shouldContinue = confirm(
                    `Warning: You're approaching the token limit (${currentTokens + newMessageTokens}/${tokenLimit}). ` +
                    'Older messages will be automatically removed to fit. Continue?'
                );
                if (!shouldContinue) {
                    // Re-enable send button and return
                    sendBtn.disabled = false;
                    sendBtn.textContent = 'Send 📤';
                    // Remove the thinking message
                    this.messages = this.messages.filter(m => !m.isThinking);
                    this.updateMessages();
                    return;
                }
            }
            
            // Send to API
            const response = await this.callAPI(message);

            // Remove thinking message and add real response
            this.messages = this.messages.filter(m => !m.isThinking);
            this.messages.push({ role: 'assistant', content: response });
            this.updateMessages();
            
            // Save chat history after assistant response
            this.saveChatHistory();
        } catch (error) {
            // Remove thinking message and add error
            this.messages = this.messages.filter(m => !m.isThinking);
            this.messages.push({
                role: 'assistant',
                content: `❌ Error: ${error.message}\n\nPlease check your API key and settings.`
            });
            this.updateMessages();
            
            // Save chat history even after error
            this.saveChatHistory();
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
        const url = this.getEffectiveBaseUrl();
        const maxTokens = this.getModelTokenLimit();
        const conversationHistory = this.trimConversationHistory(maxTokens);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    ...conversationHistory.map(m => ({ role: m.role, content: m.content }))
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
        const url = this.getEffectiveBaseUrl();
        const maxTokens = this.getModelTokenLimit();
        const conversationHistory = this.trimConversationHistory(maxTokens);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: 1024,
                messages: conversationHistory.map(m => ({ role: m.role, content: m.content }))
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
        let url = this.getEffectiveBaseUrl();
        
        // If using default URL structure, append model and endpoint
        if (!this.baseUrl || this.baseUrl === '') {
            url = `${url}/${this.model}:generateContent?key=${this.apiKey}`;
        } else {
            // For custom URLs, assume they handle the model and key themselves
            // or provide a complete endpoint
            if (!url.includes('?')) {
                url += `?key=${this.apiKey}`;
            }
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: message }]
                }]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }
});
