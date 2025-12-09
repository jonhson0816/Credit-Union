import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, DollarSign, Calendar, TrendingUp, PieChart, FileText, Plus, CheckCircle } from 'lucide-react';
import { useNavyFederal } from '../../Context/NavyFederalContext';
import { LineChart, Line, PieChart as RePieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import './LoanCalculator.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const LoanCalculator = () => {
  const navigate = useNavigate();
  const { currentUser, accounts, isAuthenticated } = useNavyFederal();

  // Loan Calculator State
  const [loanType, setLoanType] = useState('personal');
  const [principalAmount, setPrincipalAmount] = useState(10000);
  const [interestRate, setInterestRate] = useState(5.5);
  const [termMonths, setTermMonths] = useState(36);
  const [termYears, setTermYears] = useState(3);
  const [termType, setTermType] = useState('years');

  // Calculated Results
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [amortizationSchedule, setAmortizationSchedule] = useState([]);

  // UI State
  const [activeTab, setActiveTab] = useState('calculator');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [myLoans, setMyLoans] = useState([]);

  // Application Form State
  const [applicationForm, setApplicationForm] = useState({
    loanPurpose: '',
    employmentStatus: 'employed',
    annualIncome: '',
    monthlyDebts: '',
    accountId: ''
  });

  // Loan Type Presets
  const loanTypePresets = {
    personal: { 
      name: 'Personal Loan', 
      minAmount: 1000, 
      maxAmount: 50000, 
      defaultRate: 5.5, 
      minRate: 3.5, 
      maxRate: 18,
      terms: [12, 24, 36, 48, 60]
    },
    auto: { 
      name: 'Auto Loan', 
      minAmount: 5000, 
      maxAmount: 100000, 
      defaultRate: 4.25, 
      minRate: 2.5, 
      maxRate: 12,
      terms: [24, 36, 48, 60, 72, 84]
    },
    home: { 
      name: 'Home Loan', 
      minAmount: 50000, 
      maxAmount: 1000000, 
      defaultRate: 3.5, 
      minRate: 2.5, 
      maxRate: 8,
      terms: [120, 180, 240, 300, 360]
    },
    mortgage: { 
      name: 'Mortgage', 
      minAmount: 100000, 
      maxAmount: 2000000, 
      defaultRate: 3.75, 
      minRate: 2.75, 
      maxRate: 7,
      terms: [180, 240, 300, 360]
    },
    student: { 
      name: 'Student Loan', 
      minAmount: 1000, 
      maxAmount: 100000, 
      defaultRate: 4.5, 
      minRate: 3.0, 
      maxRate: 9,
      terms: [60, 120, 180, 240]
    },
    business: { 
      name: 'Business Loan', 
      minAmount: 5000, 
      maxAmount: 500000, 
      defaultRate: 6.5, 
      minRate: 4.5, 
      maxRate: 15,
      terms: [12, 24, 36, 48, 60, 84, 120]
    }
  };

  const currentPreset = loanTypePresets[loanType];

  // Calculate loan on input change
  useEffect(() => {
    calculateLoan();
  }, [principalAmount, interestRate, termMonths]);

  // Update termMonths when termYears or termType changes
  useEffect(() => {
    if (termType === 'years') {
      setTermMonths(termYears * 12);
    }
  }, [termYears, termType]);

  // Load user's loans if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchMyLoans();
    }
  }, [isAuthenticated]);

  // Fetch user's existing loans
  const fetchMyLoans = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/loans`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMyLoans(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
    }
  };

  // Calculate loan details
  const calculateLoan = async () => {
    try {
      if (!principalAmount || !interestRate || !termMonths) return;

      const monthlyRate = interestRate / 100 / 12;
      let payment;

      if (monthlyRate === 0) {
        payment = principalAmount / termMonths;
      } else {
        payment = principalAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                   (Math.pow(1 + monthlyRate, termMonths) - 1);
      }

      const totalAmt = payment * termMonths;
      const totalInt = totalAmt - principalAmount;

      setMonthlyPayment(payment);
      setTotalInterest(totalInt);
      setTotalAmount(totalAmt);

      // Generate amortization schedule
      const schedule = [];
      let balance = principalAmount;

      for (let i = 1; i <= termMonths; i++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = payment - interestPayment;
        balance -= principalPayment;

        schedule.push({
          month: i,
          principalPayment: principalPayment,
          interestPayment: interestPayment,
          totalPayment: payment,
          remainingBalance: Math.max(0, balance)
        });
      }

      setAmortizationSchedule(schedule);
    } catch (error) {
      console.error('Calculation error:', error);
    }
  };

  // Handle loan type change
  const handleLoanTypeChange = (type) => {
    setLoanType(type);
    const preset = loanTypePresets[type];
    setInterestRate(preset.defaultRate);
    setPrincipalAmount(Math.min(principalAmount, preset.maxAmount));
    setTermMonths(preset.terms[2] || 36); // Use middle term as default
  };

  // Save current scenario
  const saveScenario = () => {
    const scenario = {
      id: Date.now(),
      loanType,
      principalAmount,
      interestRate,
      termMonths,
      monthlyPayment,
      totalInterest,
      totalAmount,
      savedAt: new Date().toISOString()
    };

    setSavedScenarios([...savedScenarios, scenario]);
    alert('Scenario saved successfully!');
  };

  // Apply for loan
  const handleApplyForLoan = async () => {
    if (!isAuthenticated) {
      alert('Please log in to apply for a loan');
      navigate('/login');
      return;
    }

    if (!applicationForm.loanPurpose) {
      alert('Please enter the loan purpose');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const loanData = {
        loanType,
        loanPurpose: applicationForm.loanPurpose,
        principalAmount,
        interestRate,
        termMonths,
        accountId: applicationForm.accountId || null,
        applicationDetails: {
          employmentStatus: applicationForm.employmentStatus,
          annualIncome: parseFloat(applicationForm.annualIncome) || 0,
          monthlyDebts: parseFloat(applicationForm.monthlyDebts) || 0
        }
      };

      const response = await axios.post(`${API_URL}/loans`, loanData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('Loan application submitted successfully! You will receive a confirmation shortly.');
        setShowApplicationForm(false);
        setApplicationForm({
          loanPurpose: '',
          employmentStatus: 'employed',
          annualIncome: '',
          monthlyDebts: '',
          accountId: ''
        });
        fetchMyLoans();
        setActiveTab('myloans');
      }
    } catch (error) {
      console.error('Loan application error:', error);
      setError(error.response?.data?.message || 'Failed to submit loan application');
      alert(error.response?.data?.message || 'Failed to submit loan application');
    } finally {
      setLoading(false);
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
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Prepare chart data
  const pieChartData = [
    { name: 'Principal', value: principalAmount, color: '#2563eb' },
    { name: 'Interest', value: totalInterest, color: '#dc2626' }
  ];

  const balanceChartData = amortizationSchedule
    .filter((_, index) => index % Math.ceil(termMonths / 12) === 0)
    .map(payment => ({
      month: `Month ${payment.month}`,
      balance: payment.remainingBalance,
      principal: principalAmount - payment.remainingBalance
    }));

  return (
    <div className="loan-calculator-container">
      {/* Header */}
      <header className="loan-calculator-header">
        <div className="header-content">
          <Calculator className="header-icon" />
          <div>
            <h1>Loan Calculator</h1>
            <p>Calculate and compare loan options</p>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="loan-tabs">
        <button
          className={`loan-tab ${activeTab === 'calculator' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculator')}
        >
          <Calculator size={18} />
          <span>Calculator</span>
        </button>
        <button
          className={`loan-tab ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          <PieChart size={18} />
          <span>Comparison</span>
        </button>
        {isAuthenticated && (
          <button
            className={`loan-tab ${activeTab === 'myloans' ? 'active' : ''}`}
            onClick={() => setActiveTab('myloans')}
          >
            <FileText size={18} />
            <span>My Loans ({myLoans.length})</span>
          </button>
        )}
      </nav>

      {/* Calculator Tab */}
      {activeTab === 'calculator' && (
        <div className="calculator-content">
          {/* Loan Type Selection */}
          <section className="loan-type-section">
            <h2>Select Loan Type</h2>
            <div className="loan-type-grid">
              {Object.entries(loanTypePresets).map(([key, preset]) => (
                <button
                  key={key}
                  className={`loan-type-card ${loanType === key ? 'active' : ''}`}
                  onClick={() => handleLoanTypeChange(key)}
                >
                  <h3>{preset.name}</h3>
                  <p>{formatCurrency(preset.minAmount)} - {formatCurrency(preset.maxAmount)}</p>
                  <span className="rate-badge">{preset.defaultRate}% APR</span>
                </button>
              ))}
            </div>
          </section>

          {/* Calculator Inputs */}
          <section className="calculator-inputs">
            <div className="input-grid">
              {/* Principal Amount */}
              <div className="input-group">
                <label>
                  <DollarSign size={18} />
                  Loan Amount
                </label>
                <input
                  type="range"
                  min={currentPreset.minAmount}
                  max={currentPreset.maxAmount}
                  step="1000"
                  value={principalAmount}
                  onChange={(e) => setPrincipalAmount(parseFloat(e.target.value))}
                  className="slider"
                />
                <div className="input-display">
                  <input
                    type="number"
                    value={principalAmount}
                    onChange={(e) => setPrincipalAmount(parseFloat(e.target.value))}
                    min={currentPreset.minAmount}
                    max={currentPreset.maxAmount}
                  />
                </div>
                <div className="input-range-labels">
                  <span>{formatCurrency(currentPreset.minAmount)}</span>
                  <span>{formatCurrency(currentPreset.maxAmount)}</span>
                </div>
              </div>

              {/* Interest Rate */}
              <div className="input-group">
                <label>
                  <TrendingUp size={18} />
                  Interest Rate (APR)
                </label>
                <input
                  type="range"
                  min={currentPreset.minRate}
                  max={currentPreset.maxRate}
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                  className="slider"
                />
                <div className="input-display">
                  <input
                    type="number"
                    value={interestRate}
                    onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                    min={currentPreset.minRate}
                    max={currentPreset.maxRate}
                    step="0.1"
                  />
                  <span className="percentage">%</span>
                </div>
                <div className="input-range-labels">
                  <span>{currentPreset.minRate}%</span>
                  <span>{currentPreset.maxRate}%</span>
                </div>
              </div>

              {/* Loan Term */}
              <div className="input-group">
                <label>
                  <Calendar size={18} />
                  Loan Term
                </label>
                <div className="term-type-toggle">
                  <button
                    className={termType === 'months' ? 'active' : ''}
                    onClick={() => setTermType('months')}
                  >
                    Months
                  </button>
                  <button
                    className={termType === 'years' ? 'active' : ''}
                    onClick={() => setTermType('years')}
                  >
                    Years
                  </button>
                </div>
                {termType === 'years' ? (
                  <>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      step="1"
                      value={termYears}
                      onChange={(e) => setTermYears(parseInt(e.target.value))}
                      className="slider"
                    />
                    <div className="input-display">
                      <input
                        type="number"
                        value={termYears}
                        onChange={(e) => setTermYears(parseInt(e.target.value))}
                        min="1"
                        max="30"
                      />
                      <span className="unit">years</span>
                    </div>
                  </>
                ) : (
                  <>
                    <input
                      type="range"
                      min="6"
                      max="360"
                      step="6"
                      value={termMonths}
                      onChange={(e) => setTermMonths(parseInt(e.target.value))}
                      className="slider"
                    />
                    <div className="input-display">
                      <input
                        type="number"
                        value={termMonths}
                        onChange={(e) => setTermMonths(parseInt(e.target.value))}
                        min="6"
                        max="360"
                      />
                      <span className="unit">months</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Results Summary */}
          <section className="results-summary">
            <h2>Loan Summary</h2>
            <div className="summary-grid">
              <div className="summary-card primary">
                <div className="summary-icon">💰</div>
                <div className="summary-details">
                  <span className="summary-label">Monthly Payment</span>
                  <span className="summary-value">{formatCurrency(monthlyPayment)}</span>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon">📊</div>
                <div className="summary-details">
                  <span className="summary-label">Total Interest</span>
                  <span className="summary-value">{formatCurrency(totalInterest)}</span>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon">💵</div>
                <div className="summary-details">
                  <span className="summary-label">Total Amount</span>
                  <span className="summary-value">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon">📅</div>
                <div className="summary-details">
                  <span className="summary-label">Loan Term</span>
                  <span className="summary-value">{termMonths} months ({(termMonths / 12).toFixed(1)} years)</span>
                </div>
              </div>
            </div>
          </section>

          {/* Charts */}
          <section className="charts-section">
            <div className="chart-grid">
              {/* Pie Chart */}
              <div className="chart-card">
                <h3>Principal vs Interest</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>

              {/* Balance Over Time */}
              <div className="chart-card">
                <h3>Loan Balance Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={balanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="balance" stroke="#dc2626" name="Remaining Balance" />
                    <Line type="monotone" dataKey="principal" stroke="#2563eb" name="Principal Paid" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <section className="action-buttons">
            <button className="btn-save" onClick={saveScenario}>
              <Plus size={18} />
              Save Scenario
            </button>
            {isAuthenticated ? (
              <button className="btn-apply" onClick={() => setShowApplicationForm(true)}>
                <CheckCircle size={18} />
                Apply for This Loan
              </button>
            ) : (
              <button className="btn-apply" onClick={() => navigate('/login')}>
                <CheckCircle size={18} />
                Log In to Apply
              </button>
            )}
          </section>

          {/* Amortization Schedule */}
          <section className="amortization-section">
            <h2>Amortization Schedule</h2>
            <div className="amortization-table-container">
              <table className="amortization-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Payment</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {amortizationSchedule.map((payment, index) => (
                    <tr key={index}>
                      <td>{payment.month}</td>
                      <td>{formatCurrency(payment.totalPayment)}</td>
                      <td>{formatCurrency(payment.principalPayment)}</td>
                      <td>{formatCurrency(payment.interestPayment)}</td>
                      <td>{formatCurrency(payment.remainingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* Comparison Tab */}
      {activeTab === 'comparison' && (
        <div className="comparison-content">
          <h2>Saved Scenarios</h2>
          {savedScenarios.length === 0 ? (
            <div className="empty-state">
              <PieChart size={64} />
              <h3>No saved scenarios</h3>
              <p>Save loan scenarios from the calculator to compare them here</p>
            </div>
          ) : (
            <div className="scenarios-grid">
              {savedScenarios.map((scenario) => (
                <div key={scenario.id} className="scenario-card">
                  <div className="scenario-header">
                    <h3>{loanTypePresets[scenario.loanType].name}</h3>
                    <button
                      className="btn-delete"
                      onClick={() => setSavedScenarios(savedScenarios.filter(s => s.id !== scenario.id))}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="scenario-details">
                    <div className="detail-row">
                      <span>Loan Amount:</span>
                      <strong>{formatCurrency(scenario.principalAmount)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Interest Rate:</span>
                      <strong>{scenario.interestRate}%</strong>
                    </div>
                    <div className="detail-row">
                      <span>Term:</span>
                      <strong>{scenario.termMonths} months</strong>
                    </div>
                    <div className="detail-row highlight">
                      <span>Monthly Payment:</span>
                      <strong>{formatCurrency(scenario.monthlyPayment)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Total Interest:</span>
                      <strong>{formatCurrency(scenario.totalInterest)}</strong>
                    </div>
                  </div>
                  <div className="scenario-footer">
                    <small>Saved {formatDate(scenario.savedAt)}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Loans Tab */}
      {activeTab === 'myloans' && isAuthenticated && (
        <div className="myloans-content">
          <h2>My Loans</h2>
          {myLoans.length === 0 ? (
            <div className="empty-state">
              <FileText size={64} />
              <h3>No loans yet</h3>
              <p>Apply for a loan from the calculator to see it here</p>
            </div>
          ) : (
            <div className="loans-list">
              {myLoans.map((loan) => (
                <div key={loan._id} className="loan-card">
                  <div className="loan-header">
                    <div>
                      <h3>{loanTypePresets[loan.loanType]?.name || loan.loanType}</h3>
                      <p className="loan-purpose">{loan.loanPurpose}</p>
                    </div>
                    <span className={`status-badge status-${loan.status}`}>
                      {loan.status}
                    </span>
                  </div>
                  <div className="loan-details">
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Loan Amount</span>
                        <span className="detail-value">{formatCurrency(loan.principalAmount)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Monthly Payment</span>
                        <span className="detail-value">{formatCurrency(loan.monthlyPayment)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Interest Rate</span>
                        <span className="detail-value">{loan.interestRate}%</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Term</span>
                        <span className="detail-value">{loan.termMonths} months</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Current Balance</span>
                        <span className="detail-value">{formatCurrency(loan.currentBalance)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Next Payment</span>
                        <span className="detail-value">
                          {loan.nextPaymentDate ? formatDate(loan.nextPaymentDate) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {loan.status === 'active' && (
                    <div className="loan-progress">
                      <div className="progress-header">
                        <span>Progress: {loan.paymentsMade} / {loan.termMonths} payments</span>
                        <span>{((loan.paymentsMade / loan.termMonths) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${(loan.paymentsMade / loan.termMonths) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Application Form Modal */}
      {showApplicationForm && (
        <div className="modal-overlay" onClick={() => setShowApplicationForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Apply for {currentPreset.name}</h2>
              <button
                className="modal-close"
                onClick={() => setShowApplicationForm(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="loan-summary-preview">
                <h3>Loan Details</h3>
                <div className="summary-row">
                  <span>Loan Amount:</span>
                  <strong>{formatCurrency(principalAmount)}</strong>
                </div>
                <div className="summary-row">
                  <span>Monthly Payment:</span>
                  <strong>{formatCurrency(monthlyPayment)}</strong>
                </div>
                <div className="summary-row">
                  <span>Interest Rate:</span>
                  <strong>{interestRate}%</strong>
                </div>
                <div className="summary-row">
                  <span>Term:</span>
                  <strong>{termMonths} months</strong>
                </div>
              </div>

              <form className="application-form">
                <div className="form-group">
                  <label>Loan Purpose *</label>
                  <input
                    type="text"
                    value={applicationForm.loanPurpose}
                    onChange={(e) => setApplicationForm({ ...applicationForm, loanPurpose: e.target.value })}
                    placeholder="e.g., Home renovation, Car purchase"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Employment Status *</label>
                  <select
                    value={applicationForm.employmentStatus}
                    onChange={(e) => setApplicationForm({ ...applicationForm, employmentStatus: e.target.value })}
                  >
                    <option value="employed">Employed</option>
                    <option value="self-employed">Self-Employed</option>
                    <option value="retired">Retired</option>
                    <option value="student">Student</option>
                    <option value="unemployed">Unemployed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Annual Income</label>
                  <input
                    type="number"
                    value={applicationForm.annualIncome}
                    onChange={(e) => setApplicationForm({ ...applicationForm, annualIncome: e.target.value })}
                    placeholder="Enter your annual income"
                  />
                </div>

                <div className="form-group">
                  <label>Monthly Debts</label>
                  <input
                    type="number"
                    value={applicationForm.monthlyDebts}
                    onChange={(e) => setApplicationForm({ ...applicationForm, monthlyDebts: e.target.value })}
                    placeholder="Enter your monthly debt payments"
                  />
                </div>

                {accounts && accounts.length > 0 && (
                  <div className="form-group">
                    <label>Deposit Account (Optional)</label>
                    <select
                      value={applicationForm.accountId}
                      onChange={(e) => setApplicationForm({ ...applicationForm, accountId: e.target.value })}
                    >
                      <option value="">Select an account</option>
                      {accounts.map((account) => (
                        <option key={account._id} value={account._id}>
                          {account.accountType} - {account.accountNumber} (Balance: {formatCurrency(account.balance)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </form>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowApplicationForm(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleApplyForLoan}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
    </div>
  );
};

export default LoanCalculator;