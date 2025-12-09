import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  CreditCard, 
  Plus,
  Trash2,
  Edit2,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  X,
  Search,
  Filter,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { useNavyFederal } from '../../Context/NavyFederalContext';
import './BillPayment.css';

const BillPayment = () => {
  const navigate = useNavigate();
  const { accounts, createTransaction, fetchAccounts, fetchTransactions } = useNavyFederal();

  // State management
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [payees, setPayees] = useState([]);
  const [scheduledPayments, setScheduledPayments] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showAccountNumbers, setShowAccountNumbers] = useState({});

  // Form states
  const [billPayForm, setBillPayForm] = useState({
    payeeName: '',
    accountNumber: '',
    amount: '',
    billType: 'utility',
    dueDate: '',
    memo: '',
    fromAccount: '',
    recurring: false,
    frequency: 'monthly'
  });

  const [payeeForm, setPayeeForm] = useState({
    name: '',
    accountNumber: '',
    billType: 'utility',
    address: '',
    phone: '',
    website: ''
  });

  const [filterOptions, setFilterOptions] = useState({
    startDate: '',
    endDate: '',
    billType: '',
    searchTerm: '',
    status: ''
  });

  // Load data on mount
  useEffect(() => {
    loadBillPaymentData();
  }, []);

  const loadBillPaymentData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      // Load payees
      const storedPayees = localStorage.getItem('billPayees');
      if (storedPayees) {
        setPayees(JSON.parse(storedPayees));
      }

      // Load scheduled payments
      const storedScheduled = localStorage.getItem('scheduledPayments');
      if (storedScheduled) {
        setScheduledPayments(JSON.parse(storedScheduled));
      }

      // Load payment history
      const storedHistory = localStorage.getItem('paymentHistory');
      if (storedHistory) {
        setPaymentHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error('Error loading bill payment data:', error);
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

  // Format account number
  const formatAccountNumber = (number, accountId) => {
    if (!number) return 'N/A';
    if (showAccountNumbers[accountId]) {
      return number;
    }
    return `****${number.slice(-4)}`;
  };

  // Handle add payee
  const handleAddPayee = (e) => {
    e.preventDefault();
    
    const newPayee = {
      id: Date.now().toString(),
      ...payeeForm,
      createdAt: new Date().toISOString()
    };

    const updatedPayees = [...payees, newPayee];
    setPayees(updatedPayees);
    localStorage.setItem('billPayees', JSON.stringify(updatedPayees));

    setPayeeForm({
      name: '',
      accountNumber: '',
      billType: 'utility',
      address: '',
      phone: '',
      website: ''
    });
    setActiveModal(null);
    alert('Payee added successfully!');
  };

  // Handle delete payee
  const handleDeletePayee = (payeeId) => {
    if (window.confirm('Are you sure you want to delete this payee?')) {
      const updatedPayees = payees.filter(p => p.id !== payeeId);
      setPayees(updatedPayees);
      localStorage.setItem('billPayees', JSON.stringify(updatedPayees));
    }
  };

  // Handle bill payment
  const handleBillPayment = async (e) => {
    e.preventDefault();
    
    try {
      const amount = parseFloat(billPayForm.amount);
      
      if (amount <= 0) {
        alert('Payment amount must be positive');
        return;
      }

      if (!billPayForm.fromAccount) {
        alert('Please select an account to pay from');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/transactions/bill-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountNumber: billPayForm.fromAccount,
          amount: amount,
          payeeName: billPayForm.payeeName,
          accountNumber: billPayForm.accountNumber,
          billType: billPayForm.billType,
          dueDate: billPayForm.dueDate,
          memo: billPayForm.memo
        })
      });

      const data = await response.json();

      if (data.success) {
        // Add to payment history
        const newPayment = {
          id: Date.now().toString(),
          ...billPayForm,
          amount: amount,
          date: new Date().toISOString(),
          status: 'completed',
          confirmationNumber: `BP${Date.now()}`
        };

        const updatedHistory = [newPayment, ...paymentHistory];
        setPaymentHistory(updatedHistory);
        localStorage.setItem('paymentHistory', JSON.stringify(updatedHistory));

        // If recurring, add to scheduled payments
        if (billPayForm.recurring) {
          const scheduledPayment = {
            id: Date.now().toString(),
            ...billPayForm,
            amount: amount,
            nextPaymentDate: billPayForm.dueDate,
            status: 'active'
          };

          const updatedScheduled = [...scheduledPayments, scheduledPayment];
          setScheduledPayments(updatedScheduled);
          localStorage.setItem('scheduledPayments', JSON.stringify(updatedScheduled));
        }

        // Refresh accounts
        await fetchAccounts();
        await fetchTransactions();

        alert(`Bill payment successful! Confirmation #: ${newPayment.confirmationNumber}`);
        
        setBillPayForm({
          payeeName: '',
          accountNumber: '',
          amount: '',
          billType: 'utility',
          dueDate: '',
          memo: '',
          fromAccount: '',
          recurring: false,
          frequency: 'monthly'
        });
        setActiveModal(null);
      } else {
        alert(data.message || 'Bill payment failed');
      }
    } catch (error) {
      console.error('Bill payment error:', error);
      alert('Error processing bill payment');
    }
  };

  // Handle cancel scheduled payment
  const handleCancelScheduled = (paymentId) => {
    if (window.confirm('Are you sure you want to cancel this scheduled payment?')) {
      const updatedScheduled = scheduledPayments.filter(p => p.id !== paymentId);
      setScheduledPayments(updatedScheduled);
      localStorage.setItem('scheduledPayments', JSON.stringify(updatedScheduled));
      alert('Scheduled payment cancelled');
    }
  };

  // Filter payment history
  const getFilteredPayments = () => {
    return paymentHistory.filter(payment => {
      const matchesDate = (!filterOptions.startDate || new Date(payment.date) >= new Date(filterOptions.startDate)) &&
                         (!filterOptions.endDate || new Date(payment.date) <= new Date(filterOptions.endDate));
      const matchesType = !filterOptions.billType || payment.billType === filterOptions.billType;
      const matchesSearch = !filterOptions.searchTerm || 
                           payment.payeeName.toLowerCase().includes(filterOptions.searchTerm.toLowerCase());
      const matchesStatus = !filterOptions.status || payment.status === filterOptions.status;
      
      return matchesDate && matchesType && matchesSearch && matchesStatus;
    });
  };

  // Quick pay from payee
  const handleQuickPay = (payee) => {
    setBillPayForm({
      ...billPayForm,
      payeeName: payee.name,
      accountNumber: payee.accountNumber,
      billType: payee.billType
    });
    setActiveModal('payment');
  };

  const filteredPayments = getFilteredPayments();

  if (loading) {
    return (
      <div className="billpay-007-page">
        <div className="billpay-007-loading">Loading bill payment data...</div>
      </div>
    );
  }

  return (
    <div className="billpay-007-page">
      {/* Header */}
      <div className="billpay-007-header">
        <button onClick={() => navigate('/home')} className="billpay-007-back-btn">
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>
        <h1>Bill Payment Center</h1>
      </div>

      {/* Quick Actions */}
      <div className="billpay-007-quick-actions">
        <button 
          onClick={() => setActiveModal('payment')} 
          className="billpay-007-action-card billpay-007-primary"
        >
          <CreditCard size={32} />
          <h3>Pay Bill</h3>
          <p>Make a one-time payment</p>
        </button>
        <button 
          onClick={() => setActiveModal('addPayee')} 
          className="billpay-007-action-card"
        >
          <Plus size={32} />
          <h3>Add Payee</h3>
          <p>Add a new bill payee</p>
        </button>
        <button 
          onClick={() => setActiveModal('scheduled')} 
          className="billpay-007-action-card"
        >
          <Calendar size={32} />
          <h3>Scheduled Payments</h3>
          <p>View & manage scheduled bills</p>
        </button>
      </div>

      {/* My Payees Section */}
      <section className="billpay-007-section">
        <div className="billpay-007-section-header">
          <h2>My Payees</h2>
          <button 
            onClick={() => setActiveModal('addPayee')}
            className="billpay-007-btn-primary"
          >
            <Plus size={18} />
            Add Payee
          </button>
        </div>

        {payees.length > 0 ? (
          <div className="billpay-007-payees-grid">
            {payees.map(payee => (
              <div key={payee.id} className="billpay-007-payee-card">
                <div className="billpay-007-payee-header">
                  <div>
                    <h3>{payee.name}</h3>
                    <span className="billpay-007-bill-type-badge">{payee.billType}</span>
                  </div>
                  <div className="billpay-007-payee-actions">
                    <button 
                      onClick={() => handleQuickPay(payee)}
                      className="billpay-007-icon-btn billpay-007-success"
                      title="Quick Pay"
                    >
                      <DollarSign size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeletePayee(payee.id)}
                      className="billpay-007-icon-btn billpay-007-danger"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="billpay-007-payee-details">
                  <div className="billpay-007-detail-row">
                    <span>Account:</span>
                    <span>****{payee.accountNumber.slice(-4)}</span>
                  </div>
                  {payee.phone && (
                    <div className="billpay-007-detail-row">
                      <span>Phone:</span>
                      <span>{payee.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="billpay-007-empty-state">
            <CreditCard size={48} />
            <p>No payees added yet</p>
            <button 
              onClick={() => setActiveModal('addPayee')}
              className="billpay-007-btn-primary"
            >
              Add Your First Payee
            </button>
          </div>
        )}
      </section>

      {/* Scheduled Payments Section */}
      <section className="billpay-007-section">
        <div className="billpay-007-section-header">
          <h2>
            <Calendar size={24} />
            Scheduled Payments
          </h2>
          <span className="billpay-007-count-badge">
            {scheduledPayments.length}
          </span>
        </div>

        {scheduledPayments.length > 0 ? (
          <div className="billpay-007-scheduled-list">
            {scheduledPayments.map(payment => (
              <div key={payment.id} className="billpay-007-scheduled-item">
                <div className="billpay-007-scheduled-info">
                  <div>
                    <h3>{payment.payeeName}</h3>
                    <p>{payment.billType}</p>
                  </div>
                  <div className="billpay-007-scheduled-details">
                    <div className="billpay-007-amount">{formatCurrency(payment.amount)}</div>
                    <div className="billpay-007-next-date">
                      Next: {new Date(payment.nextPaymentDate).toLocaleDateString()}
                    </div>
                    <span className="billpay-007-frequency-badge">{payment.frequency}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleCancelScheduled(payment.id)}
                  className="billpay-007-btn-danger-outline"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="billpay-007-empty-state">
            <Clock size={48} />
            <p>No scheduled payments</p>
          </div>
        )}
      </section>

      {/* Payment History Section */}
      <section className="billpay-007-section">
        <div className="billpay-007-section-header">
          <h2>Payment History</h2>
        </div>

        {/* Filters */}
        <div className="billpay-007-filters">
          <div className="billpay-007-filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={filterOptions.startDate}
              onChange={(e) => setFilterOptions({...filterOptions, startDate: e.target.value})}
              className="billpay-007-filter-input"
            />
          </div>
          <div className="billpay-007-filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={filterOptions.endDate}
              onChange={(e) => setFilterOptions({...filterOptions, endDate: e.target.value})}
              className="billpay-007-filter-input"
            />
          </div>
          <div className="billpay-007-filter-group">
            <label>Bill Type</label>
            <select
              value={filterOptions.billType}
              onChange={(e) => setFilterOptions({...filterOptions, billType: e.target.value})}
              className="billpay-007-filter-input"
            >
              <option value="">All Types</option>
              <option value="utility">Utility</option>
              <option value="credit-card">Credit Card</option>
              <option value="phone">Phone/Internet</option>
              <option value="insurance">Insurance</option>
              <option value="loan">Loan</option>
              <option value="rent">Rent/Mortgage</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="billpay-007-filter-group">
            <label>Search</label>
            <div className="billpay-007-search-input">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search payee..."
                value={filterOptions.searchTerm}
                onChange={(e) => setFilterOptions({...filterOptions, searchTerm: e.target.value})}
              />
            </div>
          </div>
        </div>

        {filteredPayments.length > 0 ? (
          <div className="billpay-007-history-table-container">
            <table className="billpay-007-history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Payee</th>
                  <th>Bill Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Confirmation</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map(payment => (
                  <tr key={payment.id}>
                    <td>{new Date(payment.date).toLocaleDateString()}</td>
                    <td>{payment.payeeName}</td>
                    <td>
                      <span className="billpay-007-bill-type-badge">{payment.billType}</span>
                    </td>
                    <td className="billpay-007-amount-cell">{formatCurrency(payment.amount)}</td>
                    <td>
                      <span className={`billpay-007-status-badge billpay-007-${payment.status}`}>
                        {payment.status === 'completed' && <CheckCircle size={14} />}
                        {payment.status}
                      </span>
                    </td>
                    <td className="billpay-007-confirmation">{payment.confirmationNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="billpay-007-empty-state">
            <p>No payment history found</p>
          </div>
        )}
      </section>

      {/* Modals */}
      
      {/* Add Payee Modal */}
      {activeModal === 'addPayee' && (
        <div className="billpay-007-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="billpay-007-modal" onClick={(e) => e.stopPropagation()}>
            <div className="billpay-007-modal-header">
              <h2>Add New Payee</h2>
              <button onClick={() => setActiveModal(null)} className="billpay-007-close-btn">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddPayee} className="billpay-007-form">
              <div className="billpay-007-form-group">
                <label>Payee Name *</label>
                <input
                  type="text"
                  value={payeeForm.name}
                  onChange={(e) => setPayeeForm({...payeeForm, name: e.target.value})}
                  required
                  placeholder="Electric Company"
                  className="billpay-007-input"
                />
              </div>
              <div className="billpay-007-form-group">
                <label>Account Number *</label>
                <input
                  type="text"
                  value={payeeForm.accountNumber}
                  onChange={(e) => setPayeeForm({...payeeForm, accountNumber: e.target.value})}
                  required
                  placeholder="1234567890"
                  className="billpay-007-input"
                />
              </div>
              <div className="billpay-007-form-group">
                <label>Bill Type *</label>
                <select
                  value={payeeForm.billType}
                  onChange={(e) => setPayeeForm({...payeeForm, billType: e.target.value})}
                  className="billpay-007-input"
                  required
                >
                  <option value="utility">Utility</option>
                  <option value="credit-card">Credit Card</option>
                  <option value="phone">Phone/Internet</option>
                  <option value="insurance">Insurance</option>
                  <option value="loan">Loan</option>
                  <option value="rent">Rent/Mortgage</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="billpay-007-form-group">
                <label>Address</label>
                <textarea
                  value={payeeForm.address}
                  onChange={(e) => setPayeeForm({...payeeForm, address: e.target.value})}
                  placeholder="Payee address"
                  className="billpay-007-input"
                  rows="2"
                />
              </div>
              <div className="billpay-007-form-row">
                <div className="billpay-007-form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={payeeForm.phone}
                    onChange={(e) => setPayeeForm({...payeeForm, phone: e.target.value})}
                    placeholder="(555) 123-4567"
                    className="billpay-007-input"
                  />
                </div>
                <div className="billpay-007-form-group">
                  <label>Website</label>
                  <input
                    type="url"
                    value={payeeForm.website}
                    onChange={(e) => setPayeeForm({...payeeForm, website: e.target.value})}
                    placeholder="https://example.com"
                    className="billpay-007-input"
                  />
                </div>
              </div>
              <div className="billpay-007-modal-actions">
                <button type="submit" className="billpay-007-btn-primary">Add Payee</button>
                <button type="button" onClick={() => setActiveModal(null)} className="billpay-007-btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill Payment Modal */}
      {activeModal === 'payment' && (
        <div className="billpay-007-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="billpay-007-modal" onClick={(e) => e.stopPropagation()}>
            <div className="billpay-007-modal-header">
              <h2>Pay Bill</h2>
              <button onClick={() => setActiveModal(null)} className="billpay-007-close-btn">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleBillPayment} className="billpay-007-form">
              <div className="billpay-007-form-group">
                <label>Pay From Account *</label>
                <select
                  value={billPayForm.fromAccount}
                  onChange={(e) => setBillPayForm({...billPayForm, fromAccount: e.target.value})}
                  className="billpay-007-input"
                  required
                >
                  <option value="">Select Account</option>
                  {accounts.map(account => (
                    <option key={account._id} value={account.accountNumber}>
                      {account.accountType} - ****{account.accountNumber.slice(-4)} ({formatCurrency(account.balance)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="billpay-007-form-group">
                <label>Payee Name *</label>
                <input
                  type="text"
                  value={billPayForm.payeeName}
                  onChange={(e) => setBillPayForm({...billPayForm, payeeName: e.target.value})}
                  required
                  placeholder="Enter payee name"
                  className="billpay-007-input"
                  list="payee-suggestions"
                />
                <datalist id="payee-suggestions">
                  {payees.map(payee => (
                    <option key={payee.id} value={payee.name} />
                  ))}
                </datalist>
              </div>
              <div className="billpay-007-form-group">
                <label>Payee Account Number *</label>
                <input
                  type="text"
                  value={billPayForm.accountNumber}
                  onChange={(e) => setBillPayForm({...billPayForm, accountNumber: e.target.value})}
                  required
                  placeholder="1234567890"
                  className="billpay-007-input"
                />
              </div>
              <div className="billpay-007-form-row">
                <div className="billpay-007-form-group">
                  <label>Bill Type *</label>
                  <select
                    value={billPayForm.billType}
                    onChange={(e) => setBillPayForm({...billPayForm, billType: e.target.value})}
                    className="billpay-007-input"
                    required
                  >
                    <option value="utility">Utility</option>
                    <option value="credit-card">Credit Card</option>
                    <option value="phone">Phone/Internet</option>
                    <option value="insurance">Insurance</option>
                    <option value="loan">Loan</option>
                    <option value="rent">Rent/Mortgage</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="billpay-007-form-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={billPayForm.amount}
                    onChange={(e) => setBillPayForm({...billPayForm, amount: e.target.value})}
                    required
                    placeholder="0.00"
                    className="billpay-007-input"
                  />
                </div>
              </div>
              <div className="billpay-007-form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={billPayForm.dueDate}
                  onChange={(e) => setBillPayForm({...billPayForm, dueDate: e.target.value})}
                  className="billpay-007-input"
                />
              </div>
              <div className="billpay-007-form-group">
                <label>Memo</label>
                <textarea
                  value={billPayForm.memo}
                  onChange={(e) => setBillPayForm({...billPayForm, memo: e.target.value})}
                  placeholder="Add a note (optional)"
                  className="billpay-007-input"
                  rows="2"
                />
              </div>
              <div className="billpay-007-form-group billpay-007-checkbox-group">
                <label className="billpay-007-checkbox-label">
                  <input
                    type="checkbox"
                    checked={billPayForm.recurring}
                    onChange={(e) => setBillPayForm({...billPayForm, recurring: e.target.checked})}
                  />
                  <span>Make this a recurring payment</span>
                </label>
              </div>
              {billPayForm.recurring && (
                <div className="billpay-007-form-group">
                  <label>Frequency</label>
                  <select
                    value={billPayForm.frequency}
                    onChange={(e) => setBillPayForm({...billPayForm, frequency: e.target.value})}
                    className="billpay-007-input"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>
              )}
              <div className="billpay-007-modal-actions">
                <button type="submit" className="billpay-007-btn-primary">Confirm Payment</button>
                <button type="button" onClick={() => setActiveModal(null)} className="billpay-007-btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillPayment;