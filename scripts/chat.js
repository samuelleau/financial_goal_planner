class FinGoalChat {
    constructor() {
        this.apiKey = localStorage.getItem('openai_api_key');
        this.isDemo = localStorage.getItem('demo_mode') === 'true';
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.apiKeyModal = document.getElementById('apiKeyModal');
        
        this.conversationHistory = [];
        this.isTyping = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkApiKey();
        this.loadChatHistory();
    }

    setupEventListeners() {
        // Send button click
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        
        // Enter key press
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // API Key modal
        document.getElementById('saveApiKey').addEventListener('click', () => this.saveApiKey());
        document.getElementById('skipApiKey').addEventListener('click', () => this.enableDemoMode());

        // Quick action buttons
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prompt = e.currentTarget.dataset.prompt;
                this.chatInput.value = prompt;
                this.sendMessage();
            });
        });

        // Auto-resize chat input
        this.chatInput.addEventListener('input', () => {
            this.chatInput.style.height = 'auto';
            this.chatInput.style.height = this.chatInput.scrollHeight + 'px';
        });
    }

    checkApiKey() {
        if (!this.apiKey && !this.isDemo) {
            this.showApiKeyModal();
        }
    }

    showApiKeyModal() {
        this.apiKeyModal.style.display = 'flex';
    }

    hideApiKeyModal() {
        this.apiKeyModal.style.display = 'none';
    }

    saveApiKey() {
        const apiKeyInput = document.getElementById('apiKeyInput');
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            this.showError('Please enter a valid API key');
            return;
        }

        if (!apiKey.startsWith('sk-')) {
            this.showError('API key should start with "sk-"');
            return;
        }

        localStorage.setItem('openai_api_key', apiKey);
        localStorage.removeItem('demo_mode');
        this.apiKey = apiKey;
        this.isDemo = false;
        this.hideApiKeyModal();
        this.showSuccess('API key saved successfully!');
    }

    enableDemoMode() {
        localStorage.setItem('demo_mode', 'true');
        localStorage.removeItem('openai_api_key');
        this.isDemo = true;
        this.apiKey = null;
        this.hideApiKeyModal();
        this.showSuccess('Demo mode enabled. AI responses will be simulated.');
    }

    loadChatHistory() {
        const savedHistory = localStorage.getItem('chat_history');
        if (savedHistory) {
            this.conversationHistory = JSON.parse(savedHistory);
        }
    }

    saveChatHistory() {
        localStorage.setItem('chat_history', JSON.stringify(this.conversationHistory));
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message || this.isTyping) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        this.chatInput.value = '';
        this.chatInput.style.height = 'auto';

        // Add to conversation history
        this.conversationHistory.push({ role: 'user', content: message });

        // Show typing indicator
        this.showTypingIndicator();

        try {
            let response;
            if (this.isDemo) {
                response = await this.getDemoResponse(message);
            } else {
                response = await this.getOpenAIResponse(message);
            }

            this.hideTypingIndicator();
            this.addMessage(response, 'ai');
            this.conversationHistory.push({ role: 'assistant', content: response });
            this.saveChatHistory();

        } catch (error) {
            this.hideTypingIndicator();
            this.showError('Sorry, I encountered an error. Please try again.');
            console.error('Chat error:', error);
        }
    }

    async getOpenAIResponse(message) {
        const systemPrompt = `You are FinGoal AI, a financial advisor specifically designed for Gen Z (ages 18-27). Your role is to provide practical, actionable financial advice that resonates with young adults facing modern financial challenges.

Key characteristics:
- Use a friendly, conversational tone with occasional emojis
- Focus on practical, actionable advice
- Address common Gen Z financial concerns: student loans, high cost of living, gig economy, housing costs
- Promote healthy financial habits: budgeting, emergency funds, investing early
- Be encouraging and non-judgmental
- Provide specific numbers and examples when possible
- Consider modern financial tools and apps
- Address mental health aspects of financial stress

Common topics you should be expert in:
- Building emergency funds
- Paying off student debt
- Starting to invest with small amounts
- Budgeting on irregular income
- Saving for major goals (house, car, travel)
- Credit building and management
- Side hustles and multiple income streams
- Financial apps and tools

Always end responses with a follow-up question to keep the conversation going.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...this.conversationHistory.slice(-10) // Keep last 10 messages for context
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async getDemoResponse(message) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        const demoResponses = {
            budget: "Great question about budgeting! 💰 For someone earning $3000/month, I'd recommend the 50/30/20 rule as a starting point:\n\n• 50% ($1500) for needs: rent, utilities, groceries, minimum debt payments\n• 30% ($900) for wants: dining out, entertainment, hobbies\n• 20% ($600) for savings and debt repayment\n\nSince you're young, try to prioritize building that emergency fund first - even $25/week adds up! What's your biggest expense category right now?",
            
            investing: "Love that you're thinking about investing at 22! 🚀 Starting early is your biggest advantage thanks to compound interest.\n\nHere's my beginner roadmap:\n1. Build a small emergency fund ($1000)\n2. Start with a Roth IRA - you can contribute up to $6500/year\n3. Consider low-cost index funds (like VTSAX or VTI)\n4. Start small - even $50/month makes a difference!\n\nApps like Acorns or M1 Finance make it super easy to start. What's holding you back from starting - is it the minimum amounts or just not knowing where to begin?",
            
            emergency: "Smart thinking about emergency funds! 🛡️ For Gen Z, I recommend starting with $1000 as your first milestone, then building to 3-6 months of expenses.\n\nWhy $1000 first? It covers most common emergencies (car repair, medical bill, job gap) without feeling overwhelming.\n\nQuick tips:\n• Open a high-yield savings account (2-4% APY)\n• Automate $25-50/week transfers\n• Keep it separate from checking to avoid temptation\n• Use apps like Qapital or Digit for automatic saving\n\nWhat's your current monthly expenses? That'll help determine your full emergency fund goal!",
            
            debt: "Credit card debt is tough, but $5000 is totally manageable with the right strategy! 💪\n\nHere's the game plan:\n1. **Avalanche method**: List all debts by interest rate, pay minimums on all, attack highest rate first\n2. **Snowball method**: Pay smallest balance first for psychological wins\n\nFor $5000, if you can pay $200/month extra:\n• At 18% APR: paid off in ~2 years, save $1000+ in interest\n• Consider balance transfer to 0% APR card if you qualify\n\nSide hustle ideas: food delivery, freelancing, selling stuff you don't need. What's the interest rate on your cards?",
            
            home: "House planning at your age is awesome! 🏠 5 years gives you solid time to prepare.\n\nTypical costs to save for:\n• Down payment: 10-20% of home price\n• Closing costs: 2-5% of home price\n• Moving expenses: $2000-5000\n• Emergency repairs: $5000-10000\n\nFor a $300k home, you'd need $30k-60k down payment plus $15k-20k for other costs.\n\nStrategy:\n• High-yield savings for down payment\n• Improve credit score (aim for 740+)\n• Research first-time buyer programs\n• Consider house hacking (rent out rooms)\n\nWhat's your target home price range and current savings rate?",
            
            credit: "Building credit as a young adult is crucial! 📈 Here's the roadmap:\n\n**Start with:**\n• Student credit card or secured card\n• Become authorized user on parent's card\n• Credit builder loan from credit union\n\n**Golden rules:**\n• Keep utilization under 30% (ideally under 10%)\n• Pay full balance monthly, never just minimum\n• Don't close old cards (hurts credit age)\n• Set up autopay to never miss payments\n\n**Monitor with:** Credit Karma, Experian app, or bank's free credit score\n\n**Timeline:** 6-12 months to see real improvement\n\nWhat's your current credit situation - no credit history or rebuilding from mistakes?"
        };

        // Simple keyword matching for demo responses
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('budget') || lowerMessage.includes('$3000')) {
            return demoResponses.budget;
        } else if (lowerMessage.includes('invest') || lowerMessage.includes('22 years old')) {
            return demoResponses.investing;
        } else if (lowerMessage.includes('emergency fund')) {
            return demoResponses.emergency;
        } else if (lowerMessage.includes('credit card debt') || lowerMessage.includes('$5000')) {
            return demoResponses.debt;
        } else if (lowerMessage.includes('home') || lowerMessage.includes('house')) {
            return demoResponses.home;
        } else if (lowerMessage.includes('credit') && lowerMessage.includes('build')) {
            return demoResponses.credit;
        } else {
            // Generic response for other questions
            return `Thanks for your question! 😊 As your AI financial advisor, I'm here to help with all aspects of your financial journey.\n\nI can help you with:\n• Creating budgets and saving strategies\n• Investment advice for beginners\n• Debt payoff plans\n• Credit building tips\n• Goal-specific saving (emergency fund, house, etc.)\n\nCould you be more specific about what financial area you'd like to focus on? The more details you share, the better I can tailor my advice to your situation!`;
        }
    }

    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (sender === 'user') {
            messageContent.innerHTML = `<strong>You:</strong> ${this.escapeHtml(content)}`;
        } else {
            messageContent.innerHTML = `<strong>FinGoal AI:</strong> ${this.formatAIResponse(content)}`;
        }
        
        messageDiv.appendChild(messageContent);
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatAIResponse(content) {
        // Convert markdown-like formatting to HTML
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/•/g, '&bull;');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showTypingIndicator() {
        this.isTyping = true;
        this.sendBtn.disabled = true;
        this.sendBtn.innerHTML = '<div class="loading"></div>';
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <span>FinGoal AI is typing</span>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.isTyping = false;
        this.sendBtn.disabled = false;
        this.sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        this.chatMessages.appendChild(errorDiv);
        this.scrollToBottom();
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        this.chatMessages.appendChild(successDiv);
        this.scrollToBottom();
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FinGoalChat();
});
