class FinGoalDashboard {
    constructor() {
        this.goals = JSON.parse(localStorage.getItem('financial_goals')) || [];
        this.budget = JSON.parse(localStorage.getItem('monthly_budget')) || {
            income: 0,
            expenses: 0
        };
        this.activities = JSON.parse(localStorage.getItem('recent_activities')) || [];
        this.apiKey = localStorage.getItem('openai_api_key') || null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboardData();
        this.renderEnhancedGoals();
        this.renderBudget();
        this.renderActivities();
        this.updateStats();
        this.updateApiKeyStatus();
        this.setDefaultDate();
    }

    setupEventListeners() {
        // Add Goal Modal
        document.getElementById('addGoalBtn').addEventListener('click', () => this.showAddGoalModal());
        document.getElementById('closeGoalModal').addEventListener('click', () => this.hideAddGoalModal());
        document.getElementById('cancelGoal').addEventListener('click', () => this.hideAddGoalModal());
        document.getElementById('goalForm').addEventListener('submit', (e) => this.handleAddGoal(e));

        // Edit Budget Modal
        document.getElementById('editBudgetBtn').addEventListener('click', () => this.showEditBudgetModal());
        document.getElementById('closeBudgetModal').addEventListener('click', () => this.hideEditBudgetModal());
        document.getElementById('cancelBudget').addEventListener('click', () => this.hideEditBudgetModal());
        document.getElementById('budgetForm').addEventListener('submit', (e) => this.handleEditBudget(e));

        // API Key Modal
        document.getElementById('setupApiKeyBtn').addEventListener('click', () => this.showApiKeyModal());
        document.getElementById('closeApiKeyModal').addEventListener('click', () => this.hideApiKeyModal());
        document.getElementById('cancelApiKey').addEventListener('click', () => this.hideApiKeyModal());
        document.getElementById('saveApiKey').addEventListener('click', () => this.handleSaveApiKey());
        document.getElementById('removeApiKey').addEventListener('click', () => this.handleRemoveApiKey());

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideAddGoalModal();
                this.hideEditBudgetModal();
                this.hideApiKeyModal();
            }
        });
    }

    setDefaultDate() {
        const dateInput = document.getElementById('goalDeadline');
        const today = new Date();
        const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
        dateInput.min = today.toISOString().split('T')[0];
        dateInput.value = nextYear.toISOString().split('T')[0];
    }

    loadDashboardData() {
        // Load sample data if no data exists
        if (this.goals.length === 0) {
            this.goals = [
                {
                    id: 1,
                    name: 'Emergency Fund',
                    targetAmount: 5000,
                    currentAmount: 3250,
                    deadline: '2025-12-31',
                    category: 'emergency',
                    createdAt: new Date().toISOString(),
                    steps: [
                        'Calculate 3-6 months of expenses',
                        'Open high-yield savings account',
                        'Set up automatic transfers',
                        'Save $500 per month consistently',
                        'Avoid touching fund except for emergencies'
                    ]
                },
                {
                    id: 2,
                    name: 'Student Loan Payoff',
                    targetAmount: 15000,
                    currentAmount: 6000,
                    deadline: '2027-06-30',
                    category: 'debt',
                    createdAt: new Date().toISOString(),
                    steps: [
                        'List all loans with interest rates',
                        'Choose debt avalanche strategy',
                        'Make minimum payments on all loans',
                        'Pay extra $300/month on highest rate loan',
                        'Consider refinancing options'
                    ]
                },
                {
                    id: 3,
                    name: 'House Down Payment',
                    targetAmount: 50000,
                    currentAmount: 12500,
                    deadline: '2029-01-01',
                    category: 'house',
                    createdAt: new Date().toISOString(),
                    steps: [
                        'Research home prices in target area',
                        'Save 20% for down payment',
                        'Improve credit score to 740+',
                        'Get pre-approved for mortgage',
                        'Save additional 2-3% for closing costs'
                    ]
                }
            ];
            this.saveGoals();
        }

        if (this.budget.income === 0) {
            this.budget = {
                income: 3500,
                expenses: 2800
            };
            this.saveBudget();
        }

        if (this.activities.length === 0) {
            this.activities = [
                {
                    id: 1,
                    type: 'goal_update',
                    title: 'Emergency Fund Updated',
                    description: 'Added $250 to Emergency Fund',
                    amount: 250,
                    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 2,
                    type: 'goal_created',
                    title: 'New Goal Created',
                    description: 'Created House Down Payment goal',
                    amount: 50000,
                    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 3,
                    type: 'budget_update',
                    title: 'Budget Updated',
                    description: 'Monthly budget has been updated',
                    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                }
            ];
            this.saveActivities();
        }
    }

    async generateAISteps(goalData) {
        if (!this.apiKey) {
            return this.getGoalSteps(goalData.category);
        }

        try {
            const userContext = this.getUserFinancialContext();
            const prompt = this.createStepGenerationPrompt(goalData, userContext);

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a financial advisor specializing in helping Gen Z individuals achieve their financial goals. Provide practical, actionable steps that are specific to their situation.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;
            
            // Parse the AI response into steps
            const steps = this.parseAISteps(aiResponse);
            return steps.length > 0 ? steps : this.getGoalSteps(goalData.category);

        } catch (error) {
            console.error('Error generating AI steps:', error);
            return this.getGoalSteps(goalData.category);
        }
    }

    getUserFinancialContext() {
        const savings = this.budget.income - this.budget.expenses;
        const savingsRate = this.budget.income > 0 ? (savings / this.budget.income) * 100 : 0;
        const totalSaved = this.goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
        
        return {
            monthlyIncome: this.budget.income,
            monthlyExpenses: this.budget.expenses,
            monthlySavings: savings,
            savingsRate: savingsRate,
            totalSaved: totalSaved,
            existingGoals: this.goals.length,
            activeGoals: this.goals.filter(g => g.currentAmount < g.targetAmount).length
        };
    }

    createStepGenerationPrompt(goalData, userContext) {
        const deadline = new Date(goalData.deadline);
        const today = new Date();
        const monthsToGoal = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24 * 30));
        const monthlyNeeded = monthsToGoal > 0 ? (goalData.targetAmount - goalData.currentAmount) / monthsToGoal : 0;

        return `
Create a personalized step-by-step action plan for a Gen Z individual to achieve their financial goal.

GOAL DETAILS:
- Goal Name: ${goalData.name}
- Target Amount: $${goalData.targetAmount.toLocaleString()}
- Current Amount: $${goalData.currentAmount.toLocaleString()}
- Deadline: ${goalData.deadline}
- Category: ${goalData.category}
- Months to Goal: ${monthsToGoal}
- Monthly Amount Needed: $${monthlyNeeded.toFixed(2)}

USER'S FINANCIAL SITUATION:
- Monthly Income: $${userContext.monthlyIncome.toLocaleString()}
- Monthly Expenses: $${userContext.monthlyExpenses.toLocaleString()}
- Monthly Savings: $${userContext.monthlySavings.toLocaleString()}
- Savings Rate: ${userContext.savingsRate.toFixed(1)}%
- Total Saved Across All Goals: $${userContext.totalSaved.toLocaleString()}
- Number of Active Goals: ${userContext.activeGoals}

Please provide 5-7 specific, actionable steps that are:
1. Tailored to their current financial situation
2. Realistic given their income and expenses
3. Time-bound and measurable
4. Appropriate for Gen Z (ages 18-27)
5. Consider their existing savings capacity

Format your response as a numbered list with each step on a new line. Focus on practical actions they can take immediately and over time to reach this goal.
        `;
    }

    parseAISteps(aiResponse) {
        // Extract numbered steps from AI response
        const lines = aiResponse.split('\n').filter(line => line.trim());
        const steps = [];
        
        for (const line of lines) {
            // Match patterns like "1. Step text" or "1) Step text" or "Step 1: text"
            const match = line.match(/^\d+[\.\)]\s*(.+)$/) || line.match(/^Step\s+\d+:\s*(.+)$/i);
            if (match) {
                steps.push(match[1].trim());
            } else if (line.trim() && !line.match(/^\d+$/) && steps.length > 0) {
                // If it's a continuation of the previous step
                steps[steps.length - 1] += ' ' + line.trim();
            }
        }
        
        return steps.slice(0, 7); // Limit to 7 steps max
    }

    getGoalSteps(category) {
        const stepTemplates = {
            emergency: [
                'Calculate 3-6 months of expenses',
                'Open high-yield savings account',
                'Set up automatic transfers',
                'Save consistently each month',
                'Avoid touching fund except for emergencies'
            ],
            debt: [
                'List all debts with interest rates',
                'Choose debt payoff strategy',
                'Make minimum payments on all debts',
                'Pay extra on target debt',
                'Consider consolidation options'
            ],
            house: [
                'Research home prices in target area',
                'Save for down payment (10-20%)',
                'Improve credit score',
                'Get pre-approved for mortgage',
                'Save for closing costs'
            ],
            car: [
                'Research car prices and models',
                'Save for down payment',
                'Check credit score',
                'Get pre-approved for auto loan',
                'Budget for insurance and maintenance'
            ],
            vacation: [
                'Research destination and costs',
                'Create detailed trip budget',
                'Book flights and accommodation early',
                'Save monthly for trip expenses',
                'Consider travel insurance'
            ],
            investment: [
                'Define investment goals',
                'Research investment options',
                'Open investment account',
                'Start with diversified portfolio',
                'Review and rebalance regularly'
            ],
            education: [
                'Research program costs',
                'Apply for financial aid',
                'Consider education tax benefits',
                'Save for tuition and expenses',
                'Explore scholarship opportunities'
            ],
            other: [
                'Define specific goal requirements',
                'Create detailed action plan',
                'Set monthly savings target',
                'Track progress regularly',
                'Adjust plan as needed'
            ]
        };
        return stepTemplates[category] || stepTemplates.other;
    }

    showAddGoalModal() {
        document.getElementById('addGoalModal').style.display = 'flex';
    }

    hideAddGoalModal() {
        document.getElementById('addGoalModal').style.display = 'none';
        document.getElementById('goalForm').reset();
        this.setDefaultDate();
    }

    showEditBudgetModal() {
        document.getElementById('budgetIncome').value = this.budget.income;
        document.getElementById('budgetExpenses').value = this.budget.expenses;
        document.getElementById('editBudgetModal').style.display = 'flex';
    }

    hideEditBudgetModal() {
        document.getElementById('editBudgetModal').style.display = 'none';
        document.getElementById('budgetForm').reset();
    }

    async handleAddGoal(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const category = formData.get('goalCategory') || document.getElementById('goalCategory').value;
        const goalData = {
            id: Date.now(),
            name: formData.get('goalName') || document.getElementById('goalName').value,
            targetAmount: parseFloat(formData.get('goalAmount') || document.getElementById('goalAmount').value),
            currentAmount: parseFloat(formData.get('currentAmount') || document.getElementById('currentAmount').value) || 0,
            deadline: formData.get('goalDeadline') || document.getElementById('goalDeadline').value,
            category: category,
            createdAt: new Date().toISOString(),
            steps: [] // Will be populated by AI
        };

        // Show loading message
        this.showLoadingMessage('Generating personalized steps with AI...');
        
        try {
            // Generate AI-powered steps
            goalData.steps = await this.generateAISteps(goalData);
            
            this.goals.push(goalData);
            this.saveGoals();
            this.addActivity('goal_created', 'New Goal Created', `Created ${goalData.name} goal with AI-generated steps`, goalData.targetAmount);
            this.renderEnhancedGoals();
            this.updateStats();
            this.hideAddGoalModal();
            this.hideLoadingMessage();
            this.showSuccessMessage('Goal created with personalized AI steps!');
        } catch (error) {
            console.error('Error creating goal:', error);
            this.hideLoadingMessage();
            this.showErrorMessage('Failed to generate AI steps. Please try again.');
        }
    }

    async handleEditBudget(e) {
        e.preventDefault();
        
        const income = parseFloat(document.getElementById('budgetIncome').value);
        const expenses = parseFloat(document.getElementById('budgetExpenses').value);
        
        this.budget = { income, expenses };
        this.saveBudget();
        this.addActivity('budget_update', 'Budget Updated', 'Monthly budget has been updated');
        
        // Regenerate AI steps for existing goals if API key is available
        if (this.apiKey && this.goals.length > 0) {
            this.showLoadingMessage('Updating goal steps based on new budget...');
            
            try {
                for (let goal of this.goals) {
                    goal.steps = await this.generateAISteps(goal);
                }
                this.saveGoals();
                this.hideLoadingMessage();
                this.showSuccessMessage('Budget and goal steps updated successfully!');
            } catch (error) {
                console.error('Error updating goal steps:', error);
                this.hideLoadingMessage();
                this.showSuccessMessage('Budget updated successfully!');
            }
        } else {
            this.showSuccessMessage('Budget updated successfully!');
        }
        
        this.renderBudget();
        this.renderEnhancedGoals();
        this.updateStats();
        this.hideEditBudgetModal();
    }

    deleteGoal(goalId) {
        if (confirm('Are you sure you want to delete this goal?')) {
            const goal = this.goals.find(g => g.id === goalId);
            this.goals = this.goals.filter(g => g.id !== goalId);
            this.saveGoals();
            this.addActivity('goal_deleted', 'Goal Deleted', `Deleted ${goal.name} goal`);
            this.renderEnhancedGoals();
            this.updateStats();
            this.showSuccessMessage('Goal deleted successfully!');
        }
    }

    updateGoalAmount(goalId, newAmount) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            const oldAmount = goal.currentAmount;
            goal.currentAmount = parseFloat(newAmount);
            this.saveGoals();
            
            const difference = goal.currentAmount - oldAmount;
            const action = difference > 0 ? 'Added' : 'Removed';
            const amount = Math.abs(difference);
            
            this.addActivity('goal_update', 'Goal Updated', `${action} $${amount.toFixed(2)} ${difference > 0 ? 'to' : 'from'} ${goal.name}`, amount);
            this.renderEnhancedGoals();
            this.updateStats();
        }
    }

    renderEnhancedGoals() {
        const goalsList = document.getElementById('goalsList');
        
        if (this.goals.length === 0) {
            goalsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bullseye"></i>
                    <h4>No Goals Yet</h4>
                    <p>Create your first financial goal to get started!</p>
                    <button class="btn btn-primary" onclick="document.getElementById('addGoalBtn').click()">
                        <i class="fas fa-plus"></i> Add Your First Goal
                    </button>
                </div>
            `;
            return;
        }

        goalsList.innerHTML = this.goals.map(goal => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const daysLeft = this.getDaysUntilDeadline(goal.deadline);
            const monthsLeft = Math.ceil(daysLeft / 30);
            const monthlyTarget = monthsLeft > 0 ? (goal.targetAmount - goal.currentAmount) / monthsLeft : 0;
            
            return `
                <div class="enhanced-goal-card">
                    <div class="goal-main-info">
                        <div class="goal-details">
                            <h4>${goal.name}</h4>
                            <span class="goal-category-badge">${goal.category}</span>
                        </div>
                        <div class="goal-quick-actions">
                            <button class="btn-icon btn-edit" onclick="dashboard.showUpdateGoalModal(${goal.id})" title="Add Money">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button class="btn-icon btn-delete" onclick="dashboard.deleteGoal(${goal.id})" title="Delete Goal">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="goal-progress-info">
                        <div class="goal-amounts-row">
                            <span class="current-amount">$${goal.currentAmount.toLocaleString()}</span>
                            <span class="target-amount">/ $${goal.targetAmount.toLocaleString()}</span>
                        </div>
                        <div class="goal-progress-bar">
                            <div class="goal-progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                        </div>
                        <div class="progress-stats">
                            <span>${progress.toFixed(1)}% complete</span>
                            <span>${daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Due today' : `${Math.abs(daysLeft)} days overdue`}</span>
                        </div>
                    </div>
                    
                    <div class="goal-steps">
                        <h5><i class="fas fa-list-check"></i> Steps to Achieve</h5>
                        <ul class="steps-list">
                            ${goal.steps ? goal.steps.map((step, index) => `
                                <li class="step-item">
                                    <span class="step-number">${index + 1}</span>
                                    <span class="step-text">${step}</span>
                                </li>
                            `).join('') : ''}
                        </ul>
                    </div>
                    
                    <div class="goal-actions-row">
                        <div class="goal-insights">
                            ${monthlyTarget > 0 ? `<small><i class="fas fa-info-circle"></i> Save $${monthlyTarget.toFixed(0)}/month to reach goal</small>` : ''}
                        </div>
                    </div>
                    
                    <div class="update-goal-input" style="display: none;" id="updateInput${goal.id}">
                        <input type="number" placeholder="Add amount" min="0" step="0.01" id="updateAmount${goal.id}">
                        <button onclick="dashboard.confirmUpdateGoal(${goal.id})">Add</button>
                        <button onclick="dashboard.hideUpdateGoalInput(${goal.id})">Cancel</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    showUpdateGoalModal(goalId) {
        const updateInput = document.getElementById(`updateInput${goalId}`);
        updateInput.style.display = 'flex';
        document.getElementById(`updateAmount${goalId}`).focus();
    }

    hideUpdateGoalInput(goalId) {
        const updateInput = document.getElementById(`updateInput${goalId}`);
        updateInput.style.display = 'none';
        document.getElementById(`updateAmount${goalId}`).value = '';
    }

    confirmUpdateGoal(goalId) {
        const amountInput = document.getElementById(`updateAmount${goalId}`);
        const amount = parseFloat(amountInput.value);
        
        if (amount && amount > 0) {
            const goal = this.goals.find(g => g.id === goalId);
            const newTotal = goal.currentAmount + amount;
            this.updateGoalAmount(goalId, newTotal);
            this.hideUpdateGoalInput(goalId);
        }
    }

    renderBudget() {
        const savings = this.budget.income - this.budget.expenses;
        const savingsPercentage = this.budget.income > 0 ? (savings / this.budget.income) * 100 : 0;
        
        document.getElementById('monthlyIncome').textContent = `$${this.budget.income.toLocaleString()}`;
        document.getElementById('monthlyExpenses').textContent = `$${this.budget.expenses.toLocaleString()}`;
        document.getElementById('monthlySavings').textContent = `$${savings.toLocaleString()}`;
        
        const budgetFill = document.getElementById('budgetFill');
        const budgetPercentage = document.getElementById('budgetPercentage');
        
        budgetFill.style.width = `${Math.max(0, Math.min(100, savingsPercentage))}%`;
        budgetPercentage.textContent = `${savingsPercentage.toFixed(1)}%`;
        
        // Change color based on savings rate
        if (savingsPercentage >= 20) {
            budgetFill.style.background = 'linear-gradient(90deg, #48bb78, #38a169)';
            budgetPercentage.style.color = '#48bb78';
        } else if (savingsPercentage >= 10) {
            budgetFill.style.background = 'linear-gradient(90deg, #ed8936, #dd6b20)';
            budgetPercentage.style.color = '#ed8936';
        } else {
            budgetFill.style.background = 'linear-gradient(90deg, #e53e3e, #c53030)';
            budgetPercentage.style.color = '#e53e3e';
        }
    }

    renderActivities() {
        const activityList = document.getElementById('recentActivity');
        
        if (this.activities.length === 0) {
            activityList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <h4>No Recent Activity</h4>
                    <p>Your financial activities will appear here.</p>
                </div>
            `;
            return;
        }

        const sortedActivities = this.activities
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);

        activityList.innerHTML = sortedActivities.map(activity => {
            const icon = this.getActivityIcon(activity.type);
            const timeAgo = this.getTimeAgo(activity.timestamp);
            
            return `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-description">${activity.description}</div>
                        <div class="activity-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateStats() {
        const totalSavings = this.goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
        const activeGoals = this.goals.filter(goal => goal.currentAmount < goal.targetAmount).length;
        const completedGoals = this.goals.filter(goal => goal.currentAmount >= goal.targetAmount).length;
        
        // Calculate monthly progress (simplified)
        const monthlyProgress = this.budget.income > 0 ? 
            ((this.budget.income - this.budget.expenses) / this.budget.income) * 100 : 0;
        
        document.getElementById('totalSavings').textContent = `$${totalSavings.toLocaleString()}`;
        document.getElementById('activeGoals').textContent = activeGoals;
        document.getElementById('completedGoals').textContent = completedGoals;
        document.getElementById('monthlyProgress').textContent = `${monthlyProgress.toFixed(1)}%`;
    }

    getDaysUntilDeadline(deadline) {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getActivityIcon(type) {
        const icons = {
            'goal_created': 'fa-plus',
            'goal_updated': 'fa-edit',
            'goal_update': 'fa-arrow-up',
            'goal_deleted': 'fa-trash',
            'budget_update': 'fa-calculator'
        };
        return icons[type] || 'fa-info';
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        return time.toLocaleDateString();
    }

    addActivity(type, title, description, amount = null) {
        const activity = {
            id: Date.now(),
            type,
            title,
            description,
            amount,
            timestamp: new Date().toISOString()
        };
        
        this.activities.unshift(activity);
        this.activities = this.activities.slice(0, 20); // Keep only last 20 activities
        this.saveActivities();
    }

    saveGoals() {
        localStorage.setItem('financial_goals', JSON.stringify(this.goals));
    }

    saveBudget() {
        localStorage.setItem('monthly_budget', JSON.stringify(this.budget));
    }

    saveActivities() {
        localStorage.setItem('recent_activities', JSON.stringify(this.activities));
    }

    showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.position = 'fixed';
        successDiv.style.top = '100px';
        successDiv.style.right = '20px';
        successDiv.style.zIndex = '3000';
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    showLoadingMessage(message) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loadingMessage';
        loadingDiv.className = 'loading-message';
        loadingDiv.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <span>${message}</span>
            </div>
        `;
        loadingDiv.style.position = 'fixed';
        loadingDiv.style.top = '0';
        loadingDiv.style.left = '0';
        loadingDiv.style.width = '100%';
        loadingDiv.style.height = '100%';
        loadingDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        loadingDiv.style.display = 'flex';
        loadingDiv.style.alignItems = 'center';
        loadingDiv.style.justifyContent = 'center';
        loadingDiv.style.zIndex = '4000';
        
        document.body.appendChild(loadingDiv);
    }

    hideLoadingMessage() {
        const loadingDiv = document.getElementById('loadingMessage');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '100px';
        errorDiv.style.right = '20px';
        errorDiv.style.zIndex = '3000';
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    // API Key Management Methods
    showApiKeyModal() {
        const modal = document.getElementById('apiKeyModal');
        const input = document.getElementById('apiKeyInput');
        const removeBtn = document.getElementById('removeApiKey');
        
        if (this.apiKey) {
            input.value = this.apiKey;
            removeBtn.style.display = 'inline-block';
        } else {
            input.value = '';
            removeBtn.style.display = 'none';
        }
        
        modal.style.display = 'flex';
        input.focus();
    }

    hideApiKeyModal() {
        document.getElementById('apiKeyModal').style.display = 'none';
        document.getElementById('apiKeyInput').value = '';
    }

    handleSaveApiKey() {
        const apiKey = document.getElementById('apiKeyInput').value.trim();
        
        if (!apiKey) {
            this.showErrorMessage('Please enter a valid API key');
            return;
        }
        
        if (!apiKey.startsWith('sk-')) {
            this.showErrorMessage('Invalid API key format. OpenAI keys start with "sk-"');
            return;
        }
        
        this.apiKey = apiKey;
        localStorage.setItem('openai_api_key', apiKey);
        this.updateApiKeyStatus();
        this.hideApiKeyModal();
        this.showSuccessMessage('API key saved successfully! AI step generation is now enabled.');
    }

    handleRemoveApiKey() {
        if (confirm('Are you sure you want to remove your API key? This will disable AI step generation.')) {
            this.apiKey = null;
            localStorage.removeItem('openai_api_key');
            this.updateApiKeyStatus();
            this.hideApiKeyModal();
            this.showSuccessMessage('API key removed successfully.');
        }
    }

    updateApiKeyStatus() {
        const statusElement = document.getElementById('apiKeyStatus');
        const setupBtn = document.getElementById('setupApiKeyBtn');
        
        if (this.apiKey) {
            statusElement.innerHTML = `
                <div class="status-indicator" style="color: #48bb78;">
                    <i class="fas fa-check-circle"></i>
                    <span>OpenAI API key configured</span>
                </div>
                <p>AI-powered step generation is enabled. Your goals will have personalized steps based on your financial situation.</p>
            `;
            setupBtn.innerHTML = '<i class="fas fa-edit"></i> Manage API Key';
        } else {
            statusElement.innerHTML = `
                <div class="status-indicator">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>OpenAI API key not configured</span>
                </div>
                <p>Set up your OpenAI API key to get personalized, AI-generated steps for your financial goals.</p>
            `;
            setupBtn.innerHTML = '<i class="fas fa-key"></i> Setup API Key';
        }
    }
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new FinGoalDashboard();
});
