import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const NavyFederalContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'https://credit-unionapi.onrender.com/api';

axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

// Initialize axios with stored token if it exists
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Helper function to generate random numbers
const generateRandomNumber = (length) => {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
};

// Helper to validate token
const getStoredToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return null;
    }
    return token;
  } catch (error) {
    localStorage.removeItem('token');
    return null;
  }
};

export const NavyFederalProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [financialGoals, setFinancialGoals] = useState([]);
  const [loans, setLoans] = useState([]);
  const [confirmationDetails, setConfirmationDetails] = useState(null);
  const [isConfirmingTransaction, setIsConfirmingTransaction] = useState(false);


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verify token on mount
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.isValid) {
        setCurrentUser(response.data.user);
        setIsAuthenticated(true);
        setUserRole(response.data.user.role);
      } else {
        handleLogout();
      }
    } catch (error) {
      handleLogout();
    }
  };

  // Check for existing token and role on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = getStoredToken();
      
      if (!token) {
        setIsLoading(false);
        setIsAuthenticated(false);
        return;
      }
    
      // Commented out the undefined initializeAxios call
      // initializeAxios(token); // Initialize axios with token
      
      try {
        const response = await axios.get(`${API_URL}/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.isValid && response.data.user) {
          setCurrentUser(response.data.user);
          setUserRole(response.data.user.role);
          setIsAuthenticated(true);
          
          await loadUserData();
        } else {
          handleLogout();
        }
      } catch (err) {
        console.error('Auth verification error:', err);
        handleLogout();
      } finally {
        setIsLoading(false);
      }
    };
  
    checkAuthStatus();
  }, []);

  // Load user data
  const loadUserData = async () => {
    try {
      const results = await Promise.allSettled([
        fetchAccounts(),
        fetchTransactions(),
        fetchLoans(),
        fetchFinancialGoals()
      ]);
  
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          switch(index) {
            case 0: setAccounts(result.value); break;
            case 1: setTransactions(result.value); break;
            case 2: setLoans(result.value); break;
            case 3: setFinancialGoals(result.value); break;
          }
        } else {
          console.error(`Failed to load data set ${index}:`, result.reason);
        }
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load some user data. Please refresh or try again later.');
    }
  };

  // Data fetching functions
  const fetchAccounts = async () => {
    try {
      // Get the token from storage
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No authentication token found');
        setAccounts([]);
        return [];
      }
      
      console.log('Fetching accounts with token:', token ? 'Token exists' : 'No token');
      
      const response = await axios.get(`${API_URL}/accounts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'  // Prevent caching issues
        },
        timeout: 15000  // Set timeout to prevent hanging requests
      });
      
      console.log('Accounts fetch response status:', response.status);
      
      // Handle various response formats like in your original function
      let accountsData = [];
      if (Array.isArray(response.data)) {
        accountsData = response.data;
      } else if (response.data && Array.isArray(response.data.accounts)) {
        accountsData = response.data.accounts;
      } else if (response.data && typeof response.data === 'object') {
        // If the server returns a single account object
        accountsData = [response.data];
      } else {
        console.warn('Unexpected accounts response format:', response.data);
      }
      
      console.log('Processed accounts data:', accountsData);
      setAccounts(accountsData);
      return accountsData;
      
    } catch (error) {
      console.error('Accounts fetch error:', error.message);
      console.error('Accounts fetch error details:', {
        message: error.message,
        response: error.response ? error.response.data : 'No response data',
        status: error.response ? error.response.status : 'No status code',
        config: error.config
      });
      
      // If unauthorized, clear token and redirect to login
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      
      setAccounts([]);
      return [];
    }
  };

  const fetchTransactions = async () => {
  try {
    const token = getStoredToken();
    if (!token) {
      console.warn('No authentication token found');
      setTransactions([]);
      return [];
    }

    console.log('Fetching transactions...');
    const response = await axios.get(`${API_URL}/transactions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      timeout: 15000
    });

    console.log('Transactions response:', response);
    
    let transactionsData = [];
    if (Array.isArray(response.data)) {
      transactionsData = response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      transactionsData = response.data.data;
    } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
      transactionsData = response.data.data;
    } else {
      console.warn('Unexpected transactions response format:', response.data);
      transactionsData = [];
    }
    
    console.log('Processed transactions data:', transactionsData);
    setTransactions(transactionsData);
    return transactionsData;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error('Transactions request timeout - using cached data');
      return transactions || [];
    } else if (error.response?.status === 401) {
      console.error('Unauthorized - logging out user');
      handleLogout();
      return [];
    } else if (error.response?.status === 429) {
      console.warn('Rate limit exceeded, will retry later');
      return transactions || [];
    }
    
    console.error('Transaction fetch error:', {
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      status: error.response?.status
    });
    
    return transactions || [];
  }
};
  
  const fetchLoans = async (retryCount = 0) => {
    try {
      const token = getStoredToken();
      if (!token) {
        console.warn('No authentication token found');
        setLoans([]);
        return [];
      }
  
      console.log('Attempting to fetch loans...');
      const response = await axios.get(`${API_URL}/loans`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
        timeout: 15000 // Reduced timeout for faster failure
      });
      
      console.log('Loans response received:', response.status);
      setLoans(response.data);
      return response.data;
    } catch (error) {
      // Handle network errors with retry logic
      if ((error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') && retryCount < 3) {
        console.log(`Network error fetching loans. Retrying (${retryCount + 1}/3)...`);
        // Wait increasing time between retries
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchLoans(retryCount + 1);
      }
      
      console.error('Error fetching loans:', {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        status: error.response?.status
      });
      
      // Return cached data if available
      return loans || [];
    }
  };

  const requestLoan = async (loanData) => {
    try {
      const token = getStoredToken();
      if (!token) {
        console.warn('No authentication token found');
        throw new Error('Authentication required');
      }
      
      // Format dates properly
      if (loanData.startDate) {
        loanData.startDate = new Date(loanData.startDate).toISOString();
      }
      if (loanData.endDate) {
        loanData.endDate = new Date(loanData.endDate).toISOString();
      }
      
      // Ensure numeric fields are actually numbers
      if (loanData.totalAmount) loanData.totalAmount = parseFloat(loanData.totalAmount);
      if (loanData.remainingBalance) loanData.remainingBalance = parseFloat(loanData.remainingBalance);
      if (loanData.interestRate) loanData.interestRate = parseFloat(loanData.interestRate);
      if (loanData.monthlyPayment) loanData.monthlyPayment = parseFloat(loanData.monthlyPayment);
      
      console.log('Sending loan request with data:', loanData);
      
      const response = await axios.post(`${API_URL}/loans`, loanData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Refresh loans after request
      await fetchLoans();
      return response.data;
    } catch (error) {
      console.error('Error requesting loan:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
      }
      throw error;
    }
  };
  
  const fetchFinancialGoals = async () => {
    try {
      const token = getStoredToken();
      if (!token) {
        console.warn('No authentication token found');
        setFinancialGoals([]);
        return [];
      }
  
      console.log('Fetching financial goals...');
      const response = await axios.get(`${API_URL}/financial-goals`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        timeout: 30000 // 30 seconds timeout
      });
      
      console.log('Financial goals response:', response);
      
      // Handle different response formats
      let goalsData = [];
      if (Array.isArray(response.data)) {
        goalsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        goalsData = response.data.data;
      } else if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
        goalsData = response.data.data;
      } else {
        console.warn('Unexpected financial goals response format:', response.data);
        goalsData = [];
      }
      
      console.log('Processed financial goals data:', goalsData);
      setFinancialGoals(goalsData);
      return goalsData;
    } catch (error) {
      // Handle specific error types
      if (error.code === 'ECONNABORTED') {
        console.error('Financial goals request timeout - using cached data if available');
        return financialGoals || [];
      } else if (error.response?.status === 401) {
        console.error('Unauthorized - logging out user');
        handleLogout();
        return [];
      }
      
      console.error('Error fetching financial goals:', {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        status: error.response?.status
      });
      
      return financialGoals || [];
    }
  };
  
  // Replace the createFinancialGoal function with this improved version:
  const createFinancialGoal = async (goalData) => {
    try {
      console.log('Creating financial goal with data:', goalData);
      
      const token = getStoredToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post(`${API_URL}/financial-goals`, goalData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Create financial goal response:', response.data);
      
      // Get the created goal from the response
      const newGoal = response.data;
      
      // Update local state
      setFinancialGoals(prev => [...prev, newGoal]);
      return newGoal;
    } catch (error) {
      console.error('Error creating financial goal:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
      throw new Error(error.response?.data?.message || 'Failed to create financial goal');
    }
  };
  
  // Replace the updateFinancialGoal function with this improved version:
  const updateFinancialGoal = async (goalId, updates) => {
    try {
      console.log(`Updating financial goal ${goalId} with:`, updates);
      
      const token = getStoredToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.put(`${API_URL}/financial-goals/${goalId}`, updates, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Update financial goal response:', response.data);
      
      // Get the updated goal from the response
      const updatedGoal = response.data;
      
      // Update local state
      setFinancialGoals(prev => 
        prev.map(goal => goal._id === goalId ? updatedGoal : goal)
      );
      
      return updatedGoal;
    } catch (error) {
      console.error('Error updating financial goal:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
      throw new Error(error.response?.data?.message || 'Failed to update financial goal');
    }
  };

  // Updated Account management
  const createAccount = async (accountType, userId) => {
  try {
    const token = getStoredToken();
    if (!token) throw new Error('No authentication token');

    // Validate account type
    if (!['Checking', 'Savings', 'Credit', 'Investment'].includes(accountType)) {
      throw new Error('Invalid account type');
    }

    console.log('Creating account:', { accountType, userId });

    // Use the new backend endpoint
    const response = await axios.post(`${API_URL}/auth/accounts/create`, 
      { accountType },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    console.log('Account creation response:', response.data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create account');
    }

    // Update local state
    const newAccount = response.data.account;
    setAccounts(prev => [...prev, newAccount]);

    // Update localStorage
    const userProfileStr = localStorage.getItem('userProfile');
    if (userProfileStr) {
      const userProfile = JSON.parse(userProfileStr);
      userProfile.accounts = userProfile.accounts || [];
      userProfile.accounts.push(newAccount);
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
    }

    // Dispatch event so HomePage updates
    window.dispatchEvent(new CustomEvent('accountCreated', {
      detail: { account: newAccount }
    }));

    // Refresh accounts from server
    await fetchAccounts();

    return newAccount;

  } catch (error) {
    console.error('Error creating account:', {
      message: error.response?.data?.message || error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      handleLogout();
      throw new Error('Authentication expired. Please log in again.');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Invalid account request');
    } else {
      throw new Error(error.response?.data?.message || 'Failed to create account');
    }
  }
};

  // Transaction management
  const createTransaction = async (transactionData) => {
    try {
      const response = await axios.post(`${API_URL}/transactions/create`, transactionData);
      setTransactions(prev => [response.data, ...prev]);
      await fetchAccounts();
      return response.data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  };

// Transfer functionality
const transferFunds = async (
  sourceAccount, 
  destinationAccount, 
  amount, 
  description,
  recipientName,
  recipientBank,
  routingNumber,
  sourceAccountType
) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    // Get current user's full name from localStorage or currentUser state
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const accountHolderName = currentUser?.fullName || userProfile?.fullName || 'Account Holder';

    console.log('🔄 Transfer request:', { 
      sourceAccount, 
      destinationAccount, 
      amount, 
      description,
      accountHolderName,
      recipientName,
      recipientBank,
      routingNumber
    });

    // Find source account details from accounts array
    const sourceAccountDetails = accounts.find(acc => acc.accountNumber === sourceAccount);

    // ===== CRITICAL FIX: Send ALL fields to backend =====
    const response = await axios.post(`${API_URL}/accounts/transfer`, {
      // Required fields for backend validation
      sourceAccountNumber: sourceAccount,
      sourceAccountHolderName: accountHolderName,
      destinationAccountNumber: destinationAccount,
      
      // ===== NEWLY ADDED REQUIRED FIELDS =====
      recipientName: recipientName,
      recipientBank: recipientBank,
      routingNumber: routingNumber,
      sourceAccountType: sourceAccountType || sourceAccountDetails?.accountType || 'Checking',
      
      // Legacy fields (keeping for compatibility)
      sourceAccount,
      destinationAccount,
      
      amount: parseFloat(amount),
      description: description || 'Transfer between accounts'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Transfer response:', response.data);

    // CRITICAL FIX: Update localStorage immediately after successful transfer
    if (response.data.success && response.data.updatedUser) {
      const currentProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      const updatedProfile = {
        ...currentProfile,
        accounts: response.data.updatedUser.accounts
      };
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      console.log('✓ Updated localStorage with new balance');
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('transactionCompleted', {
      detail: {
        type: 'transfer',
        amount: parseFloat(amount),
        sourceAccount: sourceAccount,
        destinationAccount: destinationAccount,
        recipientName: recipientName,
        timestamp: new Date().toISOString()
      }
    }));
    console.log('✓ Dispatched transactionCompleted event');

    // Refresh data after successful transfer
    await Promise.all([
      fetchAccounts(),
      fetchTransactions()
    ]);

    // Return data in the same format as deposit/withdraw
    return {
      success: true,
      message: response.data.message || 'Transfer completed successfully',
      newBalance: response.data.newBalance,
      transaction: {
        _id: response.data.transaction?._id,
        reference: response.data.transaction?.reference,
        amount: response.data.transaction?.amount,
        from: response.data.transaction?.from,
        to: response.data.transaction?.to,
        sourceAccountHolderName: accountHolderName,
        destinationAccountHolderName: recipientName
      }
    };
  } catch (error) {
    console.error('❌ Transfer failed:', error);
    console.error('Error response:', error.response?.data);
    throw new Error(error.response?.data?.message || error.message || 'Transfer failed');
  }
};

const deleteAccount = async (accountId) => {
  try {
    const token = getStoredToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('Deleting account:', accountId);

    const response = await axios.delete(`${API_URL}/accounts/${accountId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Delete account response:', response.data);

    // CRITICAL: Update localStorage immediately
    if (response.data.success && response.data.updatedUser) {
      const currentProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      const updatedProfile = {
        ...currentProfile,
        accounts: response.data.updatedUser.accounts
      };
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      console.log('✓ Updated localStorage after deletion');
    }

    // Remove the account from local state
    setAccounts(prev => prev.filter(account => account._id !== accountId));

    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('accountDeleted', {
      detail: { accountId }
    }));

    // Refresh accounts to ensure sync
    await fetchAccounts();

    return response.data;
  } catch (error) {
    console.error('Error deleting account:', error);
    if (error.response?.status === 401) {
      handleLogout();
    }
    throw new Error(error.response?.data?.message || 'Failed to delete account');
  }
};

const deactivateAccount = async (accountId) => {
  try {
    const token = getStoredToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('Deactivating account:', accountId);

    const response = await axios.patch(`${API_URL}/accounts/${accountId}/deactivate`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Deactivate account response:', response.data);

    // CRITICAL: Update localStorage immediately
    if (response.data.success && response.data.updatedUser) {
      const currentProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      const updatedProfile = {
        ...currentProfile,
        accounts: response.data.updatedUser.accounts
      };
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      console.log('✓ Updated localStorage after deactivation');
    }

    // Update the account status in local state
    setAccounts(prev => prev.map(account => 
      account._id === accountId ? { ...account, status: 'inactive' } : account
    ));

    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('accountStatusChanged', {
      detail: { accountId, status: 'inactive' }
    }));

    // Refresh accounts to ensure sync
    await fetchAccounts();

    return response.data;
  } catch (error) {
    console.error('Error deactivating account:', error);
    if (error.response?.status === 401) {
      handleLogout();
    }
    throw new Error(error.response?.data?.message || 'Failed to deactivate account');
  }
};

const reactivateAccount = async (accountId) => {
  try {
    const token = getStoredToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('Reactivating account:', accountId);

    const response = await axios.patch(`${API_URL}/accounts/${accountId}/reactivate`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Reactivate account response:', response.data);

    // CRITICAL: Update localStorage immediately
    if (response.data.success && response.data.updatedUser) {
      const currentProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      const updatedProfile = {
        ...currentProfile,
        accounts: response.data.updatedUser.accounts
      };
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      console.log('✓ Updated localStorage after reactivation');
    }

    // Update the account status in local state
    setAccounts(prev => prev.map(account => 
      account._id === accountId ? { ...account, status: 'active' } : account
    ));

    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('accountStatusChanged', {
      detail: { accountId, status: 'active' }
    }));

    // Refresh accounts to ensure sync
    await fetchAccounts();

    return response.data;
  } catch (error) {
    console.error('Error reactivating account:', error);
    if (error.response?.status === 401) {
      handleLogout();
    }
    throw new Error(error.response?.data?.message || 'Failed to reactivate account');
  }
};


  // Updated Authentication functions
  const register = async (userData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let dataToSend = userData;
      
      if (!(userData instanceof FormData)) {
        dataToSend = new FormData();
        for (const key in userData) {
          if (key === 'profileImage' && userData[key]) {
            dataToSend.append('profileImage', userData[key]);
          } else if (key === 'accountType' && Array.isArray(userData[key])) {
            userData[key].forEach(type => {
              dataToSend.append('accountType', type);
            });
          } else {
            dataToSend.append(key, userData[key]);
          }
        }
      }
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      
      const response = await axios.post(`${API_URL}/auth/register`, dataToSend, config);
      
      const { token, user } = response.data;
      if (!token || !user) throw new Error('Invalid response from server');
  
      localStorage.setItem('token', token);
      localStorage.setItem('userProfile', JSON.stringify(user));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Create initial accounts using the server endpoint
      // Just fetch the accounts that were created during registration
      try {
        const accountsResponse = await axios.get(`${API_URL}/accounts`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Handle different response formats
        let accountsData = [];
        if (Array.isArray(accountsResponse.data)) {
          accountsData = accountsResponse.data;
        } else if (accountsResponse.data && Array.isArray(accountsResponse.data.accounts)) {
          accountsData = accountsResponse.data.accounts;
        }
        
        setAccounts(accountsData);
      } catch (accountError) {
        console.error('Error fetching accounts:', accountError);
      }
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      setUserRole(user.role);
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
  try {
    setIsLoading(true);
    setError(null);

    const response = await axios.post(`${API_URL}/auth/login`, credentials, {
      timeout: 30000, // Increased to 30 seconds
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const { token, user } = response.data;
    
    if (!token || !user) {
      throw new Error('Invalid response from server');
    }

    localStorage.setItem('token', token);
    localStorage.setItem('userProfile', JSON.stringify(user));
    
    // Set axios default header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    setCurrentUser(user);
    setIsAuthenticated(true);
    setUserRole(user.role);

    return response.data;
  } catch (error) {
    console.error('Login error details:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      code: error.code
    });
    
    let errorMessage;
    
    if (error.response?.status === 429) {
      errorMessage = 'Too many login attempts. Please wait a few minutes and try again.';
    } else if (error.response?.status === 401) {
      errorMessage = 'Invalid username or password. Please try again.';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Connection timeout. Please check your internet connection and try again.';
    } else if (!error.response && error.message.includes('Network Error')) {
      errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    } else {
      errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
    }
    
    setError(errorMessage);
    throw new Error(errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    delete axios.defaults.headers.common['Authorization'];
    
    setCurrentUser(null);
    setIsAuthenticated(false);
    setUserRole(null);
    setAccounts([]);
    setTransactions([]);
    setLoans([]);
    setFinancialGoals([]);
  };

  // Password management
  const requestPasswordReset = async (email) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { 
        email: email.toLowerCase() 
      });
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to send password reset request';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token, newPassword) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { 
        token, 
        newPassword 
      });
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to reset password';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Profile management
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put(`${API_URL}/auth/profile`, profileData);
      
      const updatedProfile = {
        ...JSON.parse(localStorage.getItem('userProfile')),
        ...response.data.user
      };
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      
      setCurrentUser(response.data.user);
      return response.data;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  // Role checking utilities
  const isAdmin = () => userRole === 'admin';
  const isModerator = () => userRole === 'moderator';
  const hasModeratorPermissions = () => isAdmin() || isModerator();

  // Set up interceptor for token expiration
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401 && isAuthenticated) {
          handleLogout();
        }
        return Promise.reject(error);
      }
    );
    
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [isAuthenticated]);
  

  const deposit = async (accountNumber, amount, description) => {
  try {
    // Ensure accountNumber is a string and trimmed
    const trimmedAccountNumber = String(accountNumber).trim();
    
    console.log('Sending deposit request with data:', {
      accountNumber: trimmedAccountNumber,
      amount: parseFloat(amount),
      description
    });
    
    // Get the authentication token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      throw new Error('Authentication required');
    }
    
    // Use the correct API endpoint
    const response = await axios.post(`${API_URL}/accounts/deposit`, {
      accountNumber: trimmedAccountNumber,
      amount: parseFloat(amount),
      description
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Deposit response:', response.data);
    
    // CRITICAL FIX: Update localStorage immediately after successful deposit
    if (response.data.success && response.data.updatedUser) {
      const currentProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      const updatedProfile = {
        ...currentProfile,
        accounts: response.data.updatedUser.accounts
      };
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      console.log('✓ Updated localStorage with new balance');
    }

    // Dispatch custom event to notify all components
    window.dispatchEvent(new CustomEvent('transactionCompleted', {
      detail: {
        type: 'deposit',
        amount: parseFloat(amount),
        accountNumber: trimmedAccountNumber,
        timestamp: new Date().toISOString()
      }
    }));
    console.log('✓ Dispatched transactionCompleted event');
    
    // Refresh data after successful deposit
    await Promise.all([
      fetchAccounts(),
      fetchTransactions()
    ]);
    
    return response.data;
  } catch (error) {
    console.error('Deposit error:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};
  
  const withdraw = async (accountNumber, amount, description) => {
  try {
    const trimmedAccountNumber = String(accountNumber).trim();
    
    console.log('Sending withdrawal request with data:', {
      accountNumber: trimmedAccountNumber,
      amount: parseFloat(amount),
      description
    });
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await axios.post(`${API_URL}/accounts/withdraw`, {
      accountNumber: trimmedAccountNumber,
      amount: parseFloat(amount),
      description
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Withdrawal response:', response.data);

    // CRITICAL FIX: Update localStorage immediately
    if (response.data.success) {
      if (response.data.updatedUser) {
        const currentProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        const updatedProfile = {
          ...currentProfile,
          accounts: response.data.updatedUser.accounts
        };
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        console.log('✓ Updated localStorage with new balance');
      }
      
      // Dispatch event
      window.dispatchEvent(new CustomEvent('transactionCompleted', {
        detail: {
          type: 'withdrawal',
          amount: parseFloat(amount),
          accountNumber: trimmedAccountNumber,
          timestamp: new Date().toISOString()
        }
      }));
      console.log('✓ Dispatched transactionCompleted event');
      
      await Promise.all([
        fetchAccounts(),
        fetchTransactions()
      ]);
    }

    return response.data;
  } catch (error) {
    console.error('Withdrawal error:', error);
    throw error;
  }
};
  
  const cancelTransaction = async (transactionId) => {
    try {
      const response = await axios.post(`${API_URL}/accounts/transactions/${transactionId}/cancel`);
  
      if (response.data.success) {
        await Promise.all([
          fetchAccounts(),
          fetchTransactions()
        ]);
      }
  
      return response.data;
    } catch (error) {
      console.error('Transaction cancellation error:', error);
      throw error;
    }
  };

  const confirmTransaction = async (transactionData) => {
    try {
      setIsConfirmingTransaction(true);
      
      // In a real implementation, you would make an API call to confirm the transaction
      const response = await axios.post(`${API_URL}/transactions/confirm`, transactionData, {
        headers: {
          'Authorization': `Bearer ${getStoredToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Store the confirmation details
      setConfirmationDetails(response.data);
      
      // Refresh accounts and transactions data
      await Promise.all([
        fetchAccounts(),
        fetchTransactions()
      ]);
      
      return response.data;
    } catch (error) {
      console.error('Transaction confirmation error:', error);
      throw error;
    } finally {
      setIsConfirmingTransaction(false);
    }
  };
  
  const clearConfirmation = () => {
    setConfirmationDetails(null);
  };
  
  const getConfirmationDetails = () => {
    return confirmationDetails;
  };

  const getTransactionConfirmations = () => {
    return JSON.parse(localStorage.getItem('transactionConfirmations') || '[]');
  };

  const value = {
    confirmTransaction,
    getTransactionConfirmations,
    confirmationDetails,
    isConfirmingTransaction,
    clearConfirmation,
    getConfirmationDetails,
    currentUser,
    isAuthenticated,
    isLoading,
    error,
    userRole,
    accounts,
    transactions,
    loans,
    financialGoals,
    setError,
    register,
    login,
    logout: handleLogout,
    requestPasswordReset,
    resetPassword,
    updateProfile,
    createAccount,
    createTransaction,
    transferFunds,
    createFinancialGoal,
    updateFinancialGoal,
    fetchAccounts,
    fetchTransactions,
    fetchLoans,
    requestLoan,
    fetchFinancialGoals,
    isAdmin,
    isModerator,
    hasModeratorPermissions,
    deposit,
    withdraw,
    cancelTransaction,
    deleteAccount,
    deactivateAccount,
    reactivateAccount
  };

  return (
    <NavyFederalContext.Provider value={value}>
      {children}
    </NavyFederalContext.Provider>
  );
};

export const useNavyFederal = () => {
  const context = useContext(NavyFederalContext);
  if (!context) {
    throw new Error('useNavyFederal must be used within a NavyFederalProvider');
  }
  return context;
};

export const useAuth = useNavyFederal;

export default NavyFederalProvider;