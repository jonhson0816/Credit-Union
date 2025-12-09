import React, { useState } from 'react';
import { useBudgeting } from '../../Context/BudgetingContext';
import './ExpenseTracker.css';

const ExpenseTracker = () => {
  const { 
    expenses, 
    categories, 
    addExpense, 
    removeExpense, 
    budgetAnalytics 
  } = useBudgeting();

  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExpense(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newExpense.description && newExpense.amount && newExpense.category) {
      addExpense(newExpense);
      setNewExpense({ description: '', amount: '', category: '' });
    }
  };

  return (
    <div className="expense-tracker">
      <h2>Expense Tracker</h2>
      
      <div className="expense-summary">
        <div className="summary-card">
          <h3>Expense Breakdown</h3>
          {Object.entries(budgetAnalytics.categoryTotals || {}).map(([category, total]) => (
            <div key={category} className="category-breakdown">
              <span>{category}</span>
              <span>${total.toFixed(2)} ({budgetAnalytics.expensePercentages[category]}%)</span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="expense-form">
        <input 
          type="text"
          name="description"
          placeholder="Expense Description"
          value={newExpense.description}
          onChange={handleInputChange}
          required
        />
        <input 
          type="number"
          name="amount"
          placeholder="Amount"
          value={newExpense.amount}
          onChange={handleInputChange}
          step="0.01"
          min="0"
          required
        />
        <select 
          name="category"
          value={newExpense.category}
          onChange={handleInputChange}
          required
        >
          <option value="">Select Category</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <button type="submit">Add Expense</button>
      </form>

      <div className="expenses-list">
        <h3>Recent Expenses</h3>
        {expenses.slice().reverse().map((expense) => (
          <div key={expense.id} className="expense-item">
            <div className="expense-details">
              <span className="expense-description">{expense.description}</span>
              <span className="expense-category">{expense.category}</span>
              <span className="expense-amount">${expense.amount.toFixed(2)}</span>
            </div>
            <button 
              onClick={() => removeExpense(expense.id)}
              className="remove-expense"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpenseTracker;