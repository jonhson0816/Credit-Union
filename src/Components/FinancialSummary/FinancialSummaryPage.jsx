import React, { useState, useEffect, useMemo } from 'react';
import { useNavyFederal } from '../../Context/NavyFederalContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart as PieChartIcon,
  Calendar,
  Download,
  Filter,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Wallet,
  Target,
  Activity,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import './FinancialSummaryPage.css';

const FinancialSummaryPage = () => {
  const { 
    accounts, 
    transactions, 
    loans,
    financialGoals,
    currentUser,
    isLoading 
  } = useNavyFederal();

  const [showBalances, setShowBalances] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate date range
  const dateRange = useMemo(() => {
    const end = new Date();
    const start = subDays(end, parseInt(selectedPeriod));
    return { start, end };
  }, [selectedPeriod]);

  // Filter transactions by date range and account
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.date || t.createdAt);
      const inDateRange = transactionDate >= dateRange.start && transactionDate <= dateRange.end;
      const matchesAccount = selectedAccount === 'all' || t.accountId === selectedAccount;
      return inDateRange && matchesAccount;
    });
  }, [transactions, dateRange, selectedAccount]);

  // Calculate total balances
  const totalBalances = useMemo(() => {
    const checking = accounts
      .filter(a => a.accountType === 'Checking')
      .reduce((sum, a) => sum + (a.balance || 0), 0);
    
    const savings = accounts
      .filter(a => a.accountType === 'Savings')
      .reduce((sum, a) => sum + (a.balance || 0), 0);
    
    const credit = accounts
      .filter(a => a.accountType === 'Credit')
      .reduce((sum, a) => sum + (a.balance || 0), 0);
    
    const investment = accounts
      .filter(a => a.accountType === 'Investment')
      .reduce((sum, a) => sum + (a.balance || 0), 0);

    const totalAssets = checking + savings + investment;
    const totalLiabilities = credit + (loans?.reduce((sum, l) => sum + (l.remainingBalance || 0), 0) || 0);
    const netWorth = totalAssets - totalLiabilities;

    return {
      checking,
      savings,
      credit,
      investment,
      totalAssets,
      totalLiabilities,
      netWorth
    };
  }, [accounts, loans]);

  // Calculate income and expenses
  const financialMetrics = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netIncome = income - expenses;
    const savingsRate = income > 0 ? ((netIncome / income) * 100) : 0;
    
    return {
      income,
      expenses,
      netIncome,
      savingsRate,
      transactionCount: filteredTransactions.length
    };
  }, [filteredTransactions]);

  // Spending by category
  const spendingByCategory = useMemo(() => {
    const categoryMap = {};
    
    filteredTransactions
      .filter(t => t.type === 'debit')
      .forEach(t => {
        const category = t.category || 'Other';
        categoryMap[category] = (categoryMap[category] || 0) + t.amount;
      });
    
    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categories
  }, [filteredTransactions]);

  // Monthly trend data
  const monthlyTrend = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date || t.createdAt);
        return tDate >= monthStart && tDate <= monthEnd;
      });
      
      const income = monthTransactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
      
      months.push({
        month: format(date, 'MMM'),
        income,
        expenses,
        net: income - expenses
      });
    }
    
    return months;
  }, [transactions]);

  // Daily balance trend
  const dailyBalanceTrend = useMemo(() => {
    const days = [];
    const sortedTransactions = [...filteredTransactions].sort((a, b) => 
      new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt)
    );
    
    let runningBalance = totalBalances.totalAssets;
    
    for (let i = parseInt(selectedPeriod); i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayTransactions = sortedTransactions.filter(t => {
        const tDate = new Date(t.date || t.createdAt);
        return format(tDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      });
      
      dayTransactions.forEach(t => {
        if (t.type === 'credit') {
          runningBalance += t.amount;
        } else {
          runningBalance -= t.amount;
        }
      });
      
      days.push({
        date: format(date, 'MM/dd'),
        balance: runningBalance
      });
    }
    
    return days;
  }, [filteredTransactions, totalBalances, selectedPeriod]);

  // Account distribution for pie chart
  const accountDistribution = useMemo(() => {
    return [
      { name: 'Checking', value: totalBalances.checking, color: '#3b82f6' },
      { name: 'Savings', value: totalBalances.savings, color: '#10b981' },
      { name: 'Investment', value: totalBalances.investment, color: '#8b5cf6' },
    ].filter(item => item.value > 0);
  }, [totalBalances]);

  // Top transactions
  const topTransactions = useMemo(() => {
    return [...filteredTransactions]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filteredTransactions]);

  // Financial health score (0-100)
  const financialHealthScore = useMemo(() => {
    let score = 0;
    
    // Positive net worth (30 points)
    if (totalBalances.netWorth > 0) {
      score += 30;
    }
    
    // Savings rate (25 points)
    if (financialMetrics.savingsRate > 20) {
      score += 25;
    } else if (financialMetrics.savingsRate > 10) {
      score += 15;
    } else if (financialMetrics.savingsRate > 0) {
      score += 5;
    }
    
    // Low debt ratio (25 points)
    const debtRatio = totalBalances.totalAssets > 0 
      ? (totalBalances.totalLiabilities / totalBalances.totalAssets) * 100 
      : 0;
    
    if (debtRatio < 30) {
      score += 25;
    } else if (debtRatio < 50) {
      score += 15;
    } else if (debtRatio < 70) {
      score += 5;
    }
    
    // Emergency fund (20 points) - at least 3 months expenses
    const monthlyExpenses = financialMetrics.expenses / (parseInt(selectedPeriod) / 30);
    const emergencyFundMonths = totalBalances.savings / monthlyExpenses;
    
    if (emergencyFundMonths >= 6) {
      score += 20;
    } else if (emergencyFundMonths >= 3) {
      score += 15;
    } else if (emergencyFundMonths >= 1) {
      score += 5;
    }
    
    return Math.min(score, 100);
  }, [totalBalances, financialMetrics, selectedPeriod]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const exportFinancialReport = () => {
    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Financial Summary Report - ${format(new Date(), 'MM/dd/yyyy')}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 3px solid #003865; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #003865; margin: 0; }
            .section { margin: 30px 0; }
            .section h2 { color: #003865; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; }
            .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
            .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; }
            .metric-label { font-size: 14px; color: #666; margin-bottom: 5px; }
            .metric-value { font-size: 24px; font-weight: bold; color: #003865; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #003865; color: white; }
            .positive { color: #10b981; }
            .negative { color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Financial Summary Report</h1>
            <p>${currentUser?.firstName} ${currentUser?.lastName}</p>
            <p>Period: ${format(dateRange.start, 'MM/dd/yyyy')} - ${format(dateRange.end, 'MM/dd/yyyy')}</p>
          </div>
          
          <div class="section">
            <h2>Account Overview</h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Total Assets</div>
                <div class="metric-value">${formatCurrency(totalBalances.totalAssets)}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total Liabilities</div>
                <div class="metric-value">${formatCurrency(totalBalances.totalLiabilities)}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Net Worth</div>
                <div class="metric-value ${totalBalances.netWorth >= 0 ? 'positive' : 'negative'}">
                  ${formatCurrency(totalBalances.netWorth)}
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Income & Expenses</h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Total Income</div>
                <div class="metric-value positive">${formatCurrency(financialMetrics.income)}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total Expenses</div>
                <div class="metric-value negative">${formatCurrency(financialMetrics.expenses)}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Net Income</div>
                <div class="metric-value ${financialMetrics.netIncome >= 0 ? 'positive' : 'negative'}">
                  ${formatCurrency(financialMetrics.netIncome)}
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Account Breakdown</h2>
            <table>
              <thead>
                <tr>
                  <th>Account Type</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Checking Accounts</td>
                  <td>${formatCurrency(totalBalances.checking)}</td>
                </tr>
                <tr>
                  <td>Savings Accounts</td>
                  <td>${formatCurrency(totalBalances.savings)}</td>
                </tr>
                <tr>
                  <td>Investment Accounts</td>
                  <td>${formatCurrency(totalBalances.investment)}</td>
                </tr>
                <tr>
                  <td>Credit Accounts</td>
                  <td class="negative">${formatCurrency(totalBalances.credit)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section">
            <p style="text-align: center; color: #666; margin-top: 40px;">
              Generated on ${format(new Date(), 'MM/dd/yyyy hh:mm a')}<br>
              Navy Federal Credit Union - Financial Summary
            </p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportHTML);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  if (isLoading) {
    return (
      <div className="fin-sum-page">
        <div className="fin-sum-loading">
          <div className="fin-sum-spinner"></div>
          <p>Loading your financial summary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fin-sum-page">
      {/* Header */}
      <div className="fin-sum-header">
        <div className="fin-sum-header-left">
          <h1>Financial Summary</h1>
          <p>Comprehensive overview of your financial health</p>
        </div>
        <div className="fin-sum-header-actions">
          <button 
            className="fin-sum-btn-toggle"
            onClick={() => setShowBalances(!showBalances)}
          >
            {showBalances ? <EyeOff size={18} /> : <Eye size={18} />}
            {showBalances ? 'Hide' : 'Show'} Balances
          </button>
          <button className="fin-sum-btn-primary" onClick={exportFinancialReport}>
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="fin-sum-filters">
        <div className="fin-sum-filter-group">
          <label>Time Period</label>
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="fin-sum-select"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="60">Last 60 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="180">Last 6 Months</option>
            <option value="365">Last Year</option>
          </select>
        </div>
        <div className="fin-sum-filter-group">
          <label>Account</label>
          <select 
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="fin-sum-select"
          >
            <option value="all">All Accounts</option>
            {accounts.map(acc => (
              <option key={acc._id} value={acc._id}>
                {acc.accountType} (*{acc.accountNumber.slice(-4)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Financial Health Score */}
      <div className="fin-sum-health-card">
        <div className="fin-sum-health-header">
          <Activity size={24} />
          <h2>Financial Health Score</h2>
        </div>
        <div className="fin-sum-health-score">
          <div className="fin-sum-score-circle">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="10" />
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke={
                  financialHealthScore >= 80 ? '#10b981' :
                  financialHealthScore >= 60 ? '#f59e0b' :
                  '#ef4444'
                }
                strokeWidth="10"
                strokeDasharray={`${(financialHealthScore / 100) * 283} 283`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="fin-sum-score-text">
              <span className="fin-sum-score-number">{financialHealthScore}</span>
              <span className="fin-sum-score-label">/100</span>
            </div>
          </div>
          <div className="fin-sum-health-details">
            <p className="fin-sum-health-status">
              {financialHealthScore >= 80 ? 'Excellent' :
               financialHealthScore >= 60 ? 'Good' :
               financialHealthScore >= 40 ? 'Fair' : 'Needs Improvement'}
            </p>
            <p className="fin-sum-health-description">
              Your financial health is {financialHealthScore >= 70 ? 'strong' : 'developing'}. 
              {financialHealthScore < 70 && ' Consider increasing savings and reducing debt.'}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="fin-sum-metrics-grid">
        <div className="fin-sum-metric-card">
          <div className="fin-sum-metric-icon fin-sum-blue">
            <Wallet size={24} />
          </div>
          <div className="fin-sum-metric-content">
            <p className="fin-sum-metric-label">Total Assets</p>
            <p className="fin-sum-metric-value">
              {showBalances ? formatCurrency(totalBalances.totalAssets) : '••••••'}
            </p>
            <p className="fin-sum-metric-subtitle">
              Checking + Savings + Investments
            </p>
          </div>
        </div>

        <div className="fin-sum-metric-card">
          <div className="fin-sum-metric-icon fin-sum-red">
            <CreditCard size={24} />
          </div>
          <div className="fin-sum-metric-content">
            <p className="fin-sum-metric-label">Total Liabilities</p>
            <p className="fin-sum-metric-value">
              {showBalances ? formatCurrency(totalBalances.totalLiabilities) : '••••••'}
            </p>
            <p className="fin-sum-metric-subtitle">
              Credit + Loans
            </p>
          </div>
        </div>

        <div className="fin-sum-metric-card">
          <div className={`fin-sum-metric-icon ${totalBalances.netWorth >= 0 ? 'fin-sum-green' : 'fin-sum-red'}`}>
            <DollarSign size={24} />
          </div>
          <div className="fin-sum-metric-content">
            <p className="fin-sum-metric-label">Net Worth</p>
            <p className={`fin-sum-metric-value ${totalBalances.netWorth >= 0 ? 'fin-sum-positive' : 'fin-sum-negative'}`}>
              {showBalances ? formatCurrency(totalBalances.netWorth) : '••••••'}
            </p>
            <p className="fin-sum-metric-subtitle">
              Assets - Liabilities
            </p>
          </div>
        </div>

        <div className="fin-sum-metric-card">
          <div className="fin-sum-metric-icon fin-sum-green">
            <TrendingUp size={24} />
          </div>
          <div className="fin-sum-metric-content">
            <p className="fin-sum-metric-label">Total Income</p>
            <p className="fin-sum-metric-value fin-sum-positive">
              {showBalances ? formatCurrency(financialMetrics.income) : '••••••'}
            </p>
            <p className="fin-sum-metric-subtitle">
              Last {selectedPeriod} days
            </p>
          </div>
        </div>

        <div className="fin-sum-metric-card">
          <div className="fin-sum-metric-icon fin-sum-orange">
            <TrendingDown size={24} />
          </div>
          <div className="fin-sum-metric-content">
            <p className="fin-sum-metric-label">Total Expenses</p>
            <p className="fin-sum-metric-value fin-sum-negative">
              {showBalances ? formatCurrency(financialMetrics.expenses) : '••••••'}
            </p>
            <p className="fin-sum-metric-subtitle">
              Last {selectedPeriod} days
            </p>
          </div>
        </div>

        <div className="fin-sum-metric-card">
          <div className={`fin-sum-metric-icon ${financialMetrics.netIncome >= 0 ? 'fin-sum-green' : 'fin-sum-red'}`}>
            <BarChart3 size={24} />
          </div>
          <div className="fin-sum-metric-content">
            <p className="fin-sum-metric-label">Net Income</p>
            <p className={`fin-sum-metric-value ${financialMetrics.netIncome >= 0 ? 'fin-sum-positive' : 'fin-sum-negative'}`}>
              {showBalances ? formatCurrency(financialMetrics.netIncome) : '••••••'}
            </p>
            <p className="fin-sum-metric-subtitle">
              Savings Rate: {financialMetrics.savingsRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="fin-sum-charts-grid">
        {/* Account Distribution */}
        <div className="fin-sum-chart-card">
          <h3>
            <PieChartIcon size={20} />
            Account Distribution
          </h3>
          <div className="fin-sum-chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={accountDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {accountDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="fin-sum-chart-legend">
            {accountDistribution.map((item, index) => (
              <div key={index} className="fin-sum-legend-item">
                <div className="fin-sum-legend-color" style={{ backgroundColor: item.color }}></div>
                <span>{item.name}: {formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Income vs Expenses */}
        <div className="fin-sum-chart-card">
          <h3>
            <BarChart3 size={20} />
            Income vs Expenses (6 Months)
          </h3>
          <div className="fin-sum-chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Balance Trend */}
        <div className="fin-sum-chart-card fin-sum-chart-wide">
          <h3>
            <Activity size={20} />
            Balance Trend
          </h3>
          <div className="fin-sum-chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyBalanceTrend}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorBalance)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending by Category */}
        {spendingByCategory.length > 0 && (
          <div className="fin-sum-chart-card">
            <h3>
              <PieChartIcon size={20} />
              Spending by Category
            </h3>
            <div className="fin-sum-chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={spendingByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {spendingByCategory.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={[
                          '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
                          '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
                        ][index % 8]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Account Breakdown */}
      <div className="fin-sum-accounts-section">
        <h2>Account Breakdown</h2>
        <div className="fin-sum-accounts-grid">
          {accounts.map(account => (
            <div key={account._id} className="fin-sum-account-card">
              <div className="fin-sum-account-header">
                <div>
                  <p className="fin-sum-account-type">{account.accountType}</p>
                  <p className="fin-sum-account-number">****{account.accountNumber.slice(-4)}</p>
                </div>
                <div className={`fin-sum-account-badge ${account.accountType.toLowerCase()}`}>
                  {account.status}
                </div>
              </div>
              <div className="fin-sum-account-balance">
                <p className="fin-sum-account-balance-label">Balance</p>
                <p className="fin-sum-account-balance-value">
                  {showBalances ? formatCurrency(account.balance) : '••••••'}
                </p>
              </div>
              {account.interestRate > 0 && (
                <div className="fin-sum-account-interest">
                  <p>Interest Rate: {(account.interestRate * 100).toFixed(2)}% APY</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Top Transactions */}
      {topTransactions.length > 0 && (
        <div className="fin-sum-transactions-section">
          <h2>Largest Transactions</h2>
          <div className="fin-sum-transactions-list">
            {topTransactions.map((transaction, index) => {
              const account = accounts.find(a => a._id === transaction.accountId);
              return (
                <div key={transaction._id || index} className="fin-sum-transaction-item">
                  <div className="fin-sum-transaction-icon">
                    {transaction.type === 'credit' ? (
                      <ArrowUpRight size={20} className="fin-sum-icon-credit" />
                    ) : (
                      <ArrowDownRight size={20} className="fin-sum-icon-debit" />
                    )}
                  </div>
                  <div className="fin-sum-transaction-details">
                    <p className="fin-sum-transaction-description">{transaction.description}</p>
                    <p className="fin-sum-transaction-meta">
                      {format(new Date(transaction.date || transaction.createdAt), 'MMM dd, yyyy')}
                      {account && ` • ${account.accountType}`}
                    </p>
                  </div>
                  <div className={`fin-sum-transaction-amount ${transaction.type === 'credit' ? 'fin-sum-positive' : 'fin-sum-negative'}`}>
                    {transaction.type === 'credit' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Financial Goals Progress */}
      {financialGoals && financialGoals.length > 0 && (
        <div className="fin-sum-goals-section">
          <h2>
            <Target size={20} />
            Financial Goals Progress
          </h2>
          <div className="fin-sum-goals-grid">
            {financialGoals.slice(0, 4).map(goal => {
              const progress = goal.targetAmount > 0 
                ? (goal.currentAmount / goal.targetAmount) * 100 
                : 0;
              
              return (
                <div key={goal._id} className="fin-sum-goal-card">
                  <div className="fin-sum-goal-header">
                    <h4>{goal.goalName}</h4>
                    <span className={`fin-sum-goal-status ${goal.status}`}>
                      {goal.status}
                    </span>
                  </div>
                  <div className="fin-sum-goal-progress">
                    <div className="fin-sum-goal-amounts">
                      <span>{formatCurrency(goal.currentAmount)}</span>
                      <span>{formatCurrency(goal.targetAmount)}</span>
                    </div>
                    <div className="fin-sum-progress-bar">
                      <div 
                        className="fin-sum-progress-fill"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                    <p className="fin-sum-goal-percentage">{progress.toFixed(1)}% Complete</p>
                  </div>
                  {goal.targetDate && (
                    <p className="fin-sum-goal-deadline">
                      Target: {format(new Date(goal.targetDate), 'MMM dd, yyyy')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loans Summary */}
      {loans && loans.length > 0 && (
        <div className="fin-sum-loans-section">
          <h2>
            <CreditCard size={20} />
            Active Loans
          </h2>
          <div className="fin-sum-loans-grid">
            {loans.map(loan => {
              const progress = loan.totalAmount > 0
                ? ((loan.totalAmount - loan.remainingBalance) / loan.totalAmount) * 100
                : 0;

              return (
                <div key={loan._id} className="fin-sum-loan-card">
                  <div className="fin-sum-loan-header">
                    <h4>{loan.loanType}</h4>
                    <span className={`fin-sum-loan-status ${loan.status}`}>
                      {loan.status}
                    </span>
                  </div>
                  <div className="fin-sum-loan-details">
                    <div className="fin-sum-loan-detail-item">
                      <span className="fin-sum-loan-label">Total Amount</span>
                      <span className="fin-sum-loan-value">{formatCurrency(loan.totalAmount)}</span>
                    </div>
                    <div className="fin-sum-loan-detail-item">
                      <span className="fin-sum-loan-label">Remaining</span>
                      <span className="fin-sum-loan-value fin-sum-negative">
                        {formatCurrency(loan.remainingBalance)}
                      </span>
                    </div>
                    <div className="fin-sum-loan-detail-item">
                      <span className="fin-sum-loan-label">Monthly Payment</span>
                      <span className="fin-sum-loan-value">{formatCurrency(loan.monthlyPayment)}</span>
                    </div>
                    <div className="fin-sum-loan-detail-item">
                      <span className="fin-sum-loan-label">Interest Rate</span>
                      <span className="fin-sum-loan-value">{(loan.interestRate * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                  <div className="fin-sum-loan-progress">
                    <div className="fin-sum-progress-bar">
                      <div 
                        className="fin-sum-progress-fill fin-sum-loan-progress-fill"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="fin-sum-loan-percentage">{progress.toFixed(1)}% Paid Off</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Insights & Recommendations */}
      <div className="fin-sum-insights-section">
        <h2>
          <AlertCircle size={20} />
          Financial Insights
        </h2>
        <div className="fin-sum-insights-grid">
          {/* Savings Insight */}
          {financialMetrics.savingsRate < 20 && (
            <div className="fin-sum-insight-card fin-sum-warning">
              <div className="fin-sum-insight-icon">
                <TrendingDown size={24} />
              </div>
              <div className="fin-sum-insight-content">
                <h4>Low Savings Rate</h4>
                <p>
                  Your current savings rate is {financialMetrics.savingsRate.toFixed(1)}%. 
                  Financial experts recommend saving at least 20% of your income.
                </p>
                <p className="fin-sum-insight-action">
                  Consider reducing discretionary spending or increasing income sources.
                </p>
              </div>
            </div>
          )}

          {/* Emergency Fund Insight */}
          {(() => {
            const monthlyExpenses = financialMetrics.expenses / (parseInt(selectedPeriod) / 30);
            const emergencyFundMonths = monthlyExpenses > 0 ? totalBalances.savings / monthlyExpenses : 0;
            
            if (emergencyFundMonths < 3) {
              return (
                <div className="fin-sum-insight-card fin-sum-warning">
                  <div className="fin-sum-insight-icon">
                    <AlertCircle size={24} />
                  </div>
                  <div className="fin-sum-insight-content">
                    <h4>Build Emergency Fund</h4>
                    <p>
                      You have {emergencyFundMonths.toFixed(1)} months of expenses saved. 
                      Aim for at least 3-6 months of expenses in savings.
                    </p>
                    <p className="fin-sum-insight-action">
                      Target savings: {formatCurrency(monthlyExpenses * 3)} - {formatCurrency(monthlyExpenses * 6)}
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Debt Management Insight */}
          {totalBalances.totalLiabilities > 0 && (
            <div className={`fin-sum-insight-card ${
              (totalBalances.totalLiabilities / totalBalances.totalAssets) > 0.5 
                ? 'fin-sum-warning' 
                : 'fin-sum-info'
            }`}>
              <div className="fin-sum-insight-icon">
                <CreditCard size={24} />
              </div>
              <div className="fin-sum-insight-content">
                <h4>Debt Overview</h4>
                <p>
                  Your debt-to-asset ratio is{' '}
                  {((totalBalances.totalLiabilities / totalBalances.totalAssets) * 100).toFixed(1)}%.
                  {(totalBalances.totalLiabilities / totalBalances.totalAssets) > 0.5
                    ? ' Consider prioritizing debt repayment.'
                    : ' You have a healthy debt-to-asset ratio.'}
                </p>
                <p className="fin-sum-insight-action">
                  Total debt: {formatCurrency(totalBalances.totalLiabilities)}
                </p>
              </div>
            </div>
          )}

          {/* Positive Net Worth Insight */}
          {totalBalances.netWorth > 0 && financialMetrics.savingsRate >= 20 && (
            <div className="fin-sum-insight-card fin-sum-success">
              <div className="fin-sum-insight-icon">
                <TrendingUp size={24} />
              </div>
              <div className="fin-sum-insight-content">
                <h4>Great Financial Health!</h4>
                <p>
                  You're doing excellent! Your positive net worth and healthy savings rate 
                  indicate strong financial management.
                </p>
                <p className="fin-sum-insight-action">
                  Keep up the great work and consider exploring investment opportunities.
                </p>
              </div>
            </div>
          )}

          {/* Income Growth Suggestion */}
          {financialMetrics.expenses > financialMetrics.income * 0.8 && (
            <div className="fin-sum-insight-card fin-sum-info">
              <div className="fin-sum-insight-icon">
                <DollarSign size={24} />
              </div>
              <div className="fin-sum-insight-content">
                <h4>Income Optimization</h4>
                <p>
                  Your expenses are {((financialMetrics.expenses / financialMetrics.income) * 100).toFixed(1)}% 
                  of your income. Consider ways to increase income or reduce expenses.
                </p>
                <p className="fin-sum-insight-action">
                  Explore side hustles, ask for a raise, or review your budget.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Comparison */}
      <div className="fin-sum-comparison-section">
        <h2>6-Month Financial Overview</h2>
        <div className="fin-sum-comparison-table">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Income</th>
                <th>Expenses</th>
                <th>Net</th>
                <th>Savings Rate</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTrend.map((month, index) => {
                const savingsRate = month.income > 0 ? (month.net / month.income) * 100 : 0;
                return (
                  <tr key={index}>
                    <td>{month.month}</td>
                    <td className="fin-sum-positive">{formatCurrency(month.income)}</td>
                    <td className="fin-sum-negative">{formatCurrency(month.expenses)}</td>
                    <td className={month.net >= 0 ? 'fin-sum-positive' : 'fin-sum-negative'}>
                      {month.net >= 0 ? '+' : ''}{formatCurrency(month.net)}
                    </td>
                    <td>
                      <span className={`fin-sum-savings-badge ${
                        savingsRate >= 20 ? 'fin-sum-good' :
                        savingsRate >= 10 ? 'fin-sum-fair' :
                        'fin-sum-poor'
                      }`}>
                        {savingsRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="fin-sum-footer">
        <div className="fin-sum-footer-content">
          <p>
            <strong>Report Generated:</strong> {format(new Date(), 'MMMM dd, yyyy \'at\' hh:mm a')}
          </p>
          <p>
            <strong>Period:</strong> {format(dateRange.start, 'MMM dd, yyyy')} - {format(dateRange.end, 'MMM dd, yyyy')}
          </p>
          <p>
            <strong>Total Transactions Analyzed:</strong> {filteredTransactions.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummaryPage;