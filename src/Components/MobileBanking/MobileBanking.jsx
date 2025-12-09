import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { US_BANKS, getBankByName } from '../../utils/bankData';
import './MobileBanking.css';

const MobileBanking = () => {
  const [activeTab, setActiveTab] = useState('accounts');
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [billPayments, setBillPayments] = useState([]);
  const [mobileDeposits, setMobileDeposits] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showBillPayModal, setShowBillPayModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [spendingAnalytics, setSpendingAnalytics] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// CRITICAL FIX: Sync accounts from localStorage on mount
  useEffect(() => {
    const syncAccountsFromStorage = () => {
      const userProfileStr = localStorage.getItem('userProfile');
      if (userProfileStr) {
        const userProfile = JSON.parse(userProfileStr);
        if (userProfile.accounts && Array.isArray(userProfile.accounts) && userProfile.accounts.length > 0) {
          console.log('Syncing accounts from localStorage:', userProfile.accounts);
          setAccounts(userProfile.accounts);
          if (!selectedAccount) {
            setSelectedAccount(userProfile.accounts[0]);
          }
        }
      }
    };

    syncAccountsFromStorage();

    // Listen for account updates
    const handleStorageChange = () => {
      syncAccountsFromStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdated', handleStorageChange);
    window.addEventListener('transactionCompleted', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleStorageChange);
      window.removeEventListener('transactionCompleted', handleStorageChange);
    };
  }, []);

 
// Transfer form state
const [transferForm, setTransferForm] = useState({
    fromAccountId: '',
    toAccountId: '',
    transferType: 'internal',
    // External transfer fields
    toAccountNumber: '',
    toBankName: '',
    toRoutingNumber: '',
    toAccountHolderName: '',
    amount: '',
    description: ''
  });

  // State for selected bank (to auto-fill routing number)
  const [selectedBank, setSelectedBank] = useState(null);

  // Bill payment form state
  const [billPayForm, setBillPayForm] = useState({
    accountId: '',
    payee: {
      name: '',
      accountNumber: '',
      category: 'utilities'
    },
    amount: '',
    paymentDate: '',
    memo: ''
  });

  // Mobile deposit form state
  const [depositForm, setDepositForm] = useState({
    accountId: '',
    amount: '',
    checkNumber: '',
    frontImage: null,
    backImage: null
  });

  // Get auth token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  // Fetch accounts on component mount
  useEffect(() => {
    fetchAccounts();
    fetchAlerts();
  }, []);

  // Fetch data based on active tab
  useEffect(() => {
    switch (activeTab) {
      case 'transactions':
        fetchTransactions();
        break;
      case 'transfers':
        fetchTransfers();
        break;
      case 'bills':
        fetchBillPayments();
        break;
      case 'deposits':
        fetchMobileDeposits();
        break;
      case 'analytics':
        fetchSpendingAnalytics();
        break;
      default:
        break;
    }
  }, [activeTab, selectedAccount]);

  // Fetch accounts
  // Fetch accounts
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      
      // DIAGNOSTIC: Check localStorage first
      const userProfileStr = localStorage.getItem('userProfile');
      console.log('=== MOBILE BANKING ACCOUNTS DEBUG ===');
      console.log('localStorage userProfile:', userProfileStr);
      
      if (userProfileStr) {
        const userProfile = JSON.parse(userProfileStr);
        console.log('Parsed userProfile:', userProfile);
        console.log('userProfile.accounts:', userProfile.accounts);
        
        if (userProfile.accounts && Array.isArray(userProfile.accounts) && userProfile.accounts.length > 0) {
          console.log('Setting accounts from localStorage:', userProfile.accounts);
          setAccounts(userProfile.accounts);
          if (!selectedAccount) {
            setSelectedAccount(userProfile.accounts[0]);
          }
          setLoading(false);
          return; // Use localStorage data
        }
      }
      
      // If no localStorage data, fetch from API
      const response = await axios.get(`${API_BASE_URL}/mobile-banking/accounts`, {
        headers: getAuthHeaders()
      });

      console.log('API Response:', response.data);

      if (response.data.success) {
        console.log('Setting accounts from API:', response.data.data);
        setAccounts(response.data.data);
        if (response.data.data.length > 0 && !selectedAccount) {
          setSelectedAccount(response.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Fetch accounts error:', err);
      setError(err.response?.data?.message || 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = selectedAccount ? { accountId: selectedAccount._id } : {};
      const response = await axios.get(`${API_BASE_URL}/mobile-banking/transactions`, {
        headers: getAuthHeaders(),
        params
      });

      if (response.data.success) {
        setTransactions(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch transfers
  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/mobile-banking/transfers`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setTransfers(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch transfers');
    } finally {
      setLoading(false);
    }
  };

  // Fetch bill payments
  const fetchBillPayments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/mobile-banking/bill-payments`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setBillPayments(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bill payments');
    } finally {
      setLoading(false);
    }
  };

  // Fetch mobile deposits
  const fetchMobileDeposits = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/mobile-banking/mobile-deposits`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setMobileDeposits(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch mobile deposits');
    } finally {
      setLoading(false);
    }
  };

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/mobile-banking/alerts`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setAlerts(response.data.data);
        setUnreadAlertsCount(response.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  // Fetch spending analytics
  const fetchSpendingAnalytics = async () => {
    try {
      setLoading(true);
      const params = selectedAccount ? { accountId: selectedAccount._id } : {};
      const response = await axios.get(`${API_BASE_URL}/mobile-banking/analytics/spending`, {
        headers: getAuthHeaders(),
        params
      });

      if (response.data.success) {
        setSpendingAnalytics(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  // Handle bank selection
const handleBankSelection = (e) => {
  const bankName = e.target.value;
  const bank = getBankByName(bankName);
  
  if (bank) {
    setSelectedBank(bank);
    setTransferForm({
      ...transferForm,
      toBankName: bank.name,
      toRoutingNumber: bank.routingNumber
    });
  } else {
    setSelectedBank(null);
    setTransferForm({
      ...transferForm,
      toBankName: '',
      toRoutingNumber: ''
    });
  }
};

  // Create transfer
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/mobile-banking/transfers`,
        transferForm,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setShowTransferModal(false);
        setTransferForm({
          fromAccountId: '',
          toAccountId: '',
          amount: '',
          description: ''
        });
        fetchAccounts();
        fetchTransfers();
        alert('Transfer completed successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create transfer');
    } finally {
      setLoading(false);
    }
  };

  // Create bill payment
const handleBillPaySubmit = async (e) => {
  e.preventDefault();
  
  // Real-life validation
  if (!billPayForm.accountId) {
    setError('Please select an account');
    return;
  }

  if (!billPayForm.payee.name.trim()) {
    setError('Please enter payee name');
    return;
  }

  if (!billPayForm.payee.accountNumber.trim()) {
    setError('Please enter payee account number');
    return;
  }

  if (parseFloat(billPayForm.amount) <= 0) {
    setError('Amount must be greater than $0');
    return;
  }

  if (!billPayForm.paymentDate) {
    setError('Please select a payment date');
    return;
  }

  // Check if selected date is in the past
  const selectedDate = new Date(billPayForm.paymentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    setError('Payment date cannot be in the past');
    return;
  }

  try {
    setLoading(true);
    setError(null);

    const response = await axios.post(
      `${API_BASE_URL}/mobile-banking/bill-payments`,
      billPayForm,
      { headers: getAuthHeaders() }
    );

    if (response.data.success) {
      setShowBillPayModal(false);
      setBillPayForm({
        accountId: '',
        payee: {
          name: '',
          accountNumber: '',
          category: 'utilities'
        },
        amount: '',
        paymentDate: '',
        memo: ''
      });
      fetchBillPayments();
      fetchAccounts(); // Refresh account balances
      alert('✅ Bill payment scheduled successfully!');
    }
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to schedule bill payment');
    console.error('Bill payment error:', err);
  } finally {
    setLoading(false);
  }
};

  // Submit mobile deposit
const handleDepositSubmit = async (e) => {
  e.preventDefault();
  
  // Real-life validation
  if (!depositForm.accountId) {
    setError('Please select an account');
    return;
  }

  if (parseFloat(depositForm.amount) <= 0) {
    setError('Deposit amount must be greater than $0');
    return;
  }

  // Check for reasonable deposit amount (e.g., max $10,000 for mobile deposit)
  if (parseFloat(depositForm.amount) > 10000) {
    setError('Mobile deposits are limited to $10,000. Please visit a branch for larger deposits.');
    return;
  }

  if (!depositForm.frontImage) {
    setError('Please upload front image of the check');
    return;
  }

  if (!depositForm.backImage) {
    setError('Please upload back image of the check');
    return;
  }

  // Validate file types
  const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  
  if (!validImageTypes.includes(depositForm.frontImage.type)) {
    setError('Front image must be JPG or PNG format');
    return;
  }

  if (!validImageTypes.includes(depositForm.backImage.type)) {
    setError('Back image must be JPG or PNG format');
    return;
  }

  // Validate file sizes (max 5MB per image)
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (depositForm.frontImage.size > maxSize) {
    setError('Front image must be less than 5MB');
    return;
  }

  if (depositForm.backImage.size > maxSize) {
    setError('Back image must be less than 5MB');
    return;
  }

  try {
    setLoading(true);
    setError(null);
    
    // Convert images to base64
    const frontImageBase64 = await fileToBase64(depositForm.frontImage);
    const backImageBase64 = await fileToBase64(depositForm.backImage);
    
    const depositData = {
      accountId: depositForm.accountId,
      amount: parseFloat(depositForm.amount),
      checkNumber: depositForm.checkNumber || 'N/A',
      checkImages: {
        front: frontImageBase64,
        back: backImageBase64
      }
    };

    const response = await axios.post(
      `${API_BASE_URL}/mobile-banking/mobile-deposits`,
      depositData,
      { headers: getAuthHeaders() }
    );

    if (response.data.success) {
      setShowDepositModal(false);
      setDepositForm({
        accountId: '',
        amount: '',
        checkNumber: '',
        frontImage: null,
        backImage: null
      });
      fetchMobileDeposits();
      alert('✅ Check deposit submitted! It will be reviewed within 1-2 business days.');
    }
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to submit deposit');
    console.error('Mobile deposit error:', err);
  } finally {
    setLoading(false);
  }
};

// Helper function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

  // Mark alert as read
  const markAlertRead = async (alertId) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/mobile-banking/alerts/${alertId}/read`,
        {},
        { headers: getAuthHeaders() }
      );
      fetchAlerts();
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  // Format date - FIXED for Invalid Date issues
  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    try {
      const dateObj = new Date(date);
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return 'N/A';
      }
      
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'N/A';
    }
  };

  // Get account type icon
  const getAccountIcon = (type) => {
    const icons = {
      checking: '💳',
      savings: '💰',
      'credit-card': '💎',
      loan: '🏠',
      investment: '📈',
      'money-market': '💵'
    };
    return icons[type] || '🏦';
  };

  // Get transaction icon
  const getTransactionIcon = (type) => {
    const icons = {
      deposit: '⬇️',
      withdrawal: '⬆️',
      transfer: '🔄',
      payment: '💸',
      purchase: '🛒',
      refund: '↩️',
      fee: '⚠️',
      interest: '📊'
    };
    return icons[type] || '💵';
  };

  // Get status badge class
  const getStatusClass = (status) => {
    const classes = {
      pending: 'status-pending',
      processing: 'status-processing',
      completed: 'status-completed',
      approved: 'status-approved',
      failed: 'status-failed',
      cancelled: 'status-cancelled',
      rejected: 'status-rejected'
    };
    return classes[status] || 'status-default';
  };

  return (
    <div className="mobile-banking-container">
      {/* Header */}
      <header className="banking-header">
        <div className="header-top">
          <h1>Mobile Banking</h1>
          <div className="header-actions">
            <button
              className="alert-btn"
              onClick={() => setActiveTab('alerts')}
            >
              🔔
              {unreadAlertsCount > 0 && (
                <span className="alert-badge">{unreadAlertsCount}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Account Overview */}
      {activeTab === 'accounts' && (
        <section className="accounts-section">
          <div className="section-header">
            <h2>My Accounts</h2>
            <span className="total-balance">
              Total: {formatCurrency(
                accounts.reduce((sum, acc) => {
                  const balance = acc.balance?.available ?? acc.balance?.current ?? acc.balance ?? 0;
                  return sum + (typeof balance === 'number' ? balance : 0);
                }, 0)
              )}
            </span>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading accounts...</p>
            </div>
          ) : (
            <div className="accounts-grid">
              {accounts.map((account) => (
                <div
                  key={account._id}
                  className={`account-card ${
                    selectedAccount?._id === account._id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedAccount(account)}
                >
                  <div className="account-header">
                    <span className="account-icon">
                      {getAccountIcon(account.accountType)}
                    </span>
                    <div className="account-info">
                      <h3>{account.accountName}</h3>
                      <p className="account-number">{account.maskedAccountNumber}</p>
                    </div>
                    {account.isPrimary && (
                      <span className="primary-badge">Primary</span>
                    )}
                  </div>

                  <div className="account-balance">
                    <div className="balance-item">
                      <span className="balance-label">Available Balance</span>
                      <span className="balance-amount">
                        {formatCurrency(
                          account.balance?.available ?? 
                          account.balance?.current ?? 
                          account.balance ?? 
                          0
                        )}
                      </span>
                    </div>
                    {account.balance.pending > 0 && (
                      <div className="balance-item pending">
                        <span className="balance-label">Pending</span>
                        <span className="balance-amount">
                          {formatCurrency(account.balance.pending)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="account-actions">
                    <button
                      className="action-btn-small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTransferForm({
                          ...transferForm,
                          fromAccountId: account._id
                        });
                        setShowTransferModal(true);
                      }}
                    >
                      Transfer
                    </button>
                    <button
                      className="action-btn-small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab('transactions');
                      }}
                    >
                      Transactions
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="actions-grid">
              <button
                className="quick-action-btn"
                onClick={() => setShowTransferModal(true)}
              >
                <span className="action-icon">🔄</span>
                <span>Transfer Money</span>
              </button>
              <button
                className="quick-action-btn"
                onClick={() => setShowBillPayModal(true)}
              >
                <span className="action-icon">💸</span>
                <span>Pay Bills</span>
              </button>
              <button
                className="quick-action-btn"
                onClick={() => setShowDepositModal(true)}
              >
                <span className="action-icon">📱</span>
                <span>Deposit Check</span>
              </button>
              <button
                className="quick-action-btn"
                onClick={() => setActiveTab('analytics')}
              >
                <span className="action-icon">📊</span>
                <span>View Analytics</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Navigation Tabs */}
      <nav className="banking-tabs">
        <button
          className={`tab-btn ${activeTab === 'accounts' ? 'active' : ''}`}
          onClick={() => setActiveTab('accounts')}
        >
          <span className="tab-icon">🏦</span>
          <span>Accounts</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <span className="tab-icon">📋</span>
          <span>Transactions</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'transfers' ? 'active' : ''}`}
          onClick={() => setActiveTab('transfers')}
        >
          <span className="tab-icon">🔄</span>
          <span>Transfers</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'bills' ? 'active' : ''}`}
          onClick={() => setActiveTab('bills')}
        >
          <span className="tab-icon">💸</span>
          <span>Bill Pay</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'deposits' ? 'active' : ''}`}
          onClick={() => setActiveTab('deposits')}
        >
          <span className="tab-icon">📱</span>
          <span>Deposits</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <span className="tab-icon">📊</span>
          <span>Analytics</span>
        </button>
      </nav>

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <section className="transactions-section">
          <div className="section-header">
            <h2>Transaction History</h2>
            {selectedAccount && (
              <select
                value={selectedAccount._id}
                onChange={(e) => {
                  const account = accounts.find(acc => acc._id === e.target.value);
                  setSelectedAccount(account);
                }}
                className="account-selector"
              >
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.accountName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading transactions...</p>
            </div>
          ) : transactions.length > 0 ? (
            <div className="transactions-list">
              {transactions.map((transaction) => (
                <div key={transaction._id} className="transaction-item">
                  <div className="transaction-icon">
                    {getTransactionIcon(transaction.transactionType)}
                  </div>
                  <div className="transaction-details">
                    <h4>{transaction.description}</h4>
                    <p className="transaction-date">
                      {formatDate(transaction.transactionDate)}
                    </p>
                    <span className={`transaction-status ${getStatusClass(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                  <div className="transaction-amount">
                    <span className={transaction.amount >= 0 ? 'positive' : 'negative'}>
                      {transaction.amount >= 0 ? '+' : ''}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="icon">📋</span>
              <h3>No transactions found</h3>
              <p>Your transaction history will appear here</p>
            </div>
          )}
        </section>
      )}

      {/* Transfers Tab */}
      {activeTab === 'transfers' && (
        <section className="transfers-section">
          <div className="section-header">
            <h2>Transfers</h2>
            <button
              className="add-btn"
              onClick={() => setShowTransferModal(true)}
            >
              + New Transfer
            </button>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading transfers...</p>
            </div>
          ) : transfers.length > 0 ? (
            <div className="transfers-list">
              {transfers.map((transfer) => (
                <div key={transfer._id} className="transfer-item">
                  <div className="transfer-details">
                    <h4>
                      {transfer.fromAccountId?.accountName} → {transfer.toAccountId?.accountName}
                    </h4>
                    <p className="transfer-date">{formatDate(transfer.scheduledDate)}</p>
                    {transfer.description && (
                      <p className="transfer-description">{transfer.description}</p>
                    )}
                    <span className={`transfer-status ${getStatusClass(transfer.status)}`}>
                      {transfer.status}
                    </span>
                  </div>
                  <div className="transfer-amount">
                    {formatCurrency(transfer.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="icon">🔄</span>
              <h3>No transfers found</h3>
              <p>Create your first transfer to get started</p>
            </div>
          )}
        </section>
      )}

      {/* Bill Payments Tab */}
      {activeTab === 'bills' && (
        <section className="bills-section">
          <div className="section-header">
            <h2>Bill Payments</h2>
            <button
              className="add-btn"
              onClick={() => setShowBillPayModal(true)}
            >
              + Schedule Payment
            </button>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading bill payments...</p>
            </div>
          ) : billPayments.length > 0 ? (
            <div className="bills-list">
              {billPayments.map((payment) => (
                <div key={payment._id} className="bill-item">
                  <div className="bill-details">
                    <h4>{payment.payee.name}</h4>
                    <p className="bill-date">Due: {formatDate(payment.paymentDate)}</p>
                    <p className="bill-category">{payment.payee.category}</p>
                    <span className={`bill-status ${getStatusClass(payment.status)}`}>
                      {payment.status}
                    </span>
                  </div>
                  <div className="bill-amount">
                    {formatCurrency(payment.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="icon">💸</span>
              <h3>No bill payments scheduled</h3>
              <p>Schedule your first bill payment</p>
            </div>
          )}
        </section>
      )}

      {/* Mobile Deposits Tab */}
      {activeTab === 'deposits' && (
        <section className="deposits-section">
          <div className="section-header">
            <h2>Mobile Check Deposits</h2>
            <button
              className="add-btn"
              onClick={() => setShowDepositModal(true)}
            >
              + Deposit Check
            </button>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading deposits...</p>
            </div>
          ) : mobileDeposits.length > 0 ? (
            <div className="deposits-list">
              {mobileDeposits.map((deposit) => (
                <div key={deposit._id} className="deposit-item">
                  <div className="deposit-details">
                    <h4>Check Deposit</h4>
                    <p className="deposit-date">{formatDate(deposit.depositDate)}</p>
                    {deposit.checkNumber && (
                      <p className="check-number">Check #{deposit.checkNumber}</p>
                    )}
                    <span className={`deposit-status ${getStatusClass(deposit.status)}`}>
                      {deposit.status}
                    </span>
                  </div>
                  <div className="deposit-amount">
                    {formatCurrency(deposit.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="icon">📱</span>
              <h3>No mobile deposits</h3>
              <p>Deposit checks using your mobile device</p>
            </div>
          )}
        </section>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <section className="analytics-section">
          <h2>Spending Analytics</h2>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading analytics...</p>
            </div>
          ) : spendingAnalytics ? (
            <div className="analytics-content">
              <div className="analytics-summary">
                <div className="summary-card">
                  <h3>Total Spending</h3>
                  <p className="summary-amount">
                    {formatCurrency(spendingAnalytics.totalSpending)}
                  </p>
                </div>
              </div>

              <div className="category-breakdown">
                <h3>Spending by Category</h3>
                <div className="categories-list">
                  {spendingAnalytics.categoryBreakdown.map((category) => (
                    <div key={category._id} className="category-item">
                      <div className="category-info">
                        <span className="category-name">{category._id}</span>
                        <span className="category-count">{category.count} transactions</span>
                      </div>
                      <div className="category-amount">
                        {formatCurrency(category.total)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <span className="icon">📊</span>
              <h3>No analytics data available</h3>
              <p>Start making transactions to see your spending patterns</p>
            </div>
          )}
        </section>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <section className="alerts-section">
          <div className="section-header">
            <h2>Alerts & Notifications</h2>
            {unreadAlertsCount > 0 && (
              <span className="unread-count">{unreadAlertsCount} unread</span>
            )}
          </div>

          {alerts.length > 0 ? (
            <div className="alerts-list">
              {alerts.map((alert) => (
                <div
                  key={alert._id}
                  className={`alert-item ${alert.isRead ? 'read' : 'unread'} priority-${alert.priority}`}
                  onClick={() => !alert.isRead && markAlertRead(alert._id)}
                >
                  <div className="alert-content">
                    <h4>{alert.title}</h4>
                    <p>{alert.message}</p>
                    <span className="alert-date">{formatDate(alert.createdAt)}</span>
                  </div>
                  {!alert.isRead && <div className="unread-indicator"></div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="icon">🔔</span>
              <h3>No alerts</h3>
              <p>You're all caught up!</p>
            </div>
          )}
        </section>
      )}

      {/* Transfer Modal */}
    {showTransferModal && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
                <h2>Transfer Money</h2>
                <button
                className="close-btn"
                onClick={() => {
                    setShowTransferModal(false);
                    setSelectedBank(null);
                }}
                >
                ✕
                </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="transfer-form">
                {/* Transfer Type Selection */}
                <div className="form-group">
                <label>Transfer Type</label>
                <div className="transfer-type-selector">
                    <button
                    type="button"
                    className={`type-btn ${transferForm.transferType === 'internal' ? 'active' : ''}`}
                    onClick={() => {
                        setTransferForm({ 
                        ...transferForm, 
                        transferType: 'internal',
                        toAccountNumber: '',
                        toBankName: '',
                        toRoutingNumber: '',
                        toAccountHolderName: ''
                        });
                        setSelectedBank(null);
                    }}
                    >
                    🏦 Between My Accounts
                    </button>
                    <button
                    type="button"
                    className={`type-btn ${transferForm.transferType === 'external' ? 'active' : ''}`}
                    onClick={() => {
                        setTransferForm({ 
                        ...transferForm, 
                        transferType: 'external',
                        toAccountId: ''
                        });
                    }}
                    >
                    🌐 To Another Bank
                    </button>
                </div>
                </div>

                {/* FROM ACCOUNT - Works for both internal and external */}
                <div className="form-group">
                <label>From Account *</label>
                <select
                    value={transferForm.fromAccountId}
                    onChange={(e) =>
                    setTransferForm({ ...transferForm, fromAccountId: e.target.value })
                    }
                    required
                    className="form-select"
                >
                    <option value="">-- Select Your Account --</option>
                    {accounts && accounts.length > 0 ? (
                      accounts.map((acc) => {
                        const accountId = acc._id || acc.id;
                        const accountName = acc.accountName || acc.accountType || 'Account';
                        const accountType = acc.accountType || 'N/A';
                        const balance = acc.balance?.available ?? acc.balance?.current ?? acc.balance ?? 0;
                        
                        return (
                          <option key={accountId} value={accountId}>
                            {accountName} ({accountType}) - {formatCurrency(balance)}
                          </option>
                        );
                      })
                    ) : (
                      <option value="" disabled>No accounts available</option>
                    )}
                </select>
                {accounts.length === 0 && (
                  <small style={{ color: '#dc2626', display: 'block', marginTop: '4px' }}>
                    ⚠️ No accounts found. Please refresh or create an account.
                  </small>
                )}
                </div>

                {/* INTERNAL TRANSFER FIELDS */}
                {transferForm.transferType === 'internal' && (
                <div className="form-group">
                    <label>To My Account *</label>
                    <select
                    value={transferForm.toAccountId}
                    onChange={(e) =>
                        setTransferForm({ ...transferForm, toAccountId: e.target.value })
                    }
                    required
                    className="form-select"
                    >
                    <option value="">-- Select Destination Account --</option>
                    {accounts
                        .filter((acc) => acc._id !== transferForm.fromAccountId)
                        .map((acc) => (
                        <option key={acc._id} value={acc._id}>
                            {acc.accountName} ({acc.accountType})
                        </option>
                        ))}
                    </select>
                </div>
                )}

                {/* EXTERNAL TRANSFER FIELDS */}
                {transferForm.transferType === 'external' && (
                <>
                    <div className="form-group">
                    <label>Select Bank *</label>
                    <select
                        value={transferForm.toBankName}
                        onChange={handleBankSelection}
                        required
                        className="form-select"
                    >
                        <option value="">-- Select US Bank --</option>
                        {US_BANKS.map((bank, index) => (
                        <option key={index} value={bank.name}>
                            {bank.name}
                        </option>
                        ))}
                    </select>
                    {selectedBank && (
                        <small className="bank-info">
                        ✓ Routing Number: {selectedBank.routingNumber}
                        </small>
                    )}
                    </div>

                    <div className="form-group">
                    <label>Account Holder Name *</label>
                    <input
                        type="text"
                        value={transferForm.toAccountHolderName}
                        onChange={(e) =>
                        setTransferForm({ ...transferForm, toAccountHolderName: e.target.value })
                        }
                        placeholder="Full name on account"
                        required
                        className="form-input"
                    />
                    </div>

                    <div className="form-group">
                    <label>Account Number *</label>
                    <input
                        type="text"
                        value={transferForm.toAccountNumber}
                        onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 17);
                        setTransferForm({ ...transferForm, toAccountNumber: value });
                        }}
                        placeholder="1234567890 (4-17 digits)"
                        required
                        maxLength="17"
                        className="form-input"
                    />
                    <small>Enter 4-17 digit account number (e.g., 1234567890 for testing)</small>
                    </div>

                    <div className="form-group">
                    <label>Routing Number * (Auto-filled)</label>
                    <input
                        type="text"
                        value={transferForm.toRoutingNumber}
                        onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                        setTransferForm({ ...transferForm, toRoutingNumber: value });
                        }}
                        placeholder="021000021"
                        required
                        maxLength="9"
                        className="form-input"
                        readOnly={!!selectedBank}
                        style={{ 
                        backgroundColor: selectedBank ? '#f3f4f6' : 'white',
                        cursor: selectedBank ? 'not-allowed' : 'text'
                        }}
                    />
                    <small>9-digit routing number (auto-filled when bank is selected)</small>
                    </div>

                    <div className="external-transfer-info">
                    <p>💡 <strong>Testing:</strong> You can use any 4-17 digit number (e.g., 1234567890)</p>
                    <p>🏦 <strong>Real Transfers:</strong> Select bank and enter actual account number</p>
                    <p>✓ <strong>Routing number is auto-filled</strong> when you select a bank</p>
                    </div>
                </>
                )}

                {/* AMOUNT - Same for both types */}
                <div className="form-group">
                <label>Amount *</label>
                <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={transferForm.amount}
                    onChange={(e) =>
                    setTransferForm({ ...transferForm, amount: e.target.value })
                    }
                    placeholder="0.00"
                    required
                    className="form-input"
                />
                </div>

                {/* DESCRIPTION - Optional for both */}
                <div className="form-group">
                <label>Description (Optional)</label>
                <input
                    type="text"
                    value={transferForm.description}
                    onChange={(e) =>
                    setTransferForm({ ...transferForm, description: e.target.value })
                    }
                    placeholder="Enter description"
                    className="form-input"
                />
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="modal-actions">
                <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                    setShowTransferModal(false);
                    setSelectedBank(null);
                    }}
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="btn-submit"
                    disabled={loading}
                >
                    {loading ? 'Processing...' : 'Transfer Money'}
                </button>
                </div>
            </form>
            </div>
        </div>
        )}

      {/* Bill Payment Modal */}
      {showBillPayModal && (
        <div className="modal-overlay" onClick={() => setShowBillPayModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Schedule Bill Payment</h2>
              <button
                className="close-btn"
                onClick={() => setShowBillPayModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBillPaySubmit} className="bill-pay-form">
              <div className="form-group">
                <label>From Account *</label>
                <select
                    value={billPayForm.accountId}
                    onChange={(e) =>
                    setBillPayForm({ ...billPayForm, accountId: e.target.value })
                    }
                    required
                    className="form-select"
                >
                    <option value="">-- Select Your Account --</option>
                    {accounts && accounts.length > 0 ? (
                      accounts.map((acc) => {
                        const accountId = acc._id || acc.id;
                        const accountName = acc.accountName || acc.accountType || 'Account';
                        const accountType = acc.accountType || 'N/A';
                        const balance = acc.balance?.available ?? acc.balance?.current ?? acc.balance ?? 0;
                        
                        return (
                          <option key={accountId} value={accountId}>
                            {accountName} ({accountType}) - {formatCurrency(balance)}
                          </option>
                        );
                      })
                    ) : (
                      <option value="" disabled>No accounts available</option>
                    )}
                </select>
                {accounts.length === 0 && (
                  <small style={{ color: '#dc2626', display: 'block', marginTop: '4px' }}>
                    ⚠️ No accounts found. Please refresh or create an account.
                  </small>
                )}
            </div>

              <div className="form-group">
                <label>Payee Name *</label>
                <input
                    type="text"
                    value={billPayForm.payee.name}
                    onChange={(e) =>
                    setBillPayForm({
                        ...billPayForm,
                        payee: { ...billPayForm.payee, name: e.target.value }
                    })
                    }
                    placeholder="e.g., Electric Company, Water Department"
                    required
                    className="form-input"
                    minLength="2"
                />
                </div>

              <div className="form-group">
                <label>Payee Account Number *</label>
                <input
                    type="text"
                    value={billPayForm.payee.accountNumber}
                    onChange={(e) =>
                    setBillPayForm({
                        ...billPayForm,
                        payee: { ...billPayForm.payee, accountNumber: e.target.value }
                    })
                    }
                    placeholder="Your account number with the payee"
                    required
                    className="form-input"
                    minLength="3"
                />
                <small>Enter your account/invoice number with this company</small>
                </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={billPayForm.payee.category}
                  onChange={(e) =>
                    setBillPayForm({
                      ...billPayForm,
                      payee: { ...billPayForm.payee, category: e.target.value }
                    })
                  }
                >
                  <option value="utilities">Utilities</option>
                  <option value="credit-card">Credit Card</option>
                  <option value="mortgage">Mortgage</option>
                  <option value="insurance">Insurance</option>
                  <option value="loan">Loan</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Payment Amount *</label>
                <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="99999.99"
                    value={billPayForm.amount}
                    onChange={(e) =>
                    setBillPayForm({ ...billPayForm, amount: e.target.value })
                    }
                    placeholder="0.00"
                    required
                    className="form-input"
                />
                <small>Enter the amount you want to pay</small>
                </div>

              <div className="form-group">
                <label>Payment Date *</label>
                <input
                    type="date"
                    value={billPayForm.paymentDate}
                    onChange={(e) =>
                    setBillPayForm({ ...billPayForm, paymentDate: e.target.value })
                    }
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="form-input"
                />
                <small>Select when you want this payment processed</small>
                </div>

              <div className="form-group">
                <label>Memo (Optional)</label>
                <textarea
                  value={billPayForm.memo}
                  onChange={(e) =>
                    setBillPayForm({ ...billPayForm, memo: e.target.value })
                  }
                  placeholder="Add a note"
                  rows="3"
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowBillPayModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Schedule Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Deposit Modal */}
      {showDepositModal && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Mobile Check Deposit</h2>
              <button
                className="close-btn"
                onClick={() => setShowDepositModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="deposit-form">
              <div className="form-group">
                <label>Deposit To Account *</label>
                <select
                    value={depositForm.accountId}
                    onChange={(e) =>
                    setDepositForm({ ...depositForm, accountId: e.target.value })
                    }
                    required
                    className="form-select"
                >
                    <option value="">-- Select Your Account --</option>
                    {accounts && accounts.length > 0 ? (
                      accounts.map((acc) => {
                        const accountId = acc._id || acc.id;
                        const accountName = acc.accountName || acc.accountType || 'Account';
                        const accountType = acc.accountType || 'N/A';
                        const balance = acc.balance?.available ?? acc.balance?.current ?? acc.balance ?? 0;
                        
                        return (
                          <option key={accountId} value={accountId}>
                            {accountName} ({accountType}) - {formatCurrency(balance)}
                          </option>
                        );
                      })
                    ) : (
                      <option value="" disabled>No accounts available</option>
                    )}
                </select>
                {accounts.length === 0 && (
                  <small style={{ color: '#dc2626', display: 'block', marginTop: '4px' }}>
                    ⚠️ No accounts found. Please refresh or create an account.
                  </small>
                )}
                </div>

                <div className="form-group">
                    <label>Check Amount *</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="10000"
                        value={depositForm.amount}
                        onChange={(e) =>
                        setDepositForm({ ...depositForm, amount: e.target.value })
                        }
                        placeholder="0.00"
                        required
                        className="form-input"
                    />
                    <small>Maximum $10,000 per mobile deposit</small>
                </div>

              <div className="form-group">
                <label>Check Number (Optional)</label>
                <input
                  type="text"
                  value={depositForm.checkNumber}
                  onChange={(e) =>
                    setDepositForm({ ...depositForm, checkNumber: e.target.value })
                  }
                  placeholder="Enter check number"
                />
              </div>

              <div className="form-group">
                <label>Front of Check Image *</label>
                <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(e) =>
                    setDepositForm({ ...depositForm, frontImage: e.target.files[0] })
                    }
                    required
                    className="form-input"
                />
                {depositForm.frontImage && (
                    <span className="file-name" style={{ 
                    display: 'block', 
                    marginTop: '8px', 
                    padding: '8px', 
                    background: '#ecfdf5', 
                    borderRadius: '4px',
                    fontSize: '13px',
                    color: '#065f46'
                    }}>
                    ✓ {depositForm.frontImage.name} ({(depositForm.frontImage.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                )}
                <small>JPG or PNG, max 5MB</small>
                </div>

              <div className="form-group">
                <label>Back of Check Image *</label>
                <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(e) =>
                    setDepositForm({ ...depositForm, backImage: e.target.files[0] })
                    }
                    required
                    className="form-input"
                />
                {depositForm.backImage && (
                    <span className="file-name" style={{ 
                    display: 'block', 
                    marginTop: '8px', 
                    padding: '8px', 
                    background: '#ecfdf5', 
                    borderRadius: '4px',
                    fontSize: '13px',
                    color: '#065f46'
                    }}>
                    ✓ {depositForm.backImage.name} ({(depositForm.backImage.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                )}
                <small>JPG or PNG, max 5MB (Must be endorsed)</small>
                </div>

              <div className="deposit-info">
                <p>📸 Tips for best results:</p>
                <ul>
                  <li>Use a dark background</li>
                  <li>Ensure all corners are visible</li>
                  <li>Avoid shadows and glare</li>
                  <li>Endorse the back of the check</li>
                </ul>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowDepositModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && !showTransferModal && !showBillPayModal && !showDepositModal && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
    </div>
  );
};

export default MobileBanking;