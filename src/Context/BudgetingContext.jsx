import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';

// Budgeting Context
export const BudgetingContext = createContext();

// Context Provider Component
export const BudgetingProvider = ({ children }) => {
  // State for expenses
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([
    'Groceries', 'Dining Out', 'Transportation', 
    'Utilities', 'Entertainment', 'Shopping', 
    'Healthcare', 'Education', 'Miscellaneous'
  ]);

  // State for financial goals
  const [financialGoals, setFinancialGoals] = useState([]);
  
  // State for budget analytics
  const [monthlyBudget, setMonthlyBudget] = useState({
    totalIncome: 0,
    allocatedBudget: {},
    savingsTarget: 0
  });

  // Add Expense
  const addExpense = useCallback((expense) => {
    setExpenses(prevExpenses => [
      ...prevExpenses, 
      { 
        ...expense, 
        id: Date.now(), 
        date: new Date()
      }
    ]);
  }, []);

  // Remove Expense
  const removeExpense = useCallback((id) => {
    setExpenses(prevExpenses => 
      prevExpenses.filter(expense => expense.id !== id)
    );
  }, []);

  // Add Financial Goal
  const addFinancialGoal = useCallback((goal) => {
    setFinancialGoals(prevGoals => [
      ...prevGoals, 
      { 
        ...goal, 
        id: Date.now(), 
        startDate: new Date(),
        progress: 0
      }
    ]);
  }, []);

  // Update Financial Goal Progress
  const updateGoalProgress = useCallback((goalId, progress) => {
    setFinancialGoals(prevGoals => 
      prevGoals.map(goal => 
        goal.id === goalId 
          ? { ...goal, progress: Math.min(progress, 100) } 
          : goal
      )
    );
  }, []);

  // Calculate Total Expenses
  const calculateTotalExpenses = useMemo(() => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  }, [expenses]);

  // Budget Analytics
  const budgetAnalytics = useMemo(() => {
    const categoryTotals = expenses.reduce((totals, expense) => {
      totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
      return totals;
    }, {});

    const remainingBudget = monthlyBudget.totalIncome - calculateTotalExpenses;
    
    return {
      categoryTotals,
      remainingBudget,
      expensePercentages: Object.fromEntries(
        Object.entries(categoryTotals).map(([category, total]) => [
          category, 
          ((total / monthlyBudget.totalIncome) * 100).toFixed(2)
        ])
      )
    };
  }, [expenses, monthlyBudget.totalIncome, calculateTotalExpenses]);

  // Persist Data to Local Storage
  useEffect(() => {
    localStorage.setItem('nfcu-expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('nfcu-financial-goals', JSON.stringify(financialGoals));
  }, [financialGoals]);

  useEffect(() => {
    localStorage.setItem('nfcu-monthly-budget', JSON.stringify(monthlyBudget));
  }, [monthlyBudget]);

  // Context Value
  const contextValue = {
    expenses,
    categories,
    financialGoals,
    monthlyBudget,
    addExpense,
    removeExpense,
    addFinancialGoal,
    updateGoalProgress,
    setMonthlyBudget,
    calculateTotalExpenses,
    budgetAnalytics
  };

  return (
    <BudgetingContext.Provider value={contextValue}>
      {children}
    </BudgetingContext.Provider>
  );
};

// Custom Hook for using Budgeting Context
export const useBudgeting = () => {
  const context = useContext(BudgetingContext);
  if (!context) {
    throw new Error('useBudgeting must be used within a BudgetingProvider');
  }
  return context;
};