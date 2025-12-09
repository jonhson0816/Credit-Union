import React, { createContext, useState, useContext, useCallback } from 'react';

// Create the Banking Context (keeping original name and structure)
const BankingContext = createContext();

// Banking Context Provider Component
export const BankingProvider = ({ children }) => {
  // Keep existing user account state
  const [userAccount, setUserAccount] = useState({
    id: 'user_' + Math.random().toString(36).substr(2, 9),
    accountNumber: '9876543210',
    accountType: 'Checking',
    balance: 15750.45,
    currency: 'USD',
    firstName: 'Alex',
    lastName: 'Morgan',
    email: 'alex.morgan@example.com',
    phoneNumber: '+1-555-123-4567',
    memberSince: new Date('2022-01-15'),
    // NEW NAVY FEDERAL SPECIFIC FIELDS
    militaryInfo: {
      branch: null,
      status: null,
      serviceNumber: null,
      rank: null
    },
    additionalAccounts: [
      {
        type: 'Savings',
        accountNumber: '1234567890',
        balance: 5000.00,
        interestRate: 0.05
      }
    ]
  });

  // Keep existing transactions state
  const [transactions, setTransactions] = useState([
    {
      id: 'trans_' + Math.random().toString(36).substr(2, 9),
      date: new Date('2024-03-15'),
      description: 'Online Shopping',
      amount: -125.67,
      type: 'Debit',
      category: 'Shopping',
      status: 'Completed',
      merchant: 'Amazon',
      location: { city: 'Online', country: 'Internet' }
    },
    {
      id: 'trans_' + Math.random().toString(36).substr(2, 9),
      date: new Date('2024-03-14'),
      description: 'Salary Direct Deposit',
      amount: 4500.00,
      type: 'Credit',
      category: 'Income',
      status: 'Completed'
    }
  ]);

  // Keep existing account settings
  const [accountSettings, setAccountSettings] = useState({
    notifications: {
      email: true,
      sms: false,
      pushNotifications: true
    },
    securitySettings: {
      twoFactorAuthentication: true,
      biometricLogin: true,
      loginAlerts: true
    },
    displayPreferences: {
      darkMode: true,
      language: 'en',
      currency: 'USD'
    },
    paperlessStatements: true
  });

  // NEW: Authentication State
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    loginAttempts: 0,
    lastLoginAttempt: null
  });

  // NEW: Navy Federal Specific Loan Products
  const [loanProducts, setLoanProducts] = useState([
    {
      type: 'Personal Loan',
      interestRate: 7.5,
      maxAmount: 50000,
      terms: [12, 24, 36, 48, 60]
    },
    {
      type: 'Military Auto Loan',
      interestRate: 4.9,
      maxAmount: 75000,
      terms: [36, 48, 60, 72],
      militarySpecific: true
    },
    {
      type: 'VA Mortgage',
      interestRate: 6.25,
      maxAmount: 500000,
      terms: [15, 30],
      militarySpecific: true
    }
  ]);

  // Existing Utility Methods
  const updateUserAccount = useCallback((updates) => {
    setUserAccount(prev => ({ 
      ...prev, 
      ...updates 
    }));
  }, []);

  // NEW: Login Method
  const login = useCallback((credentials) => {
    // Simulate login (in real app, this would be an API call)
    setAuthState({
      isAuthenticated: true,
      loginAttempts: 0,
      lastLoginAttempt: new Date()
    });
  }, []);

  // NEW: Logout Method
  const logout = useCallback(() => {
    setAuthState({
      isAuthenticated: false,
      loginAttempts: 0,
      lastLoginAttempt: null
    });
  }, []);

  // NEW: Fund Transfer Method
  const transferFunds = useCallback((fromAccount, toAccount, amount) => {
    // Implement fund transfer logic
    const newTransaction = {
      id: 'trans_' + Math.random().toString(36).substr(2, 9),
      date: new Date(),
      description: `Transfer to ${toAccount}`,
      amount: -amount,
      type: 'Debit',
      category: 'Transfer',
      status: 'Completed'
    };

    setTransactions(prev => [newTransaction, ...prev]);
    
    // Update account balance (simplified)
    setUserAccount(prev => ({
      ...prev,
      balance: prev.balance - amount
    }));
  }, []);

  // NEW: Calculate Net Worth
  const calculateNetWorth = useCallback(() => {
    const accountBalances = [
      userAccount.balance, 
      ...(userAccount.additionalAccounts || []).map(acc => acc.balance)
    ];
    return accountBalances.reduce((total, balance) => total + balance, 0);
  }, [userAccount]);

  // Updated Context Value with New Methods
  const contextValue = {
    userAccount,
    updateUserAccount,
    transactions,
    addTransaction: (transactionData) => {
      const newTransaction = {
        ...transactionData,
        id: 'trans_' + Math.random().toString(36).substr(2, 9),
        date: new Date()
      };
      setTransactions(prev => [newTransaction, ...prev]);
    },
    filterTransactions: (filters) => {
      return transactions.filter(transaction => 
        Object.entries(filters).every(([key, value]) => 
          transaction[key] === value
        )
      );
    },
    accountSettings,
    updateAccountSettings: (settings) => {
      setAccountSettings(prev => ({
        ...prev,
        ...settings
      }));
    },
    investmentPortfolio: {
      stocks: [
        { symbol: 'AAPL', quantity: 10, purchasePrice: 150, currentPrice: 175 },
        { symbol: 'GOOGL', quantity: 5, purchasePrice: 1200, currentPrice: 1250 }
      ],
      cryptoAssets: [
        { symbol: 'BTC', quantity: 0.5, purchasePrice: 30000, currentPrice: 35000 }
      ],
      totalInvestmentValue: 45000
    },
    budgetTracking: {
      monthlyBudget: 5000,
      budgetCategories: [
        { name: 'Groceries', allocatedAmount: 500, currentSpending: 325 },
        { name: 'Dining Out', allocatedAmount: 300, currentSpending: 225 },
        { name: 'Entertainment', allocatedAmount: 200, currentSpending: 150 }
      ]
    },
    // NEW METHODS
    authState,
    login,
    logout,
    transferFunds,
    calculateNetWorth,
    loanProducts
  };

  return (
    <BankingContext.Provider value={contextValue}>
      {children}
    </BankingContext.Provider>
  );
};

// Keep existing custom hook
export const useBanking = () => {
  const context = useContext(BankingContext);
  if (!context) {
    throw new Error('useBanking must be used within a BankingProvider');
  }
  return context;
};

export default BankingContext;