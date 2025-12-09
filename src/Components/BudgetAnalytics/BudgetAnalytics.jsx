import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  PieChart, 
  Wallet, 
  TrendingUp, 
  AlertCircle,
  Save
} from 'lucide-react';
import './BudgetAnalytics.css'

const BudgetAnalytics = () => {
  // Basic budget state
  const [monthlyBudget, setMonthlyBudget] = useState({
    totalIncome: 0,
    allocatedBudget: {},
    savingsTarget: 0,
    monthlyExpenses: []
  });

  // New features - tracking historical data and alerts
  const [historicalData, setHistoricalData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Add a new expense
  const addExpense = (expense) => {
    setMonthlyBudget(prev => ({
      ...prev,
      monthlyExpenses: [...prev.monthlyExpenses, {
        ...expense,
        date: new Date().toISOString(),
        id: Date.now()
      }]
    }));
  };

  // Calculate totals and analytics
  const calculateAnalytics = () => {
    const categoryTotals = monthlyBudget.monthlyExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    const remainingBudget = monthlyBudget.totalIncome - totalExpenses;
    const savingsProgress = (monthlyBudget.savingsTarget > 0) 
      ? (remainingBudget / monthlyBudget.savingsTarget) * 100 
      : 0;

    return {
      categoryTotals,
      totalExpenses,
      remainingBudget,
      savingsProgress
    };
  };

  // Check for budget alerts
  useEffect(() => {
    const analytics = calculateAnalytics();
    const newAlerts = [];

    // Check overall budget status
    if (analytics.remainingBudget < 0) {
      newAlerts.push({
        id: Date.now(),
        type: 'error',
        message: 'You have exceeded your total budget!'
      });
    }

    // Check individual category budgets
    Object.entries(analytics.categoryTotals).forEach(([category, spent]) => {
      const allocated = monthlyBudget.allocatedBudget[category] || 0;
      if (spent > allocated) {
        newAlerts.push({
          id: Date.now() + category.length,
          type: 'warning',
          message: `${category} spending exceeds allocated budget by $${(spent - allocated).toFixed(2)}`
        });
      }
      if (spent > allocated * 0.9 && spent <= allocated) {
        newAlerts.push({
          id: Date.now() + category.length,
          type: 'info',
          message: `${category} spending is nearing budget limit`
        });
      }
    });

    setAlerts(newAlerts);
  }, [monthlyBudget]);

  // Save budget history monthly
  useEffect(() => {
    const analytics = calculateAnalytics();
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    if (!historicalData.some(data => data.month === currentMonth)) {
      setHistoricalData(prev => [...prev, {
        month: currentMonth,
        ...analytics
      }]);
    }
  }, [monthlyBudget]);

  const handleNewExpense = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    addExpense({
      category: formData.get('category'),
      amount: parseFloat(formData.get('amount')),
      description: formData.get('description')
    });
    e.target.reset();
  };

  const analytics = calculateAnalytics();

  return (
    <div className="budget-analytics">
      <h2><PieChart className="icon" /> Budget Analytics</h2>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="alerts-container">
          {alerts.map(alert => (
            <div key={alert.id} className={`alert ${alert.type}`}>
              <AlertCircle className="icon" />
              {alert.message}
            </div>
          ))}
        </div>
      )}

      <div className="budget-overview">
        {/* Monthly Overview Card */}
        <div className="summary-card">
          <h3><Wallet className="icon" /> Monthly Overview</h3>
          <div className="summary-item">
            <span>Total Income</span>
            <div className="input-group">
              <DollarSign className="icon" />
              <input 
                type="number"
                value={monthlyBudget.totalIncome}
                onChange={(e) => setMonthlyBudget(prev => ({
                  ...prev,
                  totalIncome: parseFloat(e.target.value) || 0
                }))}
                placeholder="Enter monthly income"
              />
            </div>
          </div>
          <div className="summary-item">
            <span>Total Expenses</span>
            <strong>${analytics.totalExpenses.toFixed(2)}</strong>
          </div>
          <div className="summary-item">
            <span>Savings Target</span>
            <div className="input-group">
              <DollarSign className="icon" />
              <input 
                type="number"
                value={monthlyBudget.savingsTarget}
                onChange={(e) => setMonthlyBudget(prev => ({
                  ...prev,
                  savingsTarget: parseFloat(e.target.value) || 0
                }))}
                placeholder="Set savings goal"
              />
            </div>
          </div>
          <div className="summary-item total">
            <span>Remaining Budget</span>
            <strong className={analytics.remainingBudget < 0 ? 'negative' : ''}>
              ${analytics.remainingBudget.toFixed(2)}
            </strong>
          </div>
        </div>

        {/* New Expense Form */}
        <div className="expense-form-container">
          <h3><TrendingUp className="icon" /> Add New Expense</h3>
          <form onSubmit={handleNewExpense} className="expense-form">
            <div className="form-group">
              <input 
                type="text" 
                name="category" 
                placeholder="Category"
                required 
              />
            </div>
            <div className="form-group">
              <input 
                type="number" 
                name="amount" 
                placeholder="Amount"
                step="0.01"
                required 
              />
            </div>
            <div className="form-group">
              <input 
                type="text" 
                name="description" 
                placeholder="Description"
                required 
              />
            </div>
            <button type="submit">Add Expense</button>
          </form>
        </div>

        {/* Category Budgets */}
        <div className="category-budgets">
          <h3><Save className="icon" /> Category Budgets</h3>
          {Object.entries(analytics.categoryTotals).map(([category, spent]) => {
            const allocated = monthlyBudget.allocatedBudget[category] || 0;
            const percentage = allocated ? (spent / allocated) * 100 : 0;
            
            return (
              <div key={category} className="category-budget-item">
                <div className="category-header">
                  <span>{category}</span>
                  <div className="input-group">
                    <DollarSign className="icon" />
                    <input 
                      type="number"
                      value={allocated}
                      onChange={(e) => setMonthlyBudget(prev => ({
                        ...prev,
                        allocatedBudget: {
                          ...prev.allocatedBudget,
                          [category]: parseFloat(e.target.value) || 0
                        }
                      }))}
                      placeholder="Set budget"
                    />
                  </div>
                </div>
                <div className="budget-progress-container">
                  <div 
                    className="budget-progress-bar"
                    style={{ 
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: percentage > 100 ? 'var(--color-danger)' : 'var(--color-success)'
                    }}
                  ></div>
                </div>
                <div className="category-details">
                  <span>Spent: ${spent.toFixed(2)}</span>
                  <span>Remaining: ${(allocated - spent).toFixed(2)}</span>
                  <span>Progress: {percentage.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BudgetAnalytics;