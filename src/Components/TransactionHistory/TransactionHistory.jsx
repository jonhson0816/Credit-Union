import React, { useState, useMemo, useEffect } from 'react';
import { useNavyFederal } from '../../Context/NavyFederalContext';
import { format, subMonths } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Search, Filter, X, Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import './TransactionHistory.css';

const TransactionHistory = () => {
  const {
    transactions,
    accounts,
    fetchTransactions,
    currentUser,
    isLoading: contextLoading
  } = useNavyFederal() || {};

  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'descending'
  });
  const [showFilters, setShowFilters] = useState(true);

  // Ensure transactions and accounts are always arrays
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeAccounts = Array.isArray(accounts) ? accounts : [];

  // Fetch transactions on mount
  // Fetch transactions on mount ONLY
useEffect(() => {
  const fetchData = async () => {
    // Don't fetch if already loading or if we already have transactions
    if (contextLoading || (safeTransactions.length > 0 && !error)) {
      setIsLoading(false);
      return;
    }

    if (!fetchTransactions) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await fetchTransactions();
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      if (error.response?.status === 429) {
        setError('Rate limit exceeded. Please wait a moment before refreshing.');
      } else {
        setError(error.message || 'Failed to fetch transactions');
      }
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Empty dependency array - only run once on mount

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return safeTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date || transaction.createdAt);
      const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
      const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

      const dateInRange = (!startDate || transactionDate >= startDate) &&
        (!endDate || transactionDate <= endDate);

      const matchesAccount = selectedAccount === 'all' || 
        transaction.accountId === selectedAccount;

      const transactionType = transaction.type?.toLowerCase();
      const matchesType = filter === 'all' ||
        (filter === 'credit' && transactionType === 'credit') ||
        (filter === 'debit' && transactionType === 'debit');

      const matchesSearch = !searchTerm ||
        transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.amount?.toString().includes(searchTerm) ||
        transaction.category?.toLowerCase().includes(searchTerm.toLowerCase());

      return dateInRange && matchesAccount && matchesType && matchesSearch;
    });
  }, [safeTransactions, dateRange, selectedAccount, filter, searchTerm]);

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'date') {
        aValue = new Date(a.date || a.createdAt);
        bValue = new Date(b.date || b.createdAt);
      }

      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [filteredTransactions, sortConfig]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    return filteredTransactions.reduce((acc, transaction) => {
      const transactionType = transaction.type?.toLowerCase();
      if (transactionType === 'credit') {
        acc.totalCredits += transaction.amount;
        acc.creditCount += 1;
      } else if (transactionType === 'debit') {
        acc.totalDebits += transaction.amount;
        acc.debitCount += 1;
      }
      return acc;
    }, { totalCredits: 0, totalDebits: 0, creditCount: 0, debitCount: 0 });
  }, [filteredTransactions]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const dailyTotals = filteredTransactions.reduce((acc, transaction) => {
      const date = format(new Date(transaction.date || transaction.createdAt), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { date, credits: 0, debits: 0, net: 0 };
      }
      const transactionType = transaction.type?.toLowerCase();
      if (transactionType === 'credit') {
        acc[date].credits += transaction.amount;
        acc[date].net += transaction.amount;
      } else {
        acc[date].debits += transaction.amount;
        acc[date].net -= transaction.amount;
      }
      return acc;
    }, {});

    return Object.values(dailyTotals).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredTransactions]);

  // Handle CSV export
  const exportToCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Balance', 'Account', 'Status'];
    const csvData = sortedTransactions.map(t => {
      const account = safeAccounts.find(a => a._id === t.accountId);
      return [
        format(new Date(t.date || t.createdAt), 'MM/dd/yyyy'),
        `"${t.description}"`,
        t.category || 'General',
        t.type?.toLowerCase() === 'credit' ? 'Credit' : 'Debit',
        t.amount.toFixed(2),
        t.balance?.toFixed(2) || '',
        account ? `${account.accountType} (*${account.accountNumber.slice(-4)})` : 'Unknown',
        t.status || 'completed'
      ];
    });

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `navy-federal-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Handle PDF export
  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Navy Federal Transaction History - ${format(new Date(), 'MM/dd/yyyy')}</title>
          <style>
            body { font-family: 'Open Sans', Arial, sans-serif; padding: 40px; color: #003865; }
            .header { text-align: center; border-bottom: 3px solid #003865; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #003865; margin: 0; font-size: 28px; }
            .header .logo { color: #C8102E; font-weight: bold; margin-bottom: 10px; }
            .summary { background: #F5F5F5; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #003865; }
            .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
            .summary-item { text-align: center; }
            .summary-label { font-size: 12px; color: #666; margin-bottom: 5px; text-transform: uppercase; }
            .summary-value { font-size: 24px; font-weight: bold; }
            .credits { color: #1B7E3D; }
            .debits { color: #C8102E; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 14px; }
            th { background-color: #003865; color: white; font-weight: 600; }
            tr:nth-child(even) { background-color: #F9F9F9; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 2px solid #003865; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">NAVY FEDERAL CREDIT UNION</div>
            <h1>Transaction History</h1>
            <p>${currentUser?.firstName || ''} ${currentUser?.lastName || ''}</p>
            <p>Period: ${dateRange.startDate} to ${dateRange.endDate}</p>
          </div>
          
          <div class="summary">
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-label">Total Credits</div>
                <div class="summary-value credits">$${summary.totalCredits.toFixed(2)}</div>
                <div class="summary-label">${summary.creditCount} transactions</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Total Debits</div>
                <div class="summary-value debits">$${summary.totalDebits.toFixed(2)}</div>
                <div class="summary-label">${summary.debitCount} transactions</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Net Change</div>
                <div class="summary-value">${(summary.totalCredits - summary.totalDebits >= 0 ? '+' : '')}$${(summary.totalCredits - summary.totalDebits).toFixed(2)}</div>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Balance</th>
                <th>Account</th>
              </tr>
            </thead>
            <tbody>
              ${sortedTransactions.map(transaction => {
                const account = safeAccounts.find(a => a._id === transaction.accountId);
                const transactionType = transaction.type?.toLowerCase();
                return `
                  <tr>
                    <td>${format(new Date(transaction.date || transaction.createdAt), 'MM/dd/yyyy')}</td>
                    <td>${transaction.description}</td>
                    <td>${transaction.category || 'General'}</td>
                    <td class="${transactionType}">${transactionType === 'credit' ? 'Credit' : 'Debit'}</td>
                    <td class="${transactionType}">
                      ${transactionType === 'credit' ? '+' : '-'}$${transaction.amount.toFixed(2)}
                    </td>
                    <td>${transaction.balance ? '$' + transaction.balance.toFixed(2) : '-'}</td>
                    <td>${account ? `${account.accountType} (*${account.accountNumber.slice(-4)})` : 'Unknown'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p><strong>Navy Federal Credit Union</strong></p>
            <p>Generated on ${format(new Date(), 'MM/dd/yyyy hh:mm a')}</p>
            <p>Total Transactions: ${sortedTransactions.length}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilter('all');
    setSearchTerm('');
    setSelectedAccount('all');
    setDateRange({
      startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd')
    });
  };

  if (isLoading || contextLoading) {
    return (
      <div className="nfcu-transaction-history">
        <div className="nfcu-transaction-card">
          <div className="nfcu-card-header">
            <h2 className="nfcu-card-title">Transaction History</h2>
          </div>
          <div className="nfcu-card-content">
            <div className="nfcu-loading-spinner">
              <div className="nfcu-spinner"></div>
              <p>Loading transactions...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nfcu-transaction-history">
        <div className="nfcu-transaction-card">
          <div className="nfcu-card-header">
            <h2 className="nfcu-card-title">Transaction History</h2>
          </div>
          <div className="nfcu-card-content">
            <div className="nfcu-error-message">
              <p>{error}</p>
              <button className="nfcu-btn-primary" onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nfcu-transaction-history">
      <div className="nfcu-transaction-card">
        {/* Header */}
        <div className="nfcu-card-header">
          <div className="nfcu-header-left">
            <h2 className="nfcu-card-title">Transaction History</h2>
            <p className="nfcu-transaction-count">
              Showing {sortedTransactions.length} of {safeTransactions.length} transactions
            </p>
          </div>
          <div className="nfcu-header-actions">
            <button 
              className="nfcu-btn-secondary" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
            <button className="nfcu-btn-secondary" onClick={exportToCSV}>
              <Download size={16} />
              Export CSV
            </button>
            <button className="nfcu-btn-primary" onClick={exportToPDF}>
              <Download size={16} />
              Export PDF
            </button>
          </div>
        </div>

        <div className="nfcu-card-content">
          {/* Summary Cards */}
          <div className="nfcu-summary-section">
            <div className="nfcu-summary-card nfcu-credit-card">
              <div className="nfcu-summary-icon">
                <TrendingUp size={24} />
              </div>
              <div className="nfcu-summary-details">
                <span className="nfcu-summary-label">Total Credits</span>
                <span className="nfcu-summary-value">${summary.totalCredits.toFixed(2)}</span>
                <span className="nfcu-summary-count">{summary.creditCount} transaction{summary.creditCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
            
            <div className="nfcu-summary-card nfcu-debit-card">
              <div className="nfcu-summary-icon">
                <TrendingDown size={24} />
              </div>
              <div className="nfcu-summary-details">
                <span className="nfcu-summary-label">Total Debits</span>
                <span className="nfcu-summary-value">${summary.totalDebits.toFixed(2)}</span>
                <span className="nfcu-summary-count">{summary.debitCount} transaction{summary.debitCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
            
            <div className={`nfcu-summary-card ${summary.totalCredits - summary.totalDebits >= 0 ? 'nfcu-positive-card' : 'nfcu-negative-card'}`}>
              <div className="nfcu-summary-icon">
                <DollarSign size={24} />
              </div>
              <div className="nfcu-summary-details">
                <span className="nfcu-summary-label">Net Change</span>
                <span className="nfcu-summary-value">
                  {summary.totalCredits - summary.totalDebits >= 0 ? '+' : ''}${(summary.totalCredits - summary.totalDebits).toFixed(2)}
                </span>
                <span className="nfcu-summary-count">Selected period</span>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <div className="nfcu-filters-section">
              <div className="nfcu-filters-grid">
                <div className="nfcu-filter-group">
                  <label className="nfcu-filter-label">
                    <Calendar size={14} />
                    Account
                  </label>
                  <select
                    className="nfcu-filter-input"
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                  >
                    <option value="all">All Accounts</option>
                    {safeAccounts.map(account => (
                      <option key={account._id} value={account._id}>
                        {account.accountType} (*{account.accountNumber.slice(-4)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="nfcu-filter-group">
                  <label className="nfcu-filter-label">Transaction Type</label>
                  <select
                    className="nfcu-filter-input"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All Transactions</option>
                    <option value="credit">Credits Only</option>
                    <option value="debit">Debits Only</option>
                  </select>
                </div>

                <div className="nfcu-filter-group">
                  <label className="nfcu-filter-label">Start Date</label>
                  <input
                    type="date"
                    className="nfcu-filter-input"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div className="nfcu-filter-group">
                  <label className="nfcu-filter-label">End Date</label>
                  <input
                    type="date"
                    className="nfcu-filter-input"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>

                <div className="nfcu-filter-group nfcu-search-group">
                  <label className="nfcu-filter-label">Search</label>
                  <div className="nfcu-search-container">
                    <Search className="nfcu-search-icon" size={16} />
                    <input
                      type="text"
                      className="nfcu-filter-input nfcu-search-input"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button className="nfcu-clear-search" onClick={() => setSearchTerm('')}>
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {(filter !== 'all' || searchTerm || selectedAccount !== 'all') && (
                  <div className="nfcu-filter-group">
                    <label className="nfcu-filter-label">&nbsp;</label>
                    <button className="nfcu-btn-clear-filters" onClick={clearFilters}>
                      <X size={16} />
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chart Section */}
          {chartData.length > 0 && (
            <div className="nfcu-chart-section">
              <h3 className="nfcu-chart-title">Daily Transaction Flow</h3>
              <div className="nfcu-chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), 'MM/dd')}
                      stroke="#003865"
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${value}`}
                      stroke="#003865"
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        const labels = { net: 'Net', credits: 'Credits', debits: 'Debits' };
                        return [`$${value.toFixed(2)}`, labels[name] || name];
                      }}
                      labelFormatter={(date) => format(new Date(date), 'MM/dd/yyyy')}
                    />
                    <Line
                      type="monotone"
                      dataKey="net"
                      stroke="#003865"
                      strokeWidth={3}
                      dot={{ fill: '#003865', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Transactions Table */}
          <div className="nfcu-table-container">
            <table className="nfcu-transactions-table">
              <thead>
                <tr>
                  <th
                    className="nfcu-sortable"
                    onClick={() => setSortConfig({
                      key: 'date',
                      direction: sortConfig.key === 'date' && sortConfig.direction === 'descending' ? 'ascending' : 'descending'
                    })}
                  >
                    Date {sortConfig.key === 'date' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                  </th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Account</th>
                  <th
                    className="nfcu-sortable nfcu-text-right"
                    onClick={() => setSortConfig({
                      key: 'amount',
                      direction: sortConfig.key === 'amount' && sortConfig.direction === 'descending' ? 'ascending' : 'descending'
                    })}
                  >
                    Amount {sortConfig.key === 'amount' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                  </th>
                  <th className="nfcu-text-right">Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.length > 0 ? (
                  sortedTransactions.map((transaction) => {
                    const account = safeAccounts.find(a => a._id === transaction.accountId);
                    const transactionType = transaction.type?.toLowerCase();
                    return (
                      <tr key={transaction._id}>
                        <td className="nfcu-date-cell">
                          {format(new Date(transaction.date || transaction.createdAt), 'MM/dd/yyyy')}
                        </td>
                        <td className="nfcu-description-cell">{transaction.description}</td>
                        <td>
                          <span className="nfcu-category-badge">
                            {transaction.category || 'General'}
                          </span>
                        </td>
                        <td className="nfcu-account-cell">
                          {account ? `${account.accountType} (*${account.accountNumber.slice(-4)})` : 'Unknown Account'}
                        </td>
                        <td className={`nfcu-amount-cell ${transactionType === 'credit' ? 'nfcu-credit' : 'nfcu-debit'}`}>
                          {transactionType === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </td>
                        <td className="nfcu-balance-cell">
                          {transaction.balance ? `$${transaction.balance.toFixed(2)}` : '-'}
                        </td>
                        <td>
                          <span className={`nfcu-status-badge nfcu-status-${transaction.status || 'completed'}`}>
                            {transaction.status || 'completed'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="nfcu-no-transactions">
                      <div className="nfcu-empty-state">
                        <Search size={48} />
                        <p>No transactions found matching your filters</p>
                        <button className="nfcu-btn-secondary" onClick={clearFilters}>
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;