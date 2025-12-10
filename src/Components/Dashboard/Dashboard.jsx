import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, DollarSign, Landmark, Target, Eye, EyeOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavyFederal } from '../../Context/NavyFederalContext';
import AddAccountForm from '../AddAccountForm/AddAccountForm';
import AccountSettings from '../AccountSettings/AccountSettings';
import { format } from 'date-fns';
import './Dashboard.css';


// Add this helper function after imports
const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  if (imageUrl.startsWith('/uploads')) return `https://credit-unionapi.onrender.com${imageUrl}`;
  if (imageUrl.startsWith('data:')) return imageUrl; // Base64 images
  return imageUrl;
};

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Get data and functions from context
  const {
    currentUser,
    accounts,
    transactions,
    financialGoals = [],
    transferFunds,
    createTransaction,
    deleteAccount,
    deactivateAccount,
    reactivateAccount,
    fetchAccounts,
    fetchTransactions
  } = useNavyFederal();

  // Get user profile from localStorage
  const userProfileStr = localStorage.getItem('userProfile');
  const userProfile = userProfileStr ? JSON.parse(userProfileStr) : null;
  
  // DEBUG: Log accounts data
  useEffect(() => {
    console.log('=== ACCOUNTS DEBUG ===');
    console.log('Context accounts:', accounts);
    console.log('LocalStorage userProfile:', userProfile);
    console.log('Is accounts array?', Array.isArray(accounts));
    console.log('Accounts length:', accounts?.length);
    console.log('Current user:', currentUser);
    console.log('===================');
  }, [accounts, currentUser]);
  
  // Merge localStorage data with context data
  const userData = userProfile || currentUser;
  
  // FIXED: Properly merge accounts from both sources
  const userAccounts = React.useMemo(() => {
    // Priority: context accounts > localStorage accounts > currentUser accounts
    if (Array.isArray(accounts) && accounts.length > 0) {
      console.log('Using context accounts:', accounts);
      return accounts;
    }
    if (userProfile?.accounts && Array.isArray(userProfile.accounts) && userProfile.accounts.length > 0) {
      console.log('Using localStorage accounts:', userProfile.accounts);
      return userProfile.accounts;
    }
    if (currentUser?.accounts && Array.isArray(currentUser.accounts) && currentUser.accounts.length > 0) {
      console.log('Using currentUser accounts:', currentUser.accounts);
      return currentUser.accounts;
    }
    console.log('No accounts found');
    return [];
  }, [accounts, userProfile, currentUser]);

  const [currentProfileImage, setCurrentProfileImage] = useState(userProfile?.profileImage || currentUser?.profileImage || null);

  // Local state for UI elements
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({});
  const [greeting, setGreeting] = useState('');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [transferDetails, setTransferDetails] = useState({
    sourceAccount: '',
    destinationAccount: '',
    amount: '',
    accountOwnerName: '',
    bankName: '',
    accountNumber: '',
    routingNumber: ''
  });
  const [depositDetails, setDepositDetails] = useState({
    accountNumber: '',
    amount: ''
  });
  const [dateRangeFilter, setDateRangeFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [monthlySpending, setMonthlySpending] = useState(0);
  const [cashFlowPrediction, setCashFlowPrediction] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showAccountNumbers, setShowAccountNumbers] = useState({});
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const fileInputRef = useRef(null);

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Handle account card click - navigate to account details
  const handleAccountCardClick = (accountId) => {
    navigate(`/account-detail/${accountId}`);
  };

  // Handle deposit functionality
const handleDeposit = () => {
  if (parseFloat(depositDetails.amount) <= 0) {
    alert('Deposit amount must be positive');
    return;
  }

  // Close modal
  setIsDepositModalOpen(false);

  // Find the account to get its ID
  const account = userAccounts.find(acc => acc.accountNumber === depositDetails.accountNumber);
  
  if (!account) {
    alert('Account not found');
    return;
  }

  // Navigate to confirmation page with transaction data
  const transactionData = {
    type: 'Deposit',
    amount: parseFloat(depositDetails.amount),
    sourceAccount: depositDetails.accountNumber,
    accountNumber: depositDetails.accountNumber,
    depositMethod: 'cash',
    description: 'Cash Deposit',
    date: new Date().toISOString(),
    accountId: account._id || account.id
  };

  navigate('/transaction-confirmation', { 
    state: { 
      transactionData,
      fromAccountDetails: false // Coming from HomePage
    }
  });

  // Reset form
  setDepositDetails({
    accountNumber: '',
    amount: ''
  });
};

  // Calculate monthly spending
  const calculateMonthlySpending = () => {
    if (!Array.isArray(transactions)) {
      return 0;
    }
  
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const thisMonthsDebits = transactions.filter(transaction => {
      try {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= firstDayOfMonth && transaction.type === 'Debit';
      } catch (error) {
        console.error('Error processing transaction:', error);
        return false;
      }
    });
    
    return thisMonthsDebits.reduce((total, transaction) => 
      total + (typeof transaction.amount === 'number' ? transaction.amount : 0), 0);
  };

  // Predict cash flow based on transaction history
  const predictCashFlow = () => {
    if (!Array.isArray(transactions)) {
      return {
        projectedMonthlyIncome: 0,
        projectedMonthlyExpenses: 0,
        projectedMonthlySavings: 0
      };
    }
  
    try {
      const currentDate = new Date();
      const threeMonthsAgo = new Date(currentDate);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const recentTransactions = transactions.filter(transaction => {
        try {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= threeMonthsAgo;
        } catch (error) {
          console.error('Error processing transaction date:', error);
          return false;
        }
      });
      
      const credits = recentTransactions.filter(t => t && t.type === 'Credit');
      const debits = recentTransactions.filter(t => t && t.type === 'Debit');
      
      const totalCredits = credits.reduce((sum, t) => 
        sum + (typeof t.amount === 'number' ? t.amount : 0), 0);
      const totalDebits = debits.reduce((sum, t) => 
        sum + (typeof t.amount === 'number' ? t.amount : 0), 0);
      
      const avgMonthlyIncome = totalCredits / 3;
      const avgMonthlyExpenses = totalDebits / 3;
      const avgMonthlySavings = avgMonthlyIncome - avgMonthlyExpenses;
      
      return {
        projectedMonthlyIncome: avgMonthlyIncome,
        projectedMonthlyExpenses: avgMonthlyExpenses,
        projectedMonthlySavings: avgMonthlySavings
      };
    } catch (error) {
      console.error('Error calculating cash flow:', error);
      return {
        projectedMonthlyIncome: 0,
        projectedMonthlyExpenses: 0,
        projectedMonthlySavings: 0
      };
    }
  };

  // Update profile image
  const updateProfileImage = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const imageUrl = event.target.result;
        setImagePreview(imageUrl);
        resolve(imageUrl);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to upload image'));
      };
      
      reader.readAsDataURL(file);
    });
  };

  // Format account number for display
  const formatAccountNumber = (number, accountId) => {
    if (!number) return 'N/A';
    if (showAccountNumbers[accountId]) {
      return number;
    }
    return `****${number.slice(-4)}`;
  };

  // Handle transfer
const handleTransfer = () => {
  const amount = parseFloat(transferDetails.amount);
  
  if (amount <= 0) {
    alert('Transfer amount must be positive');
    return;
  }

  if (!transferDetails.destinationAccount) {
    alert('Please enter a destination account');
    return;
  }

  // Close modal
  setIsTransferModalOpen(false);

  // Navigate to confirmation page with transaction data
  const transactionData = {
    type: 'Transfer',
    amount: amount,
    sourceAccount: transferDetails.sourceAccount,
    destinationAccount: transferDetails.destinationAccount,
    recipientName: transferDetails.accountOwnerName || 'N/A',
    recipientBank: transferDetails.bankName || 'N/A',
    routingNumber: transferDetails.routingNumber || 'N/A',
    description: `Transfer to ${transferDetails.destinationAccount}`,
    transferType: 'domestic',
    date: new Date().toISOString()
  };

  navigate('/transaction-confirmation', { 
    state: { 
      transactionData,
      fromAccountDetails: false // Coming from HomePage
    }
  });

  // Reset form
  setTransferDetails({
    sourceAccount: '',
    destinationAccount: '',
    amount: '',
    accountOwnerName: '',
    bankName: '',
    accountNumber: '',
    routingNumber: ''
  });
};

  // Filter transactions by date range
  const getFilteredTransactions = () => {
    const transactionsArray = Array.isArray(transactions) ? transactions : [];
    
    if (!dateRangeFilter.startDate || !dateRangeFilter.endDate) {
      return transactionsArray.slice(0, 12);
    }
  
    const startDate = new Date(dateRangeFilter.startDate);
    const endDate = new Date(dateRangeFilter.endDate);
    endDate.setHours(23, 59, 59, 999);
  
    return transactionsArray.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  };

  // Handle print statement
  const handlePrintStatement = () => {
    const filteredTransactions = getFilteredTransactions();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Account Statement</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .statement-header { text-align: center; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="statement-header">
            <h1>Account Statement</h1>
            <p>Name: ${currentUser?.firstName || ''} ${currentUser?.lastName || ''}</p>
            <p>Account Number: ${userAccounts[0]?.accountNumber || ''}</p>
            <p>Statement Period: ${dateRangeFilter.startDate} to ${dateRangeFilter.endDate}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.map(transaction => `
                <tr>
                  <td>${new Date(transaction.date).toLocaleDateString()}</td>
                  <td>${transaction.description}</td>
                  <td>${transaction.type === 'Debit' ? '-' : ''}${formatCurrency(Math.abs(transaction.amount))}</td>
                  <td>${transaction.type}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Handle image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    try {
      const uploadedImage = await updateProfileImage(file);
      setImagePreview(uploadedImage);
      setCurrentProfileImage(uploadedImage);
      
      // Update localStorage
      const userProfileStr = localStorage.getItem('userProfile');
      if (userProfileStr) {
        const userProfile = JSON.parse(userProfileStr);
        userProfile.profileImage = uploadedImage;
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        
        // Dispatch event so Navbar updates too
        const profileUpdatedEvent = new CustomEvent('profileUpdated', { 
          detail: userProfile 
        });
        window.dispatchEvent(profileUpdatedEvent);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    try {
      await deleteAccount(accountToDelete._id);
      alert(`${accountToDelete.accountType} account has been permanently deleted`);
      setShowDeleteModal(false);
      setAccountToDelete(null);
      setDeleteConfirmation('');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeactivateAccount = async (account) => {
    if (!window.confirm(`Are you sure you want to deactivate your ${account.accountType} account?`)) {
      return;
    }

    try {
      await deactivateAccount(account._id);
      alert(`${account.accountType} account has been deactivated`);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleReactivateAccount = async (account) => {
    try {
      await reactivateAccount(account._id);
      alert(`${account.accountType} account has been reactivated`);
    } catch (error) {
      alert(error.message);
    }
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return 'Good Morning';
    if (currentHour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Process transaction data for chart
  const chartData = (Array.isArray(transactions) ? transactions : [])
    .slice(0, 10)
    .map(transaction => {
      let date;
      try {
        date = new Date(transaction.date);
        if (isNaN(date.getTime())) {
          date = new Date();
        }
      } catch (e) {
        date = new Date();
      }
      
      return {
        date,
        amount: transaction.type === 'Credit' ? transaction.amount : -transaction.amount
      };
    })
    .reverse();

  useEffect(() => {
  setGreeting(getGreeting());
  
  // Fetch accounts on mount
  if (typeof fetchAccounts === 'function') {
    console.log('Fetching accounts on mount...');
    fetchAccounts();
  }
  
  // CRITICAL: Listen for transaction completion events from AccountDetailsPage
  const handleTransactionUpdate = (event) => {
    console.log('🔔 Transaction completed event received:', event.detail);
    
    // Force reload user profile from localStorage
    const userProfileStr = localStorage.getItem('userProfile');
    if (userProfileStr) {
      const updatedProfile = JSON.parse(userProfileStr);
      console.log('📊 Reloaded profile from localStorage:', {
        accountsCount: updatedProfile.accounts?.length,
        balances: updatedProfile.accounts?.map(a => ({
          type: a.accountType,
          balance: a.balance
        }))
      });
    }
    
    // Refresh all data
    if (typeof fetchAccounts === 'function') {
      console.log('🔄 Refreshing accounts...');
      fetchAccounts();
    }
    if (typeof fetchTransactions === 'function') {
      console.log('🔄 Refreshing transactions...');
      fetchTransactions();
    }
  };
  
  // Listen for profile updates (for image changes)
  const handleProfileUpdate = (event) => {
    console.log('🖼️ Profile updated:', event.detail);
    if (event.detail?.profileImage) {
      setCurrentProfileImage(event.detail.profileImage);
      setImagePreview(null);
    }
    if (event.detail?.accounts) {
      // Profile includes account updates
      if (typeof fetchAccounts === 'function') {
        fetchAccounts();
      }
    }
  };
  
  window.addEventListener('transactionCompleted', handleTransactionUpdate);
  window.addEventListener('profileUpdated', handleProfileUpdate);
  
  return () => {
    window.removeEventListener('transactionCompleted', handleTransactionUpdate);
    window.removeEventListener('profileUpdated', handleProfileUpdate);
  };
}, []); // Only run once on mount

  useEffect(() => {
    const spending = calculateMonthlySpending();
    setMonthlySpending(spending);

    const cashFlow = predictCashFlow();
    setCashFlowPrediction(cashFlow);
  }, [transactions]);

  const filteredTransactions = getFilteredTransactions();

  // Render component
  return (
    <div className="hed-0011-account-page">
      {loading && <div className="hed-0011-loading">Loading...</div>}
      {error.general && <div className="hed-0011-error">{error.general}</div>}
      
      <header className="hed-0011-account-header">
        <div className="hed-0011-profile-section">
          <div className="hed-0011-profile-avatar" onClick={() => fileInputRef.current?.click()}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/jpeg,image/png,image/gif"
              style={{ display: 'none' }}
            />
            {(currentProfileImage || imagePreview) ? (
              <img
                src={getFullImageUrl(imagePreview || currentProfileImage)}
                alt={`${userData?.firstName || ''} ${userData?.lastName || ''}`}
                className="hed-0011-user-avatar"
              />
            ) : (
              <div className="hed-0011-avatar-placeholder">
                {userData?.firstName?.[0] || ''}
              </div>
            )}
            <div className="hed-0011-upload-overlay">
              <span>Upload Photo</span>
            </div>
          </div>
          <div className="hed-0011-profile-info">
            <h1>{greeting}, {userData?.firstName || ''} {userData?.lastName || ''}</h1>
            <div className="hed-0011-account-owner-info">
              <p>Account Number: {userAccounts[0]?.accountNumber || 'N/A'}</p>
              <p>Routing Number: {userAccounts[0]?.routingNumber || '256074974'}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="hed-0011-accounts-overview">
        <h2><Landmark className="hed-0011-icon" /> My Accounts</h2>
        
        {/* DEBUG INFO - Remove after fixing */}
        <div style={{ 
          padding: '10px', 
          background: '#f0f0f0', 
          marginBottom: '10px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <strong>DEBUG INFO:</strong><br/>
          Accounts found: {userAccounts.length}<br/>
          Accounts data: {JSON.stringify(userAccounts.map(a => ({
            type: a.accountType,
            number: a.accountNumber,
            balance: a.balance
          })))}<br/>
          Source: {
            Array.isArray(accounts) && accounts.length > 0 ? 'Context' :
            userProfile?.accounts?.length > 0 ? 'LocalStorage' :
            currentUser?.accounts?.length > 0 ? 'CurrentUser' :
            'None'
          }
        </div>
        
        {userAccounts.length === 0 ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            background: '#fff3cd',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <p>No accounts found. Please create an account below or refresh the page.</p>
            <button 
              onClick={() => {
                console.log('Manually fetching accounts...');
                if (typeof fetchAccounts === 'function') {
                  fetchAccounts();
                }
              }}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Refresh Accounts
            </button>
          </div>
        ) : (
          <div className="hed-0011-accounts-grid">
            {userAccounts.map((account, index) => (
              <div 
                  key={account._id || account.accountNumber || index} 
                  className={`hed-0011-account-card hed-0011-clickable-card ${account.status === 'inactive' ? 'hed-0011-inactive-account' : ''}`}
                  onClick={() => {
                    const validAccountId = account._id || account.id || account.accountNumber;
                    if (validAccountId) {
                      handleAccountCardClick(validAccountId);
                    } else {
                      console.error('No valid account ID found:', account);
                      alert('Cannot open account details - invalid account ID');
                    }
                  }}
                  style={{ cursor: 'pointer', opacity: account.status === 'inactive' ? 0.6 : 1 }}
                >
                <div className="hed-0011-account-header">
                  <h3>
                    {account.accountType}
                    {account.status === 'inactive' && (
                      <span style={{ 
                        marginLeft: '8px', 
                        fontSize: '0.75rem', 
                        color: '#dc2626',
                        fontWeight: 'normal' 
                      }}>
                        (Inactive)
                      </span>
                    )}
                  </h3>
                  <span className="hed-0011-account-number" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{formatAccountNumber(account.accountNumber, account._id)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAccountNumbers(prev => ({
                          ...prev,
                          [account._id]: !prev[account._id]
                        }));
                      }}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showAccountNumbers[account._id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </span>
                </div>
                <div className="hed-0011-account-balance">
                  <h4>{formatCurrency(account.balance || 0)}</h4>
                </div>
                <div className="hed-0011-account-details">
                  <div className="hed-0011-detail-row">
                    <span className="hed-0011-detail-label">Routing Number:</span>
                    <span className="hed-0011-detail-value">{account.routingNumber || 'N/A'}</span>
                  </div>
                  <div className="hed-0011-detail-row">
                    <span className="hed-0011-detail-label">Interest Rate:</span>
                    <span className="hed-0011-detail-value">
                      {((account.interestRate || 0) * 100).toFixed(2)}%
                    </span>
                  </div>
                  {account.overdraftProtection && (
                    <span className="hed-0011-overdraft-tag">Overdraft Protection</span>
                  )}
                  
                  {account.status === 'active' ? (
                    <>
                      <div className="hed-0011-button-group">
                        <button
                          className="hed-0011-transfer-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsTransferModalOpen(true);
                            setTransferDetails(prev => ({
                              ...prev,
                              sourceAccount: account.accountNumber
                            }));
                          }}
                        >
                          Transfer
                        </button>
                        <button
                          className="hed-0011-deposit-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsDepositModalOpen(true);
                            setDepositDetails(prev => ({
                              ...prev,
                              accountNumber: account.accountNumber
                            }));
                          }}
                        >
                          Deposit
                        </button>
                      </div>
                      
                      <div className="hed-0011-button-group" style={{ marginTop: '8px' }}>
                        <button
                          className="hed-0011-deactivate-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeactivateAccount(account);
                          }}
                          style={{
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            flex: 1
                          }}
                        >
                          Deactivate
                        </button>
                        <button
                          className="hed-0011-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAccountToDelete(account);
                            setShowDeleteModal(true);
                          }}
                          style={{
                            backgroundColor: '#dc2626',
                            color: 'white',
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            flex: 1
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="hed-0011-button-group" style={{ marginTop: '8px' }}>
                      <button
                        className="hed-0011-reactivate-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReactivateAccount(account);
                        }}
                        style={{
                          backgroundColor: '#059669',
                          color: 'white',
                          padding: '8px 16px',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          width: '100%'
                        }}
                      >
                        Reactivate Account
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="hed-0011-add-account-section hed-0011-mt-8">
        <h2 className="hed-0011-section-title">Open New Account</h2>
        <AddAccountForm />
      </section>

      <section className="hed-0011-financial-insights">
        <h2><DollarSign className="hed-0011-icon" /> Financial Insights</h2>
        <div className="hed-0011-insights-grid">
          <div className="hed-0011-insight-card">
            <h3>Monthly Spending</h3>
            <p className="hed-0011-insight-value">{formatCurrency(monthlySpending)}</p>
          </div>
          {cashFlowPrediction && (
            <>
              <div className="hed-0011-insight-card">
                <h3>Projected Monthly Income</h3>
                <p className="hed-0011-insight-value">
                  {formatCurrency(cashFlowPrediction.projectedMonthlyIncome)}
                </p>
              </div>
              <div className="hed-0011-insight-card">
                <h3>Projected Monthly Savings</h3>
                <p className="hed-0011-insight-value">
                  {formatCurrency(cashFlowPrediction.projectedMonthlySavings)}
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="hed-0011-financial-goals">
        <h2><Target className="hed-0011-icon" /> Financial Goals</h2>
        <div className="hed-0011-goals-grid">
          {Array.isArray(financialGoals) && financialGoals.map((goal, index) => (
            <div key={index} className="hed-0011-goal-card">
              <div className="hed-0011-goal-header">
                <h3>{goal.name}</h3>
                <span className="hed-0011-goal-category">{goal.category}</span>
              </div>
              <div className="hed-0011-goal-progress">
                <div className="hed-0011-progress-text">
                  <span>Progress</span>
                  <span>{((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}%</span>
                </div>
                <div className="hed-0011-progress-bar">
                  <div
                    className="hed-0011-progress-fill"
                    style={{
                      width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%`
                    }}
                  />
                </div>
                <div className="hed-0011-goal-amounts">
                  <span>Current: {formatCurrency(goal.currentAmount)}</span>
                  <span>Target: {formatCurrency(goal.targetAmount)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="hed-0011-date-filter" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
        <input
          type="date"
          value={dateRangeFilter.startDate}
          onChange={(e) => setDateRangeFilter(prev => ({ ...prev, startDate: e.target.value }))}
          className="hed-0011-date-input"
        />
        <input
          type="date"
          value={dateRangeFilter.endDate}
          onChange={(e) => setDateRangeFilter(prev => ({ ...prev, endDate: e.target.value }))}
          className="hed-0011-date-input"
        />
      </div>

      <section className="hed-0011-transaction-chart">
        <h2><Clock className="hed-0011-icon" /> Transaction History</h2>
        <div className="hed-0011-section-header">
          <div className="hed-0011-summary-grid">
            <div className="hed-0011-summary-card">
              <div className="hed-0011-summary-value hed-0011-credits">
                ${(Array.isArray(transactions) ? transactions : []).reduce((total, t) => 
                  t.type === 'Credit' ? total + t.amount : total, 0).toFixed(2)}
              </div>
              <div className="hed-0011-summary-label">Total Credits</div>
            </div>
            <div className="hed-0011-summary-card">
              <div className="hed-0011-summary-value hed-0011-debits">
                ${(Array.isArray(transactions) ? transactions : []).reduce((total, t) => 
                  t.type === 'Debit' ? total + t.amount : total, 0).toFixed(2)}
              </div>
              <div className="hed-0011-summary-label">Total Debits</div>
            </div>
            <Link to="/transactions" className="hed-0011-view-all-link">
              View All Transactions
            </Link>
          </div>
        </div>
        <div className="hed-0011-chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                tickFormatter={(date) => {
                  return date instanceof Date && !isNaN(date) 
                    ? format(date, 'MM/dd') 
                    : '';
                }}
              />
              <YAxis />
              <Tooltip
                formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']}
                labelFormatter={(date) => {
                  return date instanceof Date && !isNaN(date)
                    ? format(date, 'MM/dd/yyyy')
                    : '';
                }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#2563eb"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="hed-0011-print-actions" style={{ marginBottom: '1rem', textAlign: 'right' }}>
          <button 
            onClick={handlePrintStatement}
            className="hed-0011-print-btn"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Print Statement
          </button>
        </div>

        <div className="hed-0011-recent-transactions-preview">
          <table className="hed-0011-transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Account</th>
                <th>Amount</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(transactions) ? transactions : []).slice(0, 5).map(transaction => {
                const account = Array.isArray(accounts) ? 
                  accounts.find(a => a._id === transaction.accountId) : 
                  null;
                return (
                  <tr key={transaction.id || Math.random()}>
                    <td>{transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A'}</td>
                    <td>{transaction.description || 'N/A'}</td>
                    <td>
                      {account ? `${account.accountType || 'Account'} (*${(account.accountNumber || '').slice(-4)})` : 'Unknown Account'}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        color: transaction.type === 'Credit' ? '#059669' : '#dc2626'
                      }}
                    >
                      {transaction.type === 'Credit' ? '+' : '-'}${typeof transaction.amount === 'number' ? transaction.amount.toFixed(2) : '0.00'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>
                      ${typeof transaction.balance === 'number' ? transaction.balance.toFixed(2) : '0.00'}
                    </td>
                  </tr>
                );
              })}
              {(!Array.isArray(transactions) || transactions.length === 0) && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '1rem' }}>No transactions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isTransferModalOpen && (
        <div className="hed-0011-transfer-modal">
          <div className="hed-0011-transfer-modal-content">
            <h2>Transfer Funds</h2>
            <input
              type="text"
              placeholder="Destination Account"
              value={transferDetails.destinationAccount}
              onChange={(e) => setTransferDetails(prev => ({
                ...prev,
                destinationAccount: e.target.value
              }))}
            />
            <input
              type="text"
              placeholder="Account Owner Name"
              value={transferDetails.accountOwnerName}
              onChange={(e) => setTransferDetails(prev => ({
                ...prev,
                accountOwnerName: e.target.value
              }))}
            />
            <input
              type="text"
              placeholder="Bank Name"
              value={transferDetails.bankName}
              onChange={(e) => setTransferDetails(prev => ({
                ...prev,
                bankName: e.target.value
              }))}
            />
            <input
              type="text"
              placeholder="Account Number"
              value={transferDetails.accountNumber}
              onChange={(e) => setTransferDetails(prev => ({
                ...prev,
                accountNumber: e.target.value
              }))}
            />
            <input
              type="text"
              placeholder="Routing Number"
              value={transferDetails.routingNumber}
              onChange={(e) => setTransferDetails(prev => ({
                ...prev,
                routingNumber: e.target.value
              }))}
            />
            <input
              type="number"
              placeholder="Amount"
              value={transferDetails.amount}
              onChange={(e) => setTransferDetails(prev => ({
                ...prev,
                amount: e.target.value
              }))}
            />
            <div className="hed-0011-modal-actions">
              <button
                className="hed-0011-confirm-transfer"
                onClick={handleTransfer}
                disabled={!transferDetails.destinationAccount || !transferDetails.amount}
              >
                Continue to Confirmation
              </button>
              <button
                className="hed-0011-cancel-transfer"
                onClick={() => setIsTransferModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isDepositModalOpen && (
        <div className="hed-0011-deposit-modal">
          <div className="hed-0011-deposit-modal-content">
            <h2>Make a Deposit</h2>
            <div className="hed-0011-deposit-details">
              <div className="hed-0011-input-group">
                <label>Account Number</label>
                <input 
                  type="text" 
                  value={depositDetails.accountNumber} 
                  disabled 
                />
              </div>
              <div className="hed-0011-input-group">
                <label>Amount</label>
                <input 
                  type="number" 
                  placeholder="Enter amount to deposit"
                  value={depositDetails.amount}
                  onChange={(e) => setDepositDetails(prev => ({
                    ...prev,
                    amount: e.target.value
                  }))}
                />
              </div>
            </div>
            <div className="hed-0011-modal-actions">
              <button
                className="hed-0011-confirm-deposit"
                onClick={handleDeposit}
                disabled={!depositDetails.accountNumber || !depositDetails.amount}
              >
                Continue to Confirmation
              </button>
              <button
                className="hed-0011-cancel-deposit"
                onClick={() => setIsDepositModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && accountToDelete && (
      <div className="hed-0011-transfer-modal">
        <div className="hed-0011-transfer-modal-content">
          <h2>Delete Account</h2>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: '#dc2626', fontWeight: 'bold', marginBottom: '10px' }}>
              ⚠️ WARNING: This action cannot be undone!
            </p>
            <p>You are about to permanently delete:</p>
            <p style={{ fontWeight: 'bold', margin: '10px 0' }}>
              {accountToDelete.accountType} - {accountToDelete.accountNumber}
            </p>
            <p>Current Balance: {formatCurrency(accountToDelete.balance)}</p>
            
            {accountToDelete.balance > 0 && (
              <p style={{ color: '#dc2626', marginTop: '10px' }}>
                Note: Please transfer or withdraw your balance before deleting this account.
              </p>
            )}
            
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Type "DELETE" to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
          <div className="hed-0011-modal-actions">
            <button
              className="hed-0011-confirm-transfer"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== 'DELETE' || accountToDelete.balance > 0}
              style={{
                backgroundColor: deleteConfirmation === 'DELETE' && accountToDelete.balance === 0 ? '#dc2626' : '#ccc',
                cursor: deleteConfirmation === 'DELETE' && accountToDelete.balance === 0 ? 'pointer' : 'not-allowed'
              }}
            >
              Permanently Delete
            </button>
            <button
              className="hed-0011-cancel-transfer"
              onClick={() => {
                setShowDeleteModal(false);
                setAccountToDelete(null);
                setDeleteConfirmation('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}

      <div className="hed-0011-account-page">
        <h1>My Account</h1>
        <AccountSettings />
      </div>
    </div>
  );
};

export default Dashboard;