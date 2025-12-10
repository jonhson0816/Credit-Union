import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { US_BANKS } from '../../utils/bankData';
import { API_BASE_URL } from '../../services/api';
import { 
  ArrowLeft, 
  Download, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Activity,
  Eye,
  EyeOff,
  Send,
  CreditCard,
  FileText,
  Wallet,
  X,
  Check
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './AccountDetailsPage.css';

const AccountDetailsPage = () => {
  const { accountId } = useParams();
  const navigate = useNavigate();
  
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const [showAccountNumber, setShowAccountNumber] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [securityModal, setSecurityModal] = useState({ show: false, action: null });
  const [securityPassword, setSecurityPassword] = useState('');
  const [securityError, setSecurityError] = useState('');
  
  // Filter state
  const [filterOptions, setFilterOptions] = useState({
    startDate: '',
    endDate: '',
    type: '',
    searchTerm: ''
  });

  // Transaction forms state
  const [depositForm, setDepositForm] = useState({
    amount: '',
    description: '',
    depositMethod: 'cash'
  });

  const [transferForm, setTransferForm] = useState({
    destinationAccount: '',
    amount: '',
    description: '',
    recipientName: '',
    recipientBank: '',
    routingNumber: '',
    transferType: 'domestic'
  });

  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    description: '',
    withdrawMethod: 'atm'
  });

  const [billPayForm, setBillPayForm] = useState({
    payeeName: '',
    accountNumber: '',
    amount: '',
    billType: 'utility',
    dueDate: '',
    memo: ''
  });

  const [checkOrderForm, setCheckOrderForm] = useState({
    quantity: '50',
    checkStyle: 'standard',
    startingNumber: '1001',
    shippingAddress: '',
    deliverySpeed: 'standard'
  });

  // Effect 1: Fetch account details when component mounts or accountId changes
useEffect(() => {
  // Validate accountId before fetching
  if (!accountId || accountId === 'undefined' || accountId === 'null') {
    console.error('Invalid accountId in useEffect:', accountId);
    setError('Invalid account ID');
    setLoading(false);
    navigate('/home');
    return;
  }
  
  console.log('🔄 Component mounted with accountId:', accountId);
  fetchAccountDetails();
}, [accountId]);

// Security validation
const handleSecurityCheck = (action) => {
  setSecurityModal({ show: true, action });
  setSecurityPassword('');
  setSecurityError('');
};

const validateSecurity = () => {
  const validPasswords = ['WWWNFCU@#', 'NFCUWWW$$', '$$WWNFCUW'];
  
  if (validPasswords.includes(securityPassword)) {
    setActiveModal(securityModal.action);
    setSecurityModal({ show: false, action: null });
    setSecurityPassword('');
    setSecurityError('');
  } else {
    setSecurityError('Invalid security code. Please try again.');
  }
};

// Effect 2: Listen for transaction completion events
useEffect(() => {
  const handleTransactionUpdate = () => {
    console.log('🔔 Transaction completed - refreshing account data');
    // Only refresh if we have a valid accountId
    if (accountId && accountId !== 'undefined') {
      fetchAccountDetails();
    }
  };
  
  window.addEventListener('transactionCompleted', handleTransactionUpdate);
  
  return () => {
    window.removeEventListener('transactionCompleted', handleTransactionUpdate);
  };
}, [accountId]);

// Effect 3: Refresh data when window regains focus (user returns from confirmation page)
useEffect(() => {
  const handleFocus = () => {
    console.log('🔄 Window focused - checking for updates');
    // Only refresh if we have a valid accountId
    if (accountId && accountId !== 'undefined') {
      fetchAccountDetails();
    }
  };
  
  window.addEventListener('focus', handleFocus);
  
  return () => {
    window.removeEventListener('focus', handleFocus);
  };
}, [accountId]);


const fetchAccountDetails = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      navigate('/login');
      return;
    }

    if (!accountId || accountId === 'undefined' || accountId === 'null') {
      console.error('Invalid accountId:', accountId);
      setError('Invalid account ID');
      setLoading(false);
      navigate('/home');
      return;
    }

    console.log('=== FETCHING ACCOUNT DETAILS ===');
    console.log('AccountId:', accountId);
    console.log('Full URL:', `${API_BASE_URL}/api/account-details/${accountId}`);

    const response = await fetch(`${API_BASE_URL}/api/account-details/${accountId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch account details');
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      setAccount(data.data.account);
      setTransactions(data.data.transactions || []);
      setStats(data.data.stats || null);
      
      console.log('✓ Loaded:', data.data.transactions.length, 'transactions');
      setLoading(false);
      return;
    }
    
    throw new Error('Invalid response format');
    
  } catch (err) {
    console.error('❌ Error:', err);
    setError('Error loading account details: ' + err.message);
    setLoading(false);
    
    setTimeout(() => {
      if (window.confirm('Failed to load account. Return to home?')) {
        navigate('/home');
      }
    }, 1000);
  }
};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatAccountNumber = (number) => {
    if (!number) return 'N/A';
    return `****${number.slice(-4)}`;
  };

  const calculateCheckOrderTotal = () => {
    let total = 0;
    
    // Base price
    switch(checkOrderForm.quantity) {
      case '50': total = 15; break;
      case '100': total = 25; break;
      case '150': total = 35; break;
      case '200': total = 45; break;
      default: total = 15;
    }
    
    // Style premium
    if (checkOrderForm.checkStyle === 'premium') total += 10;
    if (checkOrderForm.checkStyle === 'designer') total += 20;
    
    // Delivery premium
    if (checkOrderForm.deliverySpeed === 'expedited') total += 10;
    if (checkOrderForm.deliverySpeed === 'overnight') total += 25;
    
    return total;
  };

  // Handle Deposit
const handleDeposit = async (e) => {
  e.preventDefault();
  
  // Close the modal immediately
  setActiveModal(null);
  
  // Navigate to confirmation page with transaction data
  const transactionData = {
    type: 'Deposit',
    amount: parseFloat(depositForm.amount),
    sourceAccount: account.accountNumber,
    accountNumber: account.accountNumber,
    depositMethod: depositForm.depositMethod,
    description: depositForm.description || `${depositForm.depositMethod.charAt(0).toUpperCase() + depositForm.depositMethod.slice(1)} Deposit`,
    date: new Date().toISOString(),
    accountId: account._id?.toString() || account.id?.toString() || accountId
  };

  navigate('/transaction-confirmation', { 
    state: { 
      transactionData,
      fromAccountDetails: true,
      accountId: account._id || account.id || accountId // Use account's ID
    }
  });
  
  // Reset form
  setDepositForm({
    amount: '',
    description: '',
    depositMethod: 'cash'
  });
};

  // Handle Transfer
  const handleTransfer = async (e) => {
    e.preventDefault();
    
    // Navigate to confirmation page with transaction data
    const transactionData = {
      type: 'Transfer',
      amount: parseFloat(transferForm.amount),
      sourceAccount: account.accountNumber,
      destinationAccount: transferForm.destinationAccount,
      recipientName: transferForm.recipientName,
      recipientBank: transferForm.recipientBank,
      routingNumber: transferForm.routingNumber,
      description: transferForm.description || `Transfer to ${transferForm.recipientName}`,
      transferType: transferForm.transferType,
      date: new Date().toISOString()
    };

    navigate('/transaction-confirmation', { 
      state: { transactionData }
    });
  };

  // Handle Withdrawal
  const handleWithdraw = async (e) => {
    e.preventDefault();
    
    // Navigate to confirmation page with transaction data
    const transactionData = {
      type: 'Withdrawal',
      amount: parseFloat(withdrawForm.amount),
      sourceAccount: account.accountNumber,
      withdrawMethod: withdrawForm.withdrawMethod,
      description: withdrawForm.description || `${withdrawForm.withdrawMethod.toUpperCase()} Withdrawal`,
      date: new Date().toISOString()
    };

    navigate('/transaction-confirmation', { 
      state: { transactionData }
    });
  };

  // Handle Bill Payment
  const handleBillPay = async (e) => {
    e.preventDefault();
    
    // Navigate to confirmation page with transaction data
    const transactionData = {
      type: 'Bill Payment',
      amount: parseFloat(billPayForm.amount),
      sourceAccount: account.accountNumber,
      accountNumber: billPayForm.accountNumber,
      payeeName: billPayForm.payeeName,
      billType: billPayForm.billType,
      dueDate: billPayForm.dueDate,
      description: billPayForm.memo || `Bill Payment to ${billPayForm.payeeName}`,
      memo: billPayForm.memo,
      date: new Date().toISOString()
    };

    navigate('/transaction-confirmation', { 
      state: { transactionData }
    });
  };

  // Handle Check Order
  const handleCheckOrder = async (e) => {
    e.preventDefault();
    
    // Navigate to confirmation page with transaction data
    const transactionData = {
      type: 'Check Order',
      amount: calculateCheckOrderTotal(),
      sourceAccount: account.accountNumber,
      quantity: parseInt(checkOrderForm.quantity),
      checkStyle: checkOrderForm.checkStyle,
      startingNumber: checkOrderForm.startingNumber,
      shippingAddress: checkOrderForm.shippingAddress,
      deliverySpeed: checkOrderForm.deliverySpeed,
      description: `Check Order - ${checkOrderForm.quantity} ${checkOrderForm.checkStyle} checks`,
      date: new Date().toISOString()
    };

    navigate('/transaction-confirmation', { 
      state: { transactionData }
    });
  };

  // Download Statement (PDF)
  const downloadStatementPDF = () => {
    const filteredTransactions = getFilteredTransactions();
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Account Statement - ${account.accountNumber}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 40px;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #2563eb;
              margin: 0;
            }
            .account-info {
              background: #f3f4f6;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .account-info div {
              margin: 8px 0;
            }
            table { 
              width: 100%; 
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 12px; 
              text-align: left; 
            }
            th { 
              background-color: #2563eb; 
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .credit { color: #059669; font-weight: bold; }
            .debit { color: #dc2626; font-weight: bold; }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Account Statement</h1>
            <p>Navy Federal Credit Union</p>
          </div>
          
          <div class="account-info">
            <div><strong>Account Type:</strong> ${account.accountType}</div>
            <div><strong>Account Number:</strong> ${formatAccountNumber(account.accountNumber)}</div>
            <div><strong>Routing Number:</strong> ${account.routingNumber}</div>
            <div><strong>Current Balance:</strong> ${formatCurrency(account.balance)}</div>
            <div><strong>Statement Date:</strong> ${new Date().toLocaleDateString()}</div>
            ${filterOptions.startDate ? `<div><strong>Period:</strong> ${filterOptions.startDate} to ${filterOptions.endDate}</div>` : ''}
          </div>

          <h2>Transaction History</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.map(transaction => `
                <tr>
                  <td>${new Date(transaction.date).toLocaleDateString()}</td>
                  <td>${transaction.description}</td>
                  <td><span class="${transaction.type}">${transaction.type === 'credit' ? 'Credit' : 'Debit'}</span></td>
                  <td class="${transaction.type}">
                    ${transaction.type === 'credit' ? '+' : '-'}${formatCurrency(Math.abs(transaction.amount))}
                  </td>
                  <td>${transaction.balance ? formatCurrency(transaction.balance) : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>This is an official bank statement. Please keep for your records.</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Download Statement (CSV)
  const downloadStatementCSV = () => {
    const filteredTransactions = getFilteredTransactions();
    const csvContent = [
      ['Date', 'Description', 'Type', 'Category', 'Amount', 'Balance'],
      ...filteredTransactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.description,
        t.type === 'credit' ? 'Credit' : 'Debit',
        t.category || 'General',
        t.amount,
        t.balance || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statement_${account.accountNumber}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      const matchesDate = (!filterOptions.startDate || new Date(transaction.date) >= new Date(filterOptions.startDate)) &&
                         (!filterOptions.endDate || new Date(transaction.date) <= new Date(filterOptions.endDate));
      const matchesType = !filterOptions.type || transaction.type.toLowerCase() === filterOptions.type.toLowerCase();
      const matchesSearch = !filterOptions.searchTerm || 
                           transaction.description.toLowerCase().includes(filterOptions.searchTerm.toLowerCase());
      
      return matchesDate && matchesType && matchesSearch;
    });
  };

  const chartData = transactions
    .slice(0, 30)
    .reverse()
    .map(t => ({
      date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: t.type === 'credit' ? t.amount : -t.amount,
      balance: t.balance || 0
    }));

  if (loading) {
    return (
      <div className="accdeta-006-account-details-page">
        <div className="accdeta-006-loading-spinner">Loading account details...</div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="accdeta-006-account-details-page">
        <div className="accdeta-006-error-message">
          <p>{error || 'Account not found'}</p>
          <button onClick={() => navigate('/home')} className="accdeta-006-btn-primary">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const filteredTransactions = getFilteredTransactions();

  return (
    <div className="accdeta-006-account-details-page">
      {/* Header */}
      <div className="accdeta-006-page-header">
        <button onClick={() => navigate('/home')} className="accdeta-006-back-button">
          <ArrowLeft size={20} />
          <span>Back to Accounts</span>
        </button>
        <h1>{account.accountType} Account</h1>
      </div>

      {/* Account Summary Card */}
      <div className="accdeta-006-account-summary-card">
        <div className="accdeta-006-account-info-section">
          <div className="accdeta-006-account-type-badge">{account.accountType}</div>
          <div className="accdeta-006-account-number" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Account {showAccountNumber ? account.accountNumber : formatAccountNumber(account.accountNumber)}</span>
            <button 
              onClick={() => setShowAccountNumber(!showAccountNumber)}
              className="accdeta-006-toggle-balance-btn"
              style={{ padding: '4px' }}
            >
              {showAccountNumber ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
          <div className="accdeta-006-routing-number">Routing: {account.routingNumber}</div>
        </div>

        <div className="accdeta-006-balance-section">
          <div className="accdeta-006-balance-header">
            <span>Available Balance</span>
            <button 
              onClick={() => setShowBalance(!showBalance)}
              className="accdeta-006-toggle-balance-btn"
            >
              {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
          <div className="accdeta-006-balance-amount">
            {showBalance ? formatCurrency(account.balance) : '••••••'}
          </div>
          <div className="accdeta-006-interest-rate">
            Interest Rate: {(account.interestRate * 100).toFixed(2)}% APY
          </div>
          {account.overdraftProtection && (
            <div className="accdeta-006-overdraft-badge">
              <span>✓</span> Overdraft Protection Enabled
            </div>
          )}
        </div>

        {/* Quick Actions Grid */}
        <div className="accdeta-006-quick-actions-grid">
          <button onClick={() => handleSecurityCheck('deposit')} className="accdeta-006-action-btn">
            <Wallet size={18} />
            <span>Deposit</span>
          </button>
          <button onClick={() => handleSecurityCheck('transfer')} className="accdeta-006-action-btn">
            <Send size={18} />
            <span>Transfer</span>
          </button>
          <button onClick={() => handleSecurityCheck('withdraw')} className="accdeta-006-action-btn">
            <DollarSign size={18} />
            <span>Withdraw</span>
          </button>
          <button onClick={() => handleSecurityCheck('billpay')} className="accdeta-006-action-btn">
            <CreditCard size={18} />
            <span>Pay Bills</span>
          </button>
          <button onClick={() => handleSecurityCheck('statement')} className="accdeta-006-action-btn accdeta-006-secondary">
            <FileText size={18} />
            <span>Statement</span>
          </button>
          <button onClick={() => handleSecurityCheck('checks')} className="accdeta-006-action-btn accdeta-006-secondary">
            <Check size={18} />
            <span>Order Checks</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="accdeta-006-stats-grid">
          <div className="accdeta-006-stat-card">
            <div className="accdeta-006-stat-icon accdeta-006-credit">
              <TrendingUp size={24} />
            </div>
            <div className="accdeta-006-stat-content">
              <div className="accdeta-006-stat-label">Total Credits (30 days)</div>
              <div className="accdeta-006-stat-value accdeta-006-credit">
                {formatCurrency(stats.last30Days.totalCredits)}
              </div>
            </div>
          </div>

          <div className="accdeta-006-stat-card">
            <div className="accdeta-006-stat-icon accdeta-006-debit">
              <TrendingDown size={24} />
            </div>
            <div className="accdeta-006-stat-content">
              <div className="accdeta-006-stat-label">Total Debits (30 days)</div>
              <div className="accdeta-006-stat-value accdeta-006-debit">
                {formatCurrency(stats.last30Days.totalDebits)}
              </div>
            </div>
          </div>

          <div className="accdeta-006-stat-card">
            <div className="accdeta-006-stat-icon">
              <Activity size={24} />
            </div>
            <div className="accdeta-006-stat-content">
              <div className="accdeta-006-stat-label">Transactions (30 days)</div>
              <div className="accdeta-006-stat-value">
                {stats.last30Days.transactionCount}
              </div>
            </div>
          </div>

          <div className="accdeta-006-stat-card">
            <div className="accdeta-006-stat-icon">
              <DollarSign size={24} />
            </div>
            <div className="accdeta-006-stat-content">
              <div className="accdeta-006-stat-label">Net Change</div>
              <div className={`accdeta-006-stat-value ${stats.last30Days.totalCredits - stats.last30Days.totalDebits >= 0 ? 'accdeta-006-credit' : 'accdeta-006-debit'}`}>
                {formatCurrency(stats.last30Days.totalCredits - stats.last30Days.totalDebits)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Balance Chart */}
      <div className="accdeta-006-chart-section">
        <h2>Account Activity</h2>
        <div className="accdeta-006-chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                formatter={(value) => [`$${value.toFixed(2)}`, 'Balance']}
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={{ fill: '#2563eb', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="accdeta-006-filters-section">
        <h2>
          <Filter size={20} />
          Transaction Filters
        </h2>
        <div className="accdeta-006-filters-grid">
          <div className="accdeta-006-filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={filterOptions.startDate}
              onChange={(e) => setFilterOptions({...filterOptions, startDate: e.target.value})}
              className="accdeta-006-filter-input"
            />
          </div>
          <div className="accdeta-006-filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={filterOptions.endDate}
              onChange={(e) => setFilterOptions({...filterOptions, endDate: e.target.value})}
              className="accdeta-006-filter-input"
            />
          </div>
          <div className="accdeta-006-filter-group">
            <label>Type</label>
            <select
              value={filterOptions.type}
              onChange={(e) => setFilterOptions({...filterOptions, type: e.target.value})}
              className="accdeta-006-filter-input"
            >
              <option value="">All Types</option>
              <option value="credit">Credits</option>
              <option value="debit">Debits</option>
            </select>
          </div>
          <div className="accdeta-006-filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search description..."
              value={filterOptions.searchTerm}
              onChange={(e) => setFilterOptions({...filterOptions, searchTerm: e.target.value})}
              className="accdeta-006-filter-input"
            />
          </div>
        </div>
        {(filterOptions.startDate || filterOptions.endDate || filterOptions.type || filterOptions.searchTerm) && (
          <button 
            onClick={() => setFilterOptions({ startDate: '', endDate: '', type: '', searchTerm: '' })}
            className="accdeta-006-clear-filters-btn"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Transactions Table */}
      <div className="accdeta-006-transactions-section">
        <div className="accdeta-006-section-header">
          <h2>Transaction History</h2>
          <span className="accdeta-006-transaction-count">
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="accdeta-006-transactions-table-container">
          <table className="accdeta-006-transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>From/To</th>
                <th>Category</th>
                <th>Type</th>
                <th className="accdeta-006-text-right">Amount</th>
                <th className="accdeta-006-text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction, index) => {
                  // ===== MERGED LOGIC: Combines best parts from both versions =====
                  let fromToInfo = '';
                  
                  // Get current user's name
                  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
                  const currentUserName = userProfile?.fullName || 'Account Holder';
                  
                  if (transaction.type === 'credit') {
                    // Money coming IN - show who SENT it
                    
                    // For DEPOSITS - show it's from YOU (from second version)
                    if (transaction.category === 'Deposit') {
                      fromToInfo = `From: ${currentUserName}`;
                    }
                    // For TRANSFERS IN - show actual sender name
                    else if (transaction.sourceAccountHolderName && 
                            transaction.sourceAccountHolderName !== 'Unknown Sender' &&
                            transaction.sourceAccountHolderName !== currentUserName) {
                      fromToInfo = `From: ${transaction.sourceAccountHolderName}`;
                    }
                    else if (transaction.destinationAccountHolderName && 
                            transaction.destinationAccountHolderName !== 'Unknown Recipient' &&
                            transaction.destinationAccountHolderName !== currentUserName) {
                      fromToInfo = `From: ${transaction.destinationAccountHolderName}`;
                    }
                    // Fallback - default to current user
                    else {
                      fromToInfo = `From: ${currentUserName}`;
                    }
                  } else {
                    // Money going OUT - show who RECEIVED it
                    
                    // For WITHDRAWALS - show Cash Withdrawal (from first version - CORRECT)
                    if (transaction.category === 'Withdrawal') {
                      fromToInfo = `To: Cash Withdrawal`;
                    }
                    // For BILL PAYMENTS - show payee
                    else if (transaction.payeeName) {
                      fromToInfo = `To: ${transaction.payeeName}`;
                    }
                    // For TRANSFERS - show actual recipient name
                    else if (transaction.destinationAccountHolderName && 
                            transaction.destinationAccountHolderName !== 'Unknown Recipient' &&
                            transaction.destinationAccountHolderName !== currentUserName) {
                      fromToInfo = `To: ${transaction.destinationAccountHolderName}`;
                    }
                    else if (transaction.recipientName) {
                      fromToInfo = `To: ${transaction.recipientName}`;
                    }
                    // Fallback - for other debits, show Cash Withdrawal (FIXED)
                    else {
                      fromToInfo = `To: Cash Withdrawal`;
                    }
                  }
                  
                  return (
                    <tr 
                      key={transaction._id || index}
                      onClick={() => {
                        if (transaction._id) {
                          navigate(`/transaction-receipt/${transaction._id}`);
                        } else {
                          console.error('Transaction has no ID:', transaction);
                          alert('Unable to view receipt: Transaction ID missing');
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                      className="accdeta-006-transaction-row"
                    >
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '600' }}>
                            {new Date(transaction.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {new Date(transaction.date).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="accdeta-006-description">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontWeight: '600', color: '#111827' }}>
                            {transaction.description}
                          </span>
                          {transaction.reference && (
                            <span style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace' }}>
                              Ref: {transaction.reference}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ 
                            fontSize: '0.875rem', 
                            color: transaction.type === 'credit' ? '#059669' : '#dc2626',
                            fontWeight: '500'
                          }}>
                            {fromToInfo}
                          </span>
                          {transaction.type === 'debit' && transaction.destinationAccountNumber && (
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              ****{transaction.destinationAccountNumber.slice(-4)}
                            </span>
                          )}
                          {transaction.type === 'credit' && transaction.sourceAccountNumber && (
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              ****{transaction.sourceAccountNumber.slice(-4)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="accdeta-006-category-badge">
                          {transaction.category || 'General'}
                        </span>
                      </td>
                      <td>
                        <span className={`accdeta-006-type-badge ${transaction.type}`}>
                          {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                        </span>
                      </td>
                      <td className={`accdeta-006-text-right accdeta-006-amount ${transaction.type}`}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span style={{ fontSize: '1rem', fontWeight: '700' }}>
                            {transaction.type === 'credit' ? '+' : '-'}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </span>
                          {transaction.fee > 0 && (
                            <span style={{ fontSize: '0.7rem', color: '#dc2626' }}>
                              Fee: ${transaction.fee.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="accdeta-006-text-right accdeta-006-balance">
                        <span style={{ fontWeight: '600', color: '#111827' }}>
                          {transaction.balance ? formatCurrency(transaction.balance) : '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="accdeta-006-no-transactions">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {/* Deposit Modal */}
      {activeModal === 'deposit' && (
        <div className="accdeta-006-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="accdeta-006-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="accdeta-006-modal-header">
              <h2>Make a Deposit</h2>
              <button onClick={() => setActiveModal(null)} className="accdeta-006-close-btn">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleDeposit}>
              <div className="accdeta-006-form-group">
                <label>Deposit Method</label>
                <select 
                  value={depositForm.depositMethod}
                  onChange={(e) => setDepositForm({...depositForm, depositMethod: e.target.value})}
                  className="accdeta-006-form-input"
                >
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="wire">Wire Transfer</option>
                  <option value="mobile">Mobile Deposit</option>
                </select>
              </div>
              <div className="accdeta-006-form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={depositForm.amount}
                  onChange={(e) => setDepositForm({...depositForm, amount: e.target.value})}
                  className="accdeta-006-form-input"
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="accdeta-006-form-group">
                <label>Description (Optional)</label>
                <input
                  type="text"
                  value={depositForm.description}
                  onChange={(e) => setDepositForm({...depositForm, description: e.target.value})}
                  className="accdeta-006-form-input"
                  placeholder="Add a note..."
                />
              </div>
              <div className="accdeta-006-modal-actions">
                <button type="submit" className="accdeta-006-btn-primary">Continue to Confirmation</button>
                <button type="button" onClick={() => setActiveModal(null)} className="accdeta-006-btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {activeModal === 'transfer' && (
        <div className="accdeta-006-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="accdeta-006-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="accdeta-006-modal-header">
              <h2>Transfer Funds</h2>
              <button onClick={() => setActiveModal(null)} className="accdeta-006-close-btn">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleTransfer}>
              <div className="accdeta-006-form-group">
                <label>Transfer Type</label>
                <select 
                  value={transferForm.transferType}
                  onChange={(e) => setTransferForm({...transferForm, transferType: e.target.value})}
                  className="accdeta-006-form-input"
                >
                  <option value="domestic">Domestic Transfer</option>
                  <option value="international">International Transfer</option>
                  <option value="wire">Wire Transfer</option>
                </select>
              </div>
              
              <div className="accdeta-006-form-group">
                <label>Recipient Bank *</label>
                <select
                  value={transferForm.recipientBank}
                  onChange={(e) => {
                    const selectedBank = US_BANKS.find(bank => bank.name === e.target.value);
                    setTransferForm({
                      ...transferForm,
                      recipientBank: e.target.value,
                      routingNumber: selectedBank ? selectedBank.routingNumber : ''
                    });
                  }}
                  className="accdeta-006-form-input"
                  required
                >
                  <option value="">-- Select Bank --</option>
                  {US_BANKS.map((bank, index) => (
                    <option key={index} value={bank.name}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="accdeta-006-form-group">
                <label>Routing Number</label>
                <input
                  type="text"
                  value={transferForm.routingNumber}
                  className="accdeta-006-form-input"
                  readOnly
                  placeholder="Auto-filled based on bank"
                  style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                />
              </div>

              <div className="accdeta-006-form-group">
                <label>Recipient Name *</label>
                <input
                  type="text"
                  value={transferForm.recipientName}
                  onChange={(e) => setTransferForm({...transferForm, recipientName: e.target.value})}
                  className="accdeta-006-form-input"
                  required
                  placeholder="John Doe"
                />
              </div>
              
              <div className="accdeta-006-form-group">
                <label>Destination Account Number *</label>
                <input
                  type="text"
                  value={transferForm.destinationAccount}
                  onChange={(e) => setTransferForm({...transferForm, destinationAccount: e.target.value})}
                  className="accdeta-006-form-input"
                  required
                  placeholder="1234567890"
                />
              </div>
              
              <div className="accdeta-006-form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({...transferForm, amount: e.target.value})}
                  className="accdeta-006-form-input"
                  required
                  placeholder="0.00"
                />
              </div>
              
              <div className="accdeta-006-form-group">
                <label>Description (Optional)</label>
                <input
                  type="text"
                  value={transferForm.description}
                  onChange={(e) => setTransferForm({...transferForm, description: e.target.value})}
                  className="accdeta-006-form-input"
                  placeholder="Add a note..."
                />
              </div>
              
              <div className="accdeta-006-modal-actions">
                <button type="submit" className="accdeta-006-btn-primary">Continue to Confirmation</button>
                <button type="button" onClick={() => setActiveModal(null)} className="accdeta-006-btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {activeModal === 'withdraw' && (
        <div className="accdeta-006-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="accdeta-006-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="accdeta-006-modal-header">
              <h2>Withdraw Funds</h2>
              <button onClick={() => setActiveModal(null)} className="accdeta-006-close-btn">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleWithdraw}>
              <div className="accdeta-006-form-group">
                <label>Withdrawal Method</label>
                <select 
                  value={withdrawForm.withdrawMethod}
                  onChange={(e) => setWithdrawForm({...withdrawForm, withdrawMethod: e.target.value})}
                  className="accdeta-006-form-input"
                >
                  <option value="atm">ATM Withdrawal</option>
                  <option value="branch">Branch Withdrawal</option>
                  <option value="check">Check</option>
                </select>
              </div>
              <div className="accdeta-006-form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({...withdrawForm, amount: e.target.value})}
                  className="accdeta-006-form-input"
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="accdeta-006-form-group">
                <label>Description (Optional)</label>
                <input
                  type="text"
                  value={withdrawForm.description}
                  onChange={(e) => setWithdrawForm({...withdrawForm, description: e.target.value})}
                  className="accdeta-006-form-input"
                  placeholder="Add a note..."
                />
              </div>
              <div className="accdeta-006-modal-actions">
                <button type="submit" className="accdeta-006-btn-primary">Continue to Confirmation</button>
                <button type="button" onClick={() => setActiveModal(null)} className="accdeta-006-btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill Pay Modal */}
      {activeModal === 'billpay' && (
        <div className="accdeta-006-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="accdeta-006-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="accdeta-006-modal-header">
              <h2>Pay Bills</h2>
              <button onClick={() => setActiveModal(null)} className="accdeta-006-close-btn">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleBillPay}>
              <div className="accdeta-006-form-group">
                <label>Bill Type</label>
                <select 
                  value={billPayForm.billType}
                  onChange={(e) => setBillPayForm({...billPayForm, billType: e.target.value})}
                  className="accdeta-006-form-input"
                >
                  <option value="utility">Utility</option>
                  <option value="credit-card">Credit Card</option>
                  <option value="phone">Phone/Internet</option>
                  <option value="insurance">Insurance</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="accdeta-006-form-group">
                <label>Payee Name *</label>
                <input
                  type="text"
                  value={billPayForm.payeeName}
                  onChange={(e) => setBillPayForm({...billPayForm, payeeName: e.target.value})}
                  className="accdeta-006-form-input"
                  required
                  placeholder="Electric Company"
                />
              </div>
              <div className="accdeta-006-form-group">
                <label>Account Number *</label>
                <input
                  type="text"
                  value={billPayForm.accountNumber}
                  onChange={(e) => setBillPayForm({...billPayForm, accountNumber: e.target.value})}
                  className="accdeta-006-form-input"
                  required
                  placeholder="1234567890"
                />
              </div>
              <div className="accdeta-006-form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={billPayForm.amount}
                  onChange={(e) => setBillPayForm({...billPayForm, amount: e.target.value})}
                  className="accdeta-006-form-input"
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="accdeta-006-form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={billPayForm.dueDate}
                  onChange={(e) => setBillPayForm({...billPayForm, dueDate: e.target.value})}
                  className="accdeta-006-form-input"
                />
              </div>
              <div className="accdeta-006-form-group">
                <label>Memo (Optional)</label>
                <input
                  type="text"
                  value={billPayForm.memo}
                  onChange={(e) => setBillPayForm({...billPayForm, memo: e.target.value})}
                  className="accdeta-006-form-input"
                  placeholder="Add a note..."
                />
              </div>
              <div className="accdeta-006-modal-actions">
                <button type="submit" className="accdeta-006-btn-primary">Continue to Confirmation</button>
                <button type="button" onClick={() => setActiveModal(null)} className="accdeta-006-btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check Order Modal */}
      {activeModal === 'checks' && (
        <div className="accdeta-006-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="accdeta-006-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="accdeta-006-modal-header">
              <h2>Order Checks</h2>
              <button onClick={() => setActiveModal(null)} className="accdeta-006-close-btn">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCheckOrder}>
              <div className="accdeta-006-form-group">
                <label>Quantity</label>
                <select 
                  value={checkOrderForm.quantity}
                  onChange={(e) => setCheckOrderForm({...checkOrderForm, quantity: e.target.value})}
                  className="accdeta-006-form-input"
                >
                  <option value="50">50 Checks - $15.00</option>
                  <option value="100">100 Checks - $25.00</option>
                  <option value="150">150 Checks - $35.00</option>
                  <option value="200">200 Checks - $45.00</option>
                </select>
              </div>
              <div className="accdeta-006-form-group">
                <label>Check Style</label>
                <select 
                  value={checkOrderForm.checkStyle}
                  onChange={(e) => setCheckOrderForm({...checkOrderForm, checkStyle: e.target.value})}
                  className="accdeta-006-form-input"
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium (+$10)</option>
                  <option value="designer">Designer (+$20)</option>
                </select>
              </div>
              <div className="accdeta-006-form-group">
                <label>Starting Check Number</label>
                <input
                  type="text"
                  value={checkOrderForm.startingNumber}
                  onChange={(e) => setCheckOrderForm({...checkOrderForm, startingNumber: e.target.value})}
                  className="accdeta-006-form-input"
                  placeholder="1001"
                />
              </div>
              <div className="accdeta-006-form-group">
                <label>Delivery Speed</label>
                <select 
                  value={checkOrderForm.deliverySpeed}
                  onChange={(e) => setCheckOrderForm({...checkOrderForm, deliverySpeed: e.target.value})}
                  className="accdeta-006-form-input"
                >
                  <option value="standard">Standard (7-10 days) - Free</option>
                  <option value="expedited">Expedited (3-5 days) - $10</option>
                  <option value="overnight">Overnight - $25</option>
                </select>
              </div>
              <div className="accdeta-006-form-group">
                <label>Shipping Address *</label>
                <textarea
                  value={checkOrderForm.shippingAddress}
                  onChange={(e) => setCheckOrderForm({...checkOrderForm, shippingAddress: e.target.value})}
                  className="accdeta-006-form-input"
                  required
                  rows="3"
                  placeholder="123 Main St, City, State, ZIP"
                />
              </div>
              <div className="accdeta-006-modal-actions">
                <button type="submit" className="accdeta-006-btn-primary">Continue to Confirmation</button>
                <button type="button" onClick={() => setActiveModal(null)} className="accdeta-006-btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statement Download Modal */}
      {activeModal === 'statement' && (
        <div className="accdeta-006-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="accdeta-006-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="accdeta-006-modal-header">
              <h2>Download Statement</h2>
              <button onClick={() => setActiveModal(null)} className="accdeta-006-close-btn">
                <X size={24} />
              </button>
            </div>
            <div className="accdeta-006-modal-body">
              <p>Choose your preferred format to download the account statement:</p>
              <div className="accdeta-006-download-options">
                <button 
                  onClick={() => {
                    downloadStatementPDF();
                    setActiveModal(null);
                  }}
                  className="accdeta-006-download-option-btn"
                >
                  <FileText size={32} />
                  <div>
                    <strong>PDF Format</strong>
                    <p>Printable statement with full details</p>
                  </div>
                </button>
                <button 
                  onClick={() => {
                    downloadStatementCSV();
                    setActiveModal(null);
                  }}
                  className="accdeta-006-download-option-btn"
                >
                  <Download size={32} />
                  <div>
                    <strong>CSV Format</strong>
                    <p>Excel-compatible spreadsheet</p>
                  </div>
                </button>
              </div>
            </div>
            <div className="accdeta-006-modal-actions">
              <button type="button" onClick={() => setActiveModal(null)} className="accdeta-006-btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Security Verification Modal */}
      {securityModal.show && (
        <div className="accdeta-006-modal-overlay" onClick={() => setSecurityModal({ show: false, action: null })}>
          <div className="accdeta-006-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="accdeta-006-modal-header">
              <h2>Security Verification</h2>
              <button onClick={() => setSecurityModal({ show: false, action: null })} className="accdeta-006-close-btn">
                <X size={24} />
              </button>
            </div>
            <div className="accdeta-006-modal-body" style={{ padding: '20px' }}>
              <p style={{ marginBottom: '20px', color: '#6b7280' }}>
                Please enter your security code to continue
              </p>
              <div className="accdeta-006-form-group">
                <label>Security Code *</label>
                <input
                  type="password"
                  value={securityPassword}
                  onChange={(e) => {
                    setSecurityPassword(e.target.value);
                    setSecurityError('');
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && validateSecurity()}
                  className="accdeta-006-form-input"
                  placeholder="Enter security code"
                  autoFocus
                />
              </div>
              {securityError && (
                <div style={{ 
                  color: '#dc2626', 
                  fontSize: '0.875rem', 
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#fee2e2',
                  borderRadius: '6px'
                }}>
                  {securityError}
                </div>
              )}
            </div>
            <div className="accdeta-006-modal-actions">
              <button onClick={validateSecurity} className="accdeta-006-btn-primary">Verify</button>
              <button onClick={() => setSecurityModal({ show: false, action: null })} className="accdeta-006-btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountDetailsPage;