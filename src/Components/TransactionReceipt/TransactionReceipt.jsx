import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Share2,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  User,
  CreditCard,
  Calendar,
  Hash,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { useNavyFederal } from '../../Context/NavyFederalContext';
import './TransactionReceipt.css';

const TransactionReceipt = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();

  const { currentUser, accounts } = useNavyFederal();
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  const userName = currentUser?.fullName || userProfile?.fullName || 'Account Holder';
  
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTransactionDetails();
  }, [transactionId]);

  const fetchTransactionDetails = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }

    console.log('Fetching transaction:', transactionId);

    const response = await fetch(`/api/account-details/transaction/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch transaction details');
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      console.log('✅ Transaction data received:', data.data);
      
      // ===== CRITICAL FIX: Don't override the names from the database =====
      const transactionData = data.data;
      
      // Log what we got from database
      console.log('Database values:', {
        sourceAccountHolderName: transactionData.sourceAccountHolderName,
        destinationAccountHolderName: transactionData.destinationAccountHolderName,
        recipientName: transactionData.recipientName
      });
      
      setTransaction(transactionData);
    } else {
      throw new Error('Invalid transaction data');
    }
    
    setLoading(false);
  } catch (err) {
    console.error('Error fetching transaction:', err);
    setError(err.message);
    setLoading(false);
  }
};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAccountNumber = (number) => {
    if (!number) return 'N/A';
    return `****${number.slice(-4)}`;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed':
        return <CheckCircle size={24} className="txreceipt-status-icon-success" />;
      case 'pending':
        return <Clock size={24} className="txreceipt-status-icon-pending" />;
      case 'failed':
        return <XCircle size={24} className="txreceipt-status-icon-failed" />;
      default:
        return <AlertCircle size={24} className="txreceipt-status-icon-default" />;
    }
  };

  const getTransactionIcon = () => {
    if (transaction.type === 'credit') {
      return <TrendingUp size={48} className="txreceipt-icon-credit" />;
    } else {
      return <TrendingDown size={48} className="txreceipt-icon-debit" />;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
  const printWindow = window.open('', '_blank');
  
  // ===== CRITICAL FIX: Use ACTUAL names from the transaction, not fallbacks =====
  const actualSourceName = transaction.sourceAccountHolderName || 'Unknown Sender';
  const actualDestinationName = transaction.destinationAccountHolderName || 
                                 transaction.recipientName || 
                                 'Unknown Recipient';
  
  console.log('PDF Generation - Using names:', {
    source: actualSourceName,
    destination: actualDestinationName
  });
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Transaction Receipt - ${transaction.reference || transaction.confirmationNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px;
            color: #333;
            background: #fff;
          }
          .header {
            text-align: center;
            border-bottom: 4px solid #003366;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #003366;
            font-size: 28px;
            margin-bottom: 10px;
          }
          .bank-name {
            color: #FFB81C;
            font-size: 18px;
            font-weight: bold;
          }
          .status-badge {
            display: inline-block;
            padding: 8px 20px;
            background: #10B981;
            color: white;
            border-radius: 20px;
            font-weight: bold;
            margin-top: 15px;
          }
          .amount-section {
            text-align: center;
            background: linear-gradient(135deg, #003366 0%, #004080 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin: 30px 0;
          }
          .amount-label {
            font-size: 14px;
            color: #FFB81C;
            margin-bottom: 10px;
          }
          .amount-value {
            font-size: 42px;
            font-weight: bold;
          }
          .section {
            background: #F9FAFB;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 20px;
            border: 2px solid #E5E7EB;
          }
          .section h2 {
            color: #003366;
            font-size: 18px;
            margin-bottom: 15px;
            border-bottom: 2px solid #FFB81C;
            padding-bottom: 10px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #E5E7EB;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: 600;
            color: #6B7280;
          }
          .value {
            color: #111827;
            font-weight: 600;
            text-align: right;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #E5E7EB;
            text-align: center;
            color: #6B7280;
            font-size: 12px;
          }
          .confirmation-box {
            background: #FEF3C7;
            border: 3px dashed #F59E0B;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            margin: 20px 0;
          }
          .confirmation-box strong {
            color: #92400E;
            font-size: 16px;
          }
          .confirmation-box .conf-number {
            color: #78350F;
            font-size: 18px;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            margin-top: 5px;
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏦 OFFICIAL TRANSACTION RECEIPT</h1>
          <p class="bank-name">Navy Federal Credit Union</p>
          <span class="status-badge">${transaction.status.toUpperCase()}</span>
        </div>

        ${transaction.confirmationNumber ? `
        <div class="confirmation-box">
          <strong>Confirmation Number</strong>
          <span class="conf-number">${transaction.confirmationNumber}</span>
        </div>
        ` : ''}

        <div class="amount-section">
          <div class="amount-label">${transaction.type === 'credit' ? 'CREDITED AMOUNT' : 'DEBITED AMOUNT'}</div>
          <div class="amount-value">${formatCurrency(transaction.amount)}</div>
        </div>

        <div class="section">
          <h2>📋 Transaction Information</h2>
          <div class="detail-row">
            <span class="label">Transaction Type:</span>
            <span class="value">${transaction.category}</span>
          </div>
          <div class="detail-row">
            <span class="label">Transaction Date:</span>
            <span class="value">${formatDate(transaction.date)}</span>
          </div>
          <div class="detail-row">
            <span class="label">Reference Number:</span>
            <span class="value">${transaction.reference || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="label">Transaction Method:</span>
            <span class="value">${transaction.transactionMethod?.toUpperCase() || 'ONLINE'}</span>
          </div>
          ${transaction.fee > 0 ? `
          <div class="detail-row">
            <span class="label">Transaction Fee:</span>
            <span class="value">${formatCurrency(transaction.fee)}</span>
          </div>
          ` : ''}
          <div class="detail-row">
            <span class="label">Balance After Transaction:</span>
            <span class="value">${formatCurrency(transaction.balance)}</span>
          </div>
        </div>

        <div class="section">
          <h2>💳 From Account (Debit)</h2>
          <div class="detail-row">
            <span class="label">Account Holder:</span>
            <span class="value">${actualSourceName}</span>
          </div>
          <div class="detail-row">
            <span class="label">Account Number:</span>
            <span class="value">${formatAccountNumber(transaction.sourceAccountNumber)}</span>
          </div>
          <div class="detail-row">
            <span class="label">Account Type:</span>
            <span class="value">${transaction.sourceAccountType || 'Checking'}</span>
          </div>
          <div class="detail-row">
            <span class="label">Routing Number:</span>
            <span class="value">${transaction.sourceRoutingNumber || '256074974'}</span>
          </div>
        </div>

        ${transaction.destinationAccountNumber ? `
        <div class="section">
          <h2>🏦 To Account (Credit)</h2>
          <div class="detail-row">
            <span class="label">Recipient Name:</span>
            <span class="value">${actualDestinationName}</span>
          </div>
          <div class="detail-row">
            <span class="label">Account Number:</span>
            <span class="value">${formatAccountNumber(transaction.destinationAccountNumber)}</span>
          </div>
          <div class="detail-row">
            <span class="label">Bank Name:</span>
            <span class="value">${transaction.destinationBank || 'Navy Federal Credit Union'}</span>
          </div>
          <div class="detail-row">
            <span class="label">Routing Number:</span>
            <span class="value">${transaction.destinationRoutingNumber || '256074974'}</span>
          </div>
        </div>
        ` : ''}

        ${transaction.payeeName ? `
        <div class="section">
          <h2>📄 Bill Payment Details</h2>
          <div class="detail-row">
            <span class="label">Payee Name:</span>
            <span class="value">${transaction.payeeName}</span>
          </div>
          ${transaction.payeeAccountNumber ? `
          <div class="detail-row">
            <span class="label">Payee Account:</span>
            <span class="value">${formatAccountNumber(transaction.payeeAccountNumber)}</span>
          </div>
          ` : ''}
          ${transaction.billType ? `
          <div class="detail-row">
            <span class="label">Bill Type:</span>
            <span class="value">${transaction.billType}</span>
          </div>
          ` : ''}
        </div>
        ` : ''}

        ${transaction.description ? `
        <div class="section">
          <h2>📝 Description</h2>
          <p style="color: #111827; line-height: 1.6;">${transaction.description}</p>
        </div>
        ` : ''}

        <div class="footer">
          <p><strong>This is an official transaction receipt from Navy Federal Credit Union</strong></p>
          <p>Member FDIC • Equal Housing Lender • NMLS ID 400022</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p>Keep this receipt for your records</p>
        </div>
      </body>
    </html>
  `);
  
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 250);
};
   

  const handleShare = async () => {
    const shareData = {
      title: 'Transaction Receipt',
      text: `Transaction Receipt - ${transaction.reference || transaction.confirmationNumber}\nAmount: ${formatCurrency(transaction.amount)}\nDate: ${formatDate(transaction.date)}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        alert('Sharing not supported on this browser');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (loading) {
    return (
      <div className="txreceipt-page">
        <div className="txreceipt-loading">
          <div className="txreceipt-spinner"></div>
          <p>Loading transaction details...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="txreceipt-page">
        <div className="txreceipt-error">
          <AlertCircle size={48} />
          <h2>Unable to Load Receipt</h2>
          <p>{error || 'Transaction not found'}</p>
          <button onClick={() => navigate(-1)} className="txreceipt-btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="txreceipt-page">
      <div className="txreceipt-container">
        {/* Header */}
        <div className="txreceipt-header">
          <button onClick={() => navigate(-1)} className="txreceipt-back-btn">
            <ArrowLeft size={20} />
            <span>Back to Account</span>
          </button>
          <h1>Transaction Receipt</h1>
        </div>

        {/* Receipt Card */}
        <div className="txreceipt-card">
          {/* Bank Header */}
          <div className="txreceipt-bank-header">
            <div className="txreceipt-bank-logo">
              <Building size={32} />
            </div>
            <div className="txreceipt-bank-info">
              <h2>Navy Federal Credit Union</h2>
              <p>Member FDIC • Equal Housing Lender</p>
            </div>
            <div className="txreceipt-status-badge">
              {getStatusIcon(transaction.status)}
              <span>{transaction.status.toUpperCase()}</span>
            </div>
          </div>

          {/* Confirmation Number */}
          {transaction.confirmationNumber && (
            <div className="txreceipt-confirmation">
              <Hash size={20} />
              <div>
                <span className="txreceipt-conf-label">Confirmation Number</span>
                <span className="txreceipt-conf-value">{transaction.confirmationNumber}</span>
              </div>
            </div>
          )}

          {/* Amount Display */}
          <div className="txreceipt-amount-section">
            <div className="txreceipt-transaction-icon">
              {getTransactionIcon()}
            </div>
            <div className="txreceipt-amount-label">
              {transaction.type === 'credit' ? 'Amount Credited' : 'Amount Debited'}
            </div>
            <div className="txreceipt-amount-value">
              {formatCurrency(transaction.amount)}
            </div>
            {transaction.fee > 0 && (
              <div className="txreceipt-fee-note">
                Includes ${transaction.fee.toFixed(2)} transaction fee
              </div>
            )}
          </div>

          {/* Transaction Details */}
          <div className="txreceipt-section">
            <h3>
              <FileText size={20} />
              Transaction Information
            </h3>
            <div className="txreceipt-detail-grid">
              <div className="txreceipt-detail-row">
                <span className="txreceipt-label">Transaction Type</span>
                <span className="txreceipt-value">{transaction.category}</span>
              </div>
              <div className="txreceipt-detail-row">
                <span className="txreceipt-label">Date & Time</span>
                <span className="txreceipt-value">{formatDate(transaction.date)}</span>
              </div>
              <div className="txreceipt-detail-row">
                <span className="txreceipt-label">Reference Number</span>
                <span className="txreceipt-value">{transaction.reference || 'N/A'}</span>
              </div>
              <div className="txreceipt-detail-row">
                <span className="txreceipt-label">Transaction Method</span>
                <span className="txreceipt-value">{transaction.transactionMethod?.toUpperCase() || 'ONLINE'}</span>
              </div>
              <div className="txreceipt-detail-row">
                <span className="txreceipt-label">Balance After Transaction</span>
                <span className="txreceipt-value txreceipt-highlight">{formatCurrency(transaction.balance)}</span>
              </div>
            </div>
          </div>

          {/* From Account */}
          <div className="txreceipt-section">
            <h3>
              <CreditCard size={20} />
              From Account (Debit)
            </h3>
            <div className="txreceipt-detail-grid">
              <div className="txreceipt-detail-row">
                <span className="txreceipt-label">Account Holder</span>
                <span className="txreceipt-value">
                  {/* ===== CRITICAL FIX: Use actual database value, no fallback ===== */}
                  {transaction.sourceAccountHolderName || 'Unknown Sender'}
                </span>
              </div>
              <div className="txreceipt-detail-row">
                <span className="txreceipt-label">Account Number</span>
                <span className="txreceipt-value">{formatAccountNumber(transaction.sourceAccountNumber)}</span>
              </div>
              <div className="txreceipt-detail-row">
                <span className="txreceipt-label">Account Type</span>
                <span className="txreceipt-value">{transaction.sourceAccountType || 'Checking'}</span>
              </div>
              <div className="txreceipt-detail-row">
                <span className="txreceipt-label">Routing Number</span>
                <span className="txreceipt-value">{transaction.sourceRoutingNumber || '256074974'}</span>
              </div>
            </div>
          </div>

          {/* To Account (if transfer) */}
          {transaction.destinationAccountNumber && (
            <div className="txreceipt-section">
              <h3>
                <Building size={20} />
                To Account (Credit)
              </h3>
              <div className="txreceipt-detail-grid">
                <div className="txreceipt-detail-row">
                  <span className="txreceipt-label">Recipient Name</span>
                  <span className="txreceipt-value">
                    {/* ===== CRITICAL FIX: Use actual database value, no fallback ===== */}
                    {transaction.destinationAccountHolderName || 
                    transaction.recipientName || 
                    'Unknown Recipient'}
                  </span>
                </div>
                <div className="txreceipt-detail-row">
                  <span className="txreceipt-label">Account Number</span>
                  <span className="txreceipt-value">{formatAccountNumber(transaction.destinationAccountNumber)}</span>
                </div>
                <div className="txreceipt-detail-row">
                  <span className="txreceipt-label">Bank Name</span>
                  <span className="txreceipt-value">{transaction.destinationBank || 'Navy Federal Credit Union'}</span>
                </div>
                <div className="txreceipt-detail-row">
                  <span className="txreceipt-label">Routing Number</span>
                  <span className="txreceipt-value">{transaction.destinationRoutingNumber || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Bill Payment Details */}
          {transaction.payeeName && (
            <div className="txreceipt-section">
              <h3>
                <FileText size={20} />
                Bill Payment Details
              </h3>
              <div className="txreceipt-detail-grid">
                <div className="txreceipt-detail-row">
                  <span className="txreceipt-label">Payee Name</span>
                  <span className="txreceipt-value">{transaction.payeeName}</span>
                </div>
                {transaction.payeeAccountNumber && (
                  <div className="txreceipt-detail-row">
                    <span className="txreceipt-label">Payee Account</span>
                    <span className="txreceipt-value">{formatAccountNumber(transaction.payeeAccountNumber)}</span>
                  </div>
                )}
                {transaction.billType && (
                  <div className="txreceipt-detail-row">
                    <span className="txreceipt-label">Bill Type</span>
                    <span className="txreceipt-value">{transaction.billType}</span>
                  </div>
                )}
                {transaction.dueDate && (
                  <div className="txreceipt-detail-row">
                    <span className="txreceipt-label">Due Date</span>
                    <span className="txreceipt-value">{new Date(transaction.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {transaction.description && (
            <div className="txreceipt-section">
              <h3>
                <FileText size={20} />
                Description
              </h3>
              <p className="txreceipt-description">{transaction.description}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="txreceipt-actions">
            <button onClick={handlePrint} className="txreceipt-action-btn">
              <Printer size={20} />
              <span>Print</span>
            </button>
            <button onClick={handleDownloadPDF} className="txreceipt-action-btn">
              <Download size={20} />
              <span>Download PDF</span>
            </button>
            <button onClick={handleShare} className="txreceipt-action-btn">
              <Share2 size={20} />
              <span>Share</span>
            </button>
          </div>

          {/* Footer */}
          <div className="txreceipt-footer">
            <p>This is an official transaction receipt from Navy Federal Credit Union</p>
            <p>Keep this receipt for your records</p>
            <p className="txreceipt-footer-meta">
              Generated on {new Date().toLocaleString()} • NMLS ID 400022
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionReceipt;