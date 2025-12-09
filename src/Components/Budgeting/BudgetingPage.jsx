import React, { useState, useEffect, useMemo } from 'react';
import { useNavyFederal } from '../../Context/NavyFederalContext';
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
  ResponsiveContainer 
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  AlertCircle,
  CheckCircle,
  Target,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import './BudgetingPage.css';

const BudgetingPage = () => {
  const { 
    transactions, 
    accounts,
    currentUser,
    isLoading 
  } = useNavyFederal();

  // Budget Categories with Navy Federal colors
  const defaultCategories = [
    { id: 'housing', name: 'Housing & Utilities', icon: '🏠', color: '#003865', budgeted: 0 },
    { id: 'transportation', name: 'Transportation', icon: '🚗', color: '#C8102E', budgeted: 0 },
    { id: 'food', name: 'Food & Dining', icon: '🍔', color: '#10b981', budgeted: 0 },
    { id: 'healthcare', name: 'Healthcare', icon: '⚕️', color: '#8b5cf6', budgeted: 0 },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#f59e0b', budgeted: 0 },
    { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#ec4899', budgeted: 0 },
    { id: 'education', name: 'Education', icon: '📚', color: '#3b82f6', budgeted: 0 },
    { id: 'savings', name: 'Savings & Investments', icon: '💰', color: '#059669', budgeted: 0 },
    { id: 'insurance', name: 'Insurance', icon: '🛡️', color: '#6366f1', budgeted: 0 },
    { id: 'debt', name: 'Debt Payments', icon: '💳', color: '#ef4444', budgeted: 0 },
    { id: 'personal', name: 'Personal Care', icon: '💆', color: '#14b8a6', budgeted: 0 },
    { id: 'other', name: 'Other Expenses', icon: '📦', color: '#6b7280', budgeted: 0 }
  ];

  // State Management
  const [budgetCategories, setBudgetCategories] = useState(() => {
    const saved = localStorage.getItem('navyFederal_budgetCategories');
    return saved ? JSON.parse(saved) : defaultCategories;
  });

  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [monthlyIncome, setMonthlyIncome] = useState(() => {
    const saved = localStorage.getItem('navyFederal_monthlyIncome');
    return saved ? parseFloat(saved) : 0;
  });
  const [editingCategory, setEditingCategory] = useState(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '📌', color: '#003865', budgeted: 0 });
  const [showBalances, setShowBalances] = useState(true);
  const [budgetPeriod, setBudgetPeriod] = useState('monthly'); // monthly, weekly, yearly

  // Category mapping for transactions
  const categoryMapping = {
    'Deposit': 'income',
    'Withdrawal': 'other',
    'Transfer': 'other',
    'Payment': 'debt',
    'Fee': 'other',
    'Interest': 'savings',
    'Reversal': 'other',
    'General': 'other'
  };

  // Save to localStorage whenever budgetCategories or monthlyIncome changes
  useEffect(() => {
    localStorage.setItem('navyFederal_budgetCategories', JSON.stringify(budgetCategories));
  }, [budgetCategories]);

  useEffect(() => {
    localStorage.setItem('navyFederal_monthlyIncome', monthlyIncome.toString());
  }, [monthlyIncome]);

  // Get date range for selected month
  const dateRange = useMemo(() => {
    const date = parseISO(selectedMonth + '-01');
    return {
      start: startOfMonth(date),
      end: endOfMonth(date)
    };
  }, [selectedMonth]);

  // Filter transactions for selected month
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date || t.createdAt);
      return tDate >= dateRange.start && tDate <= dateRange.end;
    });
  }, [transactions, dateRange]);

  // Calculate actual spending by category
  const actualSpending = useMemo(() => {
    const spending = {};
    
    budgetCategories.forEach(cat => {
      spending[cat.id] = 0;
    });

    monthTransactions
      .filter(t => t.type === 'debit')
      .forEach(t => {
        const category = t.category || 'General';
        const mappedCategory = categoryMapping[category] || 'other';
        
        // Find matching budget category
        const budgetCat = budgetCategories.find(c => 
          c.id === mappedCategory || 
          c.name.toLowerCase().includes(category.toLowerCase())
        );
        
        if (budgetCat) {
          spending[budgetCat.id] = (spending[budgetCat.id] || 0) + t.amount;
        } else {
          spending['other'] = (spending['other'] || 0) + t.amount;
        }
      });

    return spending;
  }, [monthTransactions, budgetCategories]);

  // Calculate total income for the month
  const totalIncome = useMemo(() => {
    return monthTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  // Calculate budget metrics
  const budgetMetrics = useMemo(() => {
    const totalBudgeted = budgetCategories.reduce((sum, cat) => sum + cat.budgeted, 0);
    const totalSpent = Object.values(actualSpending).reduce((sum, val) => sum + val, 0);
    const remaining = totalBudgeted - totalSpent;
    const percentageUsed = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
    const unallocated = monthlyIncome - totalBudgeted;

    return {
      totalBudgeted,
      totalSpent,
      remaining,
      percentageUsed,
      unallocated,
      categoriesOverBudget: budgetCategories.filter(cat => 
        actualSpending[cat.id] > cat.budgeted && cat.budgeted > 0
      ).length
    };
  }, [budgetCategories, actualSpending, monthlyIncome]);

  // Chart data for budget vs actual
  const budgetComparisonData = useMemo(() => {
    return budgetCategories
      .filter(cat => cat.budgeted > 0)
      .map(cat => ({
        name: cat.name.length > 15 ? cat.name.substring(0, 15) + '...' : cat.name,
        budgeted: cat.budgeted,
        spent: actualSpending[cat.id] || 0,
        icon: cat.icon
      }));
  }, [budgetCategories, actualSpending]);

  // Spending distribution for pie chart
  const spendingDistribution = useMemo(() => {
    return budgetCategories
      .filter(cat => actualSpending[cat.id] > 0)
      .map(cat => ({
        name: cat.name,
        value: actualSpending[cat.id],
        color: cat.color
      }))
      .sort((a, b) => b.value - a.value);
  }, [budgetCategories, actualSpending]);

  // Monthly trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthTrans = transactions.filter(t => {
        const tDate = new Date(t.date || t.createdAt);
        return tDate >= monthStart && tDate <= monthEnd;
      });
      
      const income = monthTrans
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = monthTrans
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
      
      months.push({
        month: format(date, 'MMM'),
        income,
        expenses,
        savings: income - expenses
      });
    }
    
    return months;
  }, [transactions]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Handle category budget update
  const updateCategoryBudget = (categoryId, amount) => {
    setBudgetCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId ? { ...cat, budgeted: parseFloat(amount) || 0 } : cat
      )
    );
  };

  // Handle add new category
  const handleAddCategory = () => {
    if (newCategory.name.trim()) {
      const newCat = {
        id: newCategory.name.toLowerCase().replace(/\s+/g, '-'),
        ...newCategory,
        budgeted: parseFloat(newCategory.budgeted) || 0
      };
      setBudgetCategories([...budgetCategories, newCat]);
      setNewCategory({ name: '', icon: '📌', color: '#003865', budgeted: 0 });
      setShowAddCategory(false);
    }
  };

  // Handle delete category
  const handleDeleteCategory = (categoryId) => {
    if (window.confirm('Are you sure you want to delete this budget category?')) {
      setBudgetCategories(prev => prev.filter(cat => cat.id !== categoryId));
    }
  };

  // Reset budget to defaults
  const resetBudget = () => {
    if (window.confirm('Reset all budget categories to default? This will clear your custom budgets.')) {
      setBudgetCategories(defaultCategories);
      setMonthlyIncome(0);
    }
  };

  // Auto-allocate budget based on 50/30/20 rule
  const autoAllocateBudget = () => {
    if (monthlyIncome <= 0) {
      alert('Please set your monthly income first.');
      return;
    }

    const needs = monthlyIncome * 0.50; // 50% for needs
    const wants = monthlyIncome * 0.30; // 30% for wants
    const savings = monthlyIncome * 0.20; // 20% for savings

    const needsCategories = ['housing', 'food', 'healthcare', 'transportation', 'insurance'];
    const wantsCategories = ['entertainment', 'shopping', 'personal'];
    const savingsCategories = ['savings', 'debt'];

    const updatedCategories = budgetCategories.map(cat => {
      if (needsCategories.includes(cat.id)) {
        return { ...cat, budgeted: needs / needsCategories.length };
      } else if (wantsCategories.includes(cat.id)) {
        return { ...cat, budgeted: wants / wantsCategories.length };
      } else if (savingsCategories.includes(cat.id)) {
        return { ...cat, budgeted: savings / savingsCategories.length };
      }
      return cat;
    });

    setBudgetCategories(updatedCategories);
  };

  // Export budget report
  const exportBudgetReport = () => {
    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Budget Report - ${format(dateRange.start, 'MMMM yyyy')}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 3px solid #003865; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #003865; margin: 0; }
            .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
            .metric { text-align: center; padding: 15px; background: white; border-radius: 8px; }
            .metric-value { font-size: 24px; font-weight: bold; color: #003865; }
            .metric-label { font-size: 14px; color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #003865; color: white; font-weight: 600; }
            .over-budget { color: #C8102E; font-weight: bold; }
            .under-budget { color: #10b981; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Budget Report</h1>
            <p>${currentUser?.firstName} ${currentUser?.lastName}</p>
            <p>${format(dateRange.start, 'MMMM yyyy')}</p>
          </div>
          
          <div class="summary">
            <h2>Budget Summary</h2>
            <div class="metrics">
              <div class="metric">
                <div class="metric-value">${formatCurrency(monthlyIncome)}</div>
                <div class="metric-label">Monthly Income</div>
              </div>
              <div class="metric">
                <div class="metric-value">${formatCurrency(budgetMetrics.totalBudgeted)}</div>
                <div class="metric-label">Total Budgeted</div>
              </div>
              <div class="metric">
                <div class="metric-value">${formatCurrency(budgetMetrics.totalSpent)}</div>
                <div class="metric-label">Total Spent</div>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Budgeted</th>
                <th>Spent</th>
                <th>Remaining</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${budgetCategories.map(cat => {
                const spent = actualSpending[cat.id] || 0;
                const remaining = cat.budgeted - spent;
                const percentage = cat.budgeted > 0 ? (spent / cat.budgeted) * 100 : 0;
                return `
                  <tr>
                    <td>${cat.icon} ${cat.name}</td>
                    <td>${formatCurrency(cat.budgeted)}</td>
                    <td>${formatCurrency(spent)}</td>
                    <td class="${remaining < 0 ? 'over-budget' : 'under-budget'}">
                      ${formatCurrency(remaining)}
                    </td>
                    <td>
                      ${percentage > 100 ? '⚠️ Over Budget' : 
                        percentage > 80 ? '⚡ Close to Limit' : 
                        '✅ On Track'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div style="margin-top: 40px; text-align: center; color: #666;">
            <p>Generated on ${format(new Date(), 'MM/dd/yyyy hh:mm a')}</p>
            <p>Navy Federal Credit Union - Budget Management</p>
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
      <div className="budget-page">
        <div className="budget-loading">
          <div className="budget-spinner"></div>
          <p>Loading your budget...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="budget-page">
      {/* Header */}
      <div className="budget-header">
        <div className="budget-header-left">
          <h1>Budget Management</h1>
          <p>Track and manage your monthly spending</p>
        </div>
        <div className="budget-header-actions">
          <button 
            className="budget-btn-secondary"
            onClick={() => setShowBalances(!showBalances)}
          >
            {showBalances ? <EyeOff size={18} /> : <Eye size={18} />}
            {showBalances ? 'Hide' : 'Show'} Amounts
          </button>
          <button 
            className="budget-btn-secondary"
            onClick={autoAllocateBudget}
          >
            <RefreshCw size={18} />
            Auto-Allocate
          </button>
          <button 
            className="budget-btn-primary"
            onClick={exportBudgetReport}
          >
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      {/* Month Selector & Income Input */}
      <div className="budget-controls">
        <div className="budget-control-group">
          <label>
            <Calendar size={16} />
            Budget Period
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="budget-input"
            max={format(new Date(), 'yyyy-MM')}
          />
        </div>

        <div className="budget-control-group">
          <label>
            <DollarSign size={16} />
            Monthly Income
          </label>
          <input
            type="number"
            step="0.01"
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(parseFloat(e.target.value) || 0)}
            className="budget-input"
            placeholder="Enter your monthly income"
          />
        </div>

        <div className="budget-control-group">
          <label>&nbsp;</label>
          <button 
            className="budget-btn-reset"
            onClick={resetBudget}
          >
            <Settings size={16} />
            Reset Budget
          </button>
        </div>
      </div>

      {/* Budget Overview Cards */}
      <div className="budget-overview-grid">
        <div className="budget-overview-card budget-income">
          <div className="budget-overview-icon">
            <TrendingUp size={28} />
          </div>
          <div className="budget-overview-content">
            <p className="budget-overview-label">Monthly Income</p>
            <p className="budget-overview-value">
              {showBalances ? formatCurrency(monthlyIncome) : '••••••'}
            </p>
            <p className="budget-overview-subtitle">
              Actual: {formatCurrency(totalIncome)}
            </p>
          </div>
        </div>

        <div className="budget-overview-card budget-budgeted">
          <div className="budget-overview-icon">
            <Target size={28} />
          </div>
          <div className="budget-overview-content">
            <p className="budget-overview-label">Total Budgeted</p>
            <p className="budget-overview-value">
              {showBalances ? formatCurrency(budgetMetrics.totalBudgeted) : '••••••'}
            </p>
            <p className="budget-overview-subtitle">
              {budgetMetrics.percentageUsed.toFixed(1)}% Used
            </p>
          </div>
        </div>

        <div className="budget-overview-card budget-spent">
          <div className="budget-overview-icon">
            <TrendingDown size={28} />
          </div>
          <div className="budget-overview-content">
            <p className="budget-overview-label">Total Spent</p>
            <p className="budget-overview-value">
              {showBalances ? formatCurrency(budgetMetrics.totalSpent) : '••••••'}
            </p>
            <p className="budget-overview-subtitle">
              {budgetMetrics.categoriesOverBudget} over budget
            </p>
          </div>
        </div>

        <div className={`budget-overview-card ${budgetMetrics.remaining >= 0 ? 'budget-positive' : 'budget-negative'}`}>
          <div className="budget-overview-icon">
            <DollarSign size={28} />
          </div>
          <div className="budget-overview-content">
            <p className="budget-overview-label">Remaining</p>
            <p className="budget-overview-value">
              {showBalances ? formatCurrency(budgetMetrics.remaining) : '••••••'}
            </p>
            <p className="budget-overview-subtitle">
              Unallocated: {formatCurrency(budgetMetrics.unallocated)}
            </p>
          </div>
        </div>
      </div>

      {/* Budget Progress Bar */}
      {budgetMetrics.totalBudgeted > 0 && (
        <div className="budget-progress-section">
          <div className="budget-progress-header">
            <h3>Overall Budget Progress</h3>
            <span className={`budget-progress-percentage ${budgetMetrics.percentageUsed > 100 ? 'budget-over' : ''}`}>
              {budgetMetrics.percentageUsed.toFixed(1)}%
            </span>
          </div>
          <div className="budget-progress-bar-container">
            <div 
              className={`budget-progress-bar-fill ${budgetMetrics.percentageUsed > 100 ? 'budget-exceeded' : ''}`}
              style={{ width: `${Math.min(budgetMetrics.percentageUsed, 100)}%` }}
            ></div>
          </div>
          <div className="budget-progress-labels">
            <span>Spent: {formatCurrency(budgetMetrics.totalSpent)}</span>
            <span>Budget: {formatCurrency(budgetMetrics.totalBudgeted)}</span>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="budget-charts-grid">
        {/* Budget vs Actual Bar Chart */}
        <div className="budget-chart-card budget-chart-wide">
          <h3>
            <BarChart3 size={20} />
            Budget vs Actual Spending
          </h3>
          <div className="budget-chart-container">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={budgetComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="#6b7280"
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="budgeted" fill="#003865" name="Budgeted" radius={[8, 8, 0, 0]} />
                <Bar dataKey="spent" fill="#C8102E" name="Spent" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending Distribution Pie Chart */}
        {spendingDistribution.length > 0 && (
          <div className="budget-chart-card">
            <h3>
              <PieChartIcon size={20} />
              Spending Distribution
            </h3>
            <div className="budget-chart-container">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={spendingDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name.substring(0, 12)}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {spendingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Monthly Trend Line Chart */}
        <div className="budget-chart-card">
          <h3>
            <TrendingUp size={20} />
            6-Month Trend
          </h3>
          <div className="budget-chart-container">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 5 }}
                  name="Income"
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#C8102E" 
                  strokeWidth={3}
                  dot={{ fill: '#C8102E', r: 5 }}
                  name="Expenses"
                />
                <Line 
                  type="monotone" 
                  dataKey="savings" 
                  stroke="#003865" 
                  strokeWidth={3}
                  dot={{ fill: '#003865', r: 5 }}
                  name="Savings"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Budget Categories Table */}
      <div className="budget-categories-section">
        <div className="budget-categories-header">
          <h2>Budget Categories</h2>
          <button 
            className="budget-btn-add"
            onClick={() => setShowAddCategory(!showAddCategory)}
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>

        {/* Add New Category Form */}
        {showAddCategory && (
          <div className="budget-add-category-form">
            <input
              type="text"
              placeholder="Category Name"
              value={newCategory.name}
              onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
              className="budget-form-input"
            />
            <input
              type="text"
              placeholder="Icon (emoji)"
              value={newCategory.icon}
              onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
              className="budget-form-input budget-icon-input"
              maxLength={2}
            />
            <input
              type="color"
              value={newCategory.color}
              onChange={(e) => setNewCategory({...newCategory, color: e.target.value})}
              className="budget-form-color"
            />
            <input
              type="number"
              placeholder="Budget Amount"
              value={newCategory.budgeted}
              onChange={(e) => setNewCategory({...newCategory, budgeted: e.target.value})}
              className="budget-form-input"
              step="0.01"
            />
            <button className="budget-btn-save" onClick={handleAddCategory}>
              <Save size={16} />
              Save
            </button>
            <button className="budget-btn-cancel" onClick={() => setShowAddCategory(false)}>
              <X size={16} />
            </button>
          </div>
        )}

        <div className="budget-categories-grid">
          {budgetCategories.map(category => {
            const spent = actualSpending[category.id] || 0;
            const remaining = category.budgeted - spent;
            const percentage = category.budgeted > 0 ? (spent / category.budgeted) * 100 : 0;
            const isOverBudget = spent > category.budgeted && category.budgeted > 0;

            return (
              <div key={category.id} className={`budget-category-card ${isOverBudget ? 'budget-over-limit' : ''}`}>
                <div className="budget-category-header">
                  <div className="budget-category-icon" style={{ backgroundColor: category.color }}>
                    {category.icon}
                  </div>
                  <div className="budget-category-info">
                    <h4>{category.name}</h4>
                    {category.budgeted > 0 && (
                      <p className="budget-category-status">
                        {isOverBudget ? (
                          <><AlertCircle size={14} /> Over Budget</>
                        ) : percentage > 80 ? (
                          <><AlertCircle size={14} /> Close to Limit</>
                        ) : (
                          <><CheckCircle size={14} /> On Track</>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="budget-category-actions">
                    <button 
                      className="budget-icon-btn"
                      onClick={() => setEditingCategory(category.id)}
                      title="Edit budget"
                    >
                      <Edit2 size={16} />
                    </button>
                    {!defaultCategories.find(c => c.id === category.id) && (
                      <button 
                        className="budget-icon-btn budget-delete-btn"
                        onClick={() => handleDeleteCategory(category.id)}
                        title="Delete category"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="budget-category-amounts">
                  {editingCategory === category.id ? (
                    <div className="budget-edit-input">
                      <input
                        type="number"
                        step="0.01"
                        value={category.budgeted}
                        onChange={(e) => updateCategoryBudget(category.id, e.target.value)}
                        autoFocus
                        onBlur={() => setEditingCategory(null)}
                        onKeyPress={(e) => e.key === 'Enter' && setEditingCategory(null)}
                        className="budget-input-inline"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="budget-amount-row">
                        <span className="budget-amount-label">Budgeted:</span>
                        <span className="budget-amount-value">
                          {showBalances ? formatCurrency(category.budgeted) : '••••••'}
                        </span>
                      </div>
                      <div className="budget-amount-row">
                        <span className="budget-amount-label">Spent:</span>
                        <span className={`budget-amount-value ${isOverBudget ? 'budget-amount-over' : ''}`}>
                          {showBalances ? formatCurrency(spent) : '••••••'}
                        </span>
                      </div>
                      <div className="budget-amount-row">
                        <span className="budget-amount-label">Remaining:</span>
                        <span className={`budget-amount-value ${remaining < 0 ? 'budget-amount-negative' : 'budget-amount-positive'}`}>
                          {showBalances ? formatCurrency(remaining) : '••••••'}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {category.budgeted > 0 && (
                  <div className="budget-category-progress">
                    <div className="budget-category-progress-bar">
                      <div 
                        className={`budget-category-progress-fill ${percentage > 100 ? 'budget-progress-over' : ''}`}
                        style={{ 
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: category.color 
                        }}
                      ></div>
                    </div>
                    <span className="budget-category-percentage">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights & Recommendations */}
      {budgetMetrics.totalBudgeted > 0 && (
        <div className="budget-insights-section">
          <h2>Insights & Recommendations</h2>
          <div className="budget-insights-grid">
            {budgetMetrics.categoriesOverBudget > 0 && (
              <div className="budget-insight-card budget-insight-warning">
                <AlertCircle size={24} />
                <div>
                  <h4>Budget Alert</h4>
                  <p>You have {budgetMetrics.categoriesOverBudget} {budgetMetrics.categoriesOverBudget === 1 ? 'category' : 'categories'} over budget this month.</p>
                </div>
              </div>
            )}

            {budgetMetrics.unallocated > 0 && (
              <div className="budget-insight-card budget-insight-info">
                <Target size={24} />
                <div>
                  <h4>Unallocated Income</h4>
                  <p>You have {formatCurrency(budgetMetrics.unallocated)} not assigned to any budget category.</p>
                </div>
              </div>
            )}

            {budgetMetrics.percentageUsed < 50 && budgetMetrics.totalSpent > 0 && (
              <div className="budget-insight-card budget-insight-success">
                <CheckCircle size={24} />
                <div>
                  <h4>Great Progress!</h4>
                  <p>You're doing well! You've only used {budgetMetrics.percentageUsed.toFixed(0)}% of your budget so far.</p>
                </div>
              </div>
            )}

            {monthlyTrend.length > 0 && monthlyTrend[monthlyTrend.length - 1].savings > 0 && (
              <div className="budget-insight-card budget-insight-success">
                <TrendingUp size={24} />
                <div>
                  <h4>Positive Savings</h4>
                  <p>Last month you saved {formatCurrency(monthlyTrend[monthlyTrend.length - 1].savings)}. Keep it up!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {budgetMetrics.totalBudgeted === 0 && (
        <div className="budget-empty-state">
          <Target size={64} className="budget-empty-icon" />
          <h3>Start Building Your Budget</h3>
          <p>Set up your budget categories and start tracking your spending.</p>
          <button className="budget-btn-primary" onClick={autoAllocateBudget}>
            <RefreshCw size={18} />
            Use 50/30/20 Rule
          </button>
        </div>
      )}
    </div>
  );
};

export default BudgetingPage;