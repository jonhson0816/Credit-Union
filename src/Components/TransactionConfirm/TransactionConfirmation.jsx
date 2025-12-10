import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CheckCircle, 
  Download, 
  Printer, 
  ArrowLeft, 
  Calendar,
  DollarSign,
  CreditCard,
  Building,
  User,
  FileText,
  Hash,
  Clock,
  AlertCircle,
  X
} from 'lucide-react';
import { useNavyFederal } from '../../Context/NavyFederalContext';
import './TransactionConfirmation.css';

const TransactionConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { deposit, withdraw, transferFunds, fetchAccounts, fetchTransactions, currentUser, accounts } = useNavyFederal();
  
  const [transactionData, setTransactionData] = useState(null);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [fromAccountDetails, setFromAccountDetails] = useState(false);
  const [returnAccountId, setReturnAccountId] = useState(null);

  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');

  useEffect(() => {
    // Get transaction data from navigation state
    if (location.state?.transactionData) {
      setTransactionData(location.state.transactionData);
      setFromAccountDetails(location.state.fromAccountDetails || false);
      setReturnAccountId(location.state.accountId || null);
      setIsInitialized(true);
    } else {
      // Add a small delay to check if data is coming
      const timer = setTimeout(() => {
        if (!location.state?.transactionData) {
          // If still no data after delay, redirect
          navigate('/home', { replace: true });
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [location.state, navigate]);

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

  const generateConfirmationNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN-${timestamp}-${random}`;
  };

  const handleConfirm = async () => {
  try {
    setLoading(true);
    setError('');

    const confirmationNumber = generateConfirmationNumber();
    
    // DEBUG: Log all transaction data
    console.log('=== TRANSACTION DATA DEBUG ===');
    console.log('Full transactionData:', transactionData);
    console.log('accountNumber:', transactionData.accountNumber);
    console.log('sourceAccount:', transactionData.sourceAccount);
    console.log('type:', transactionData.type);
    
    // Get the account number consistently
    const accountNumber = transactionData.accountNumber || transactionData.sourceAccount;
    
    console.log('Selected accountNumber:', accountNumber);
    
    if (!accountNumber) {
      throw new Error('Account number is required');
    }
    
    let result;
    
    // Execute the appropriate transaction based on type
    switch(transactionData.type) {
      case 'Deposit':
        result = await deposit(
          accountNumber,
          transactionData.amount,
          transactionData.description
        );
        break;
        
      case 'Withdrawal':
        result = await withdraw(
          accountNumber,
          transactionData.amount,
          transactionData.description
        );
        break;
        
      case 'Transfer':
        // Ensure we have the account number
        const sourceAcct = transactionData.sourceAccount || transactionData.accountNumber;
        
        if (!sourceAcct || !transactionData.destinationAccount) {
          throw new Error('Source and destination accounts are required for transfers');
        }

        console.log('📤 Calling transferFunds with:', {
          sourceAcct,
          destinationAccount: transactionData.destinationAccount,
          amount: transactionData.amount,
          description: transactionData.description,
          recipientName: transactionData.recipientName,
          recipientBank: transactionData.recipientBank,
          routingNumber: transactionData.routingNumber,
          sourceAccountType: transactionData.sourceAccountType
        });

        // ===== CRITICAL FIX: Pass ALL 8 parameters =====
        result = await transferFunds(
          sourceAcct,
          transactionData.destinationAccount,
          transactionData.amount,
          transactionData.description || 'Account transfer',
          transactionData.recipientName,
          transactionData.recipientBank,
          transactionData.routingNumber,
          transactionData.sourceAccountType || 'Checking'
        );
        break;
        
      case 'Bill Payment':
        // Call bill payment endpoint
        const token = localStorage.getItem('token');
        
        // Get account holder name
        const accountHolderName = currentUser?.fullName || userProfile?.fullName || 
                                `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 
                                'Account Holder';
        
        const billResponse = await fetch('https://credit-unionapi.onrender.com/api/accounts/bill-payment', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            accountNumber: accountNumber,
            sourceAccountNumber: accountNumber,
            sourceAccountHolderName: accountHolderName,
            amount: transactionData.amount,
            payeeName: transactionData.payeeName,
            billType: transactionData.billType,
            dueDate: transactionData.dueDate,
            memo: transactionData.memo
          })
        });
        
        const billData = await billResponse.json();
        if (!billData.success) throw new Error(billData.message);
        result = billData;
        break;
        
      case 'Check Order':
        // Call check order endpoint
        const checkToken = localStorage.getItem('token');
        const checkResponse = await fetch('https://credit-unionapi.onrender.com/api/accounts/order-checks', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${checkToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            accountNumber: accountNumber,
            quantity: transactionData.quantity,
            checkStyle: transactionData.checkStyle,
            startingNumber: transactionData.startingNumber,
            shippingAddress: transactionData.shippingAddress,
            deliverySpeed: transactionData.deliverySpeed
          })
        });
        
        const checkData = await checkResponse.json();
        if (!checkData.success) throw new Error(checkData.message);
        result = checkData;
        break;
        
      default:
        throw new Error('Invalid transaction type');
    }

    // Refresh data after successful transaction
    await Promise.all([
      fetchAccounts(),
      fetchTransactions()
    ]);
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('transactionCompleted'));

    const confirmedTransaction = {
      ...transactionData,
      confirmationNumber,
      status: 'completed',
      confirmedAt: new Date().toISOString(),
      newBalance: result.newBalance,
      reference: result.transaction?.reference || confirmationNumber
    };

    setConfirmationResult(confirmedTransaction);
    setIsConfirmed(true);
  } catch (err) {
    setError(err.message || 'Transaction confirmation failed');
    console.error('Confirmation error:', err);
  } finally {
    setLoading(false);
  }
};

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transaction Receipt - ${confirmationResult?.confirmationNumber || 'N/A'}</title>
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
            .success-icon {
              width: 60px;
              height: 60px;
              margin: 0 auto 20px;
              background: #10b981;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 32px;
            }
            .receipt-section {
              background: #f3f4f6;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .receipt-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .receipt-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: 600;
              color: #6b7280;
            }
            .value {
              color: #111827;
              text-align: right;
            }
            .amount {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
            .confirmation-number {
              background: #fef3c7;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
              margin: 20px 0;
              font-weight: bold;
              color: #92400e;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="success-icon">✓</div>
            <h1>Transaction Receipt</h1>
            <p>Navy Federal Credit Union</p>
          </div>
          
          <div class="confirmation-number">
            Confirmation Number: ${confirmationResult?.confirmationNumber || 'N/A'}
          </div>

          <div class="receipt-section">
            <h2>Transaction Details</h2>
            <div class="receipt-row">
              <span class="label">Transaction Type:</span>
              <span class="value">${transactionData?.type || 'N/A'}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Amount:</span>
              <span class="value amount">${formatCurrency(transactionData?.amount || 0)}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Date & Time:</span>
              <span class="value">${formatDate(confirmationResult?.confirmedAt || new Date())}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Status:</span>
              <span class="value">Completed</span>
            </div>
            ${confirmationResult?.newBalance !== undefined ? `
            <div class="receipt-row">
              <span class="label">New Balance:</span>
              <span class="value">${formatCurrency(confirmationResult.newBalance)}</span>
            </div>
            ` : ''}
            ${confirmationResult?.reference ? `
            <div class="receipt-row">
              <span class="label">Reference Number:</span>
              <span class="value">${confirmationResult.reference}</span>
            </div>
            ` : ''}
          </div>

          ${transactionData?.type === 'Transfer' ? `
          <div class="receipt-section">
            <h2>Transfer Information</h2>
            <div class="receipt-row">
              <span class="label">Account Holder:</span>
              <span class="value">${currentUser?.fullName || userProfile?.fullName || 'Account Holder'}</span>
            </div>
            <div class="receipt-row">
              <span class="label">From Account:</span>
              <span class="value">****${transactionData?.sourceAccount?.slice(-4) || 'N/A'}</span>
            </div>
            <div class="receipt-row">
              <span class="label">To Account:</span>
              <span class="value">****${transactionData?.destinationAccount?.slice(-4) || 'N/A'}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Recipient Name:</span>
              <span class="value">${transactionData?.recipientName || 'External Account'}</span>
            </div>
            ${transactionData?.recipientBank ? `
              <div class="receipt-row">
                <span class="label">Recipient Bank:</span>
                <span class="value">${transactionData.recipientBank}</span>
              </div>
            ` : ''}
          </div>
        ` : ''}

          ${transactionData?.type === 'Bill Payment' ? `
            <div class="receipt-section">
              <h2>Bill Payment Information</h2>
              <div class="receipt-row">
                <span class="label">Payee Name:</span>
                <span class="value">${transactionData?.payeeName || 'N/A'}</span>
              </div>
              <div class="receipt-row">
                <span class="label">Bill Type:</span>
                <span class="value">${transactionData?.billType || 'N/A'}</span>
              </div>
              ${transactionData?.dueDate ? `
                <div class="receipt-row">
                  <span class="label">Due Date:</span>
                  <span class="value">${new Date(transactionData.dueDate).toLocaleDateString()}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${transactionData?.description ? `
            <div class="receipt-section">
              <h2>Description</h2>
              <p>${transactionData.description}</p>
            </div>
          ` : ''}

          <div class="footer">
            <p>This is an official transaction receipt. Please keep for your records.</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Navy Federal Credit Union • Member FDIC</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleDownloadReceipt = () => {
    const receiptContent = `
TRANSACTION RECEIPT
Navy Federal Credit Union
${'='.repeat(50)}

Confirmation Number: ${confirmationResult?.confirmationNumber || 'N/A'}
Transaction Type: ${transactionData?.type || 'N/A'}
Amount: ${formatCurrency(transactionData?.amount || 0)}
Date: ${formatDate(confirmationResult?.confirmedAt || new Date())}
Status: Completed
${confirmationResult?.newBalance !== undefined ? `New Balance: ${formatCurrency(confirmationResult.newBalance)}` : ''}
${confirmationResult?.reference ? `Reference: ${confirmationResult.reference}` : ''}

${transactionData?.type === 'Transfer' ? `
TRANSFER DETAILS
Account Holder: ${currentUser?.fullName || 'Account Holder'}
From Account: ****${transactionData?.sourceAccount?.slice(-4) || 'N/A'}
To Account: ****${transactionData?.destinationAccount?.slice(-4) || 'N/A'}
Recipient Name: ${transactionData?.recipientName || 'External Account'}
${transactionData?.recipientBank ? `Recipient Bank: ${transactionData.recipientBank}` : ''}
` : ''}

${transactionData?.type === 'Bill Payment' ? `
BILL PAYMENT DETAILS
Payee: ${transactionData?.payeeName || 'N/A'}
Bill Type: ${transactionData?.billType || 'N/A'}
${transactionData?.dueDate ? `Due Date: ${new Date(transactionData.dueDate).toLocaleDateString()}` : ''}
` : ''}

${transactionData?.description ? `Description: ${transactionData.description}` : ''}

${'='.repeat(50)}
Generated: ${new Date().toLocaleString()}
Member FDIC
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${confirmationResult?.confirmationNumber || 'transaction'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleReturnToAccount = () => {
    if (fromAccountDetails && returnAccountId) {
      navigate(`/account-detail/${returnAccountId}`, { replace: true });
    } else {
      navigate('/home', { replace: true });
    }
  };

  // Show loading state while checking for data
  if (!isInitialized) {
    return (
      <div className="txconf-007-confirmation-page">
        <div className="txconf-007-loading">Loading transaction details...</div>
      </div>
    );
  }

  // If initialized but no data, show error
  if (!transactionData) {
    return (
      <div className="txconf-007-confirmation-page">
        <div className="txconf-007-error-container">
          <AlertCircle size={48} />
          <h2>No Transaction Data Found</h2>
          <p>Unable to load transaction details.</p>
          <button onClick={() => navigate('/home')} className="txconf-007-btn-primary">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="txconf-007-confirmation-page">
      {!isConfirmed ? (
        // Confirmation Screen
        <div className="txconf-007-confirmation-container">
          <div className="txconf-007-header">
            <button onClick={() => navigate(-1)} className="txconf-007-back-button">
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            <h1>Confirm Transaction</h1>
          </div>

          <div className="txconf-007-review-card">
            <div className="txconf-007-review-header">
              <AlertCircle size={24} className="txconf-007-alert-icon" />
              <h2>Please Review Your Transaction</h2>
            </div>

            <div className="txconf-007-transaction-summary">
              <div className="txconf-007-amount-display">
                <span className="txconf-007-amount-label">Transaction Amount</span>
                <span className="txconf-007-amount-value">
                  {formatCurrency(transactionData.amount)}
                </span>
              </div>

              <div className="txconf-007-detail-grid">
                <div className="txconf-007-detail-item">
                  <div className="txconf-007-detail-icon">
                    <FileText size={20} />
                  </div>
                  <div className="txconf-007-detail-content">
                    <span className="txconf-007-detail-label">Transaction Type</span>
                    <span className="txconf-007-detail-value">{transactionData.type}</span>
                  </div>
                </div>

                <div className="txconf-007-detail-item">
                  <div className="txconf-007-detail-icon">
                    <Calendar size={20} />
                  </div>
                  <div className="txconf-007-detail-content">
                    <span className="txconf-007-detail-label">Date</span>
                    <span className="txconf-007-detail-value">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="txconf-007-detail-item">
                <div className="txconf-007-detail-icon">
                  <Calendar size={20} />
                </div>
                <div className="txconf-007-detail-content">
                  <span className="txconf-007-detail-label">Date</span>
                  <span className="txconf-007-detail-value">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* ===== ADD THIS NEW SECTION ===== */}
              <div className="txconf-007-detail-item">
                <div className="txconf-007-detail-icon">
                  <User size={20} />
                </div>
                <div className="txconf-007-detail-content">
                  <span className="txconf-007-detail-label">Account Holder</span>
                  <span className="txconf-007-detail-value">
                    {currentUser?.fullName || 'Account Holder'}
                  </span>
                </div>
              </div>

                {(transactionData.sourceAccount || transactionData.accountNumber) && (
                  <div className="txconf-007-detail-item">
                    <div className="txconf-007-detail-icon">
                      <CreditCard size={20} />
                    </div>
                    <div className="txconf-007-detail-content">
                      <span className="txconf-007-detail-label">Account</span>
                      <span className="txconf-007-detail-value">
                        ****{(transactionData.sourceAccount || transactionData.accountNumber).slice(-4)}
                      </span>
                    </div>
                  </div>
                )}

                {transactionData.destinationAccount && (
                  <div className="txconf-007-detail-item">
                    <div className="txconf-007-detail-icon">
                      <CreditCard size={20} />
                    </div>
                    <div className="txconf-007-detail-content">
                      <span className="txconf-007-detail-label">To Account</span>
                      <span className="txconf-007-detail-value">
                        ****{transactionData.destinationAccount.slice(-4)}
                      </span>
                    </div>
                  </div>
                )}

                {transactionData.depositMethod && (
                  <div className="txconf-007-detail-item">
                    <div className="txconf-007-detail-icon">
                      <DollarSign size={20} />
                    </div>
                    <div className="txconf-007-detail-content">
                      <span className="txconf-007-detail-label">Deposit Method</span>
                      <span className="txconf-007-detail-value">
                        {transactionData.depositMethod.charAt(0).toUpperCase() + transactionData.depositMethod.slice(1)}
                      </span>
                    </div>
                  </div>
                )}

                {transactionData.withdrawMethod && (
                  <div className="txconf-007-detail-item">
                    <div className="txconf-007-detail-icon">
                      <DollarSign size={20} />
                    </div>
                    <div className="txconf-007-detail-content">
                      <span className="txconf-007-detail-label">Withdrawal Method</span>
                      <span className="txconf-007-detail-value">
                        {transactionData.withdrawMethod.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}

                {transactionData.recipientName && (
                  <div className="txconf-007-detail-item">
                    <div className="txconf-007-detail-icon">
                      <User size={20} />
                    </div>
                    <div className="txconf-007-detail-content">
                      <span className="txconf-007-detail-label">Recipient Name</span>
                      <span className="txconf-007-detail-value">{transactionData.recipientName}</span>
                    </div>
                  </div>
                )}

                {transactionData.recipientBank && (
                  <div className="txconf-007-detail-item">
                    <div className="txconf-007-detail-icon">
                      <Building size={20} />
                    </div>
                    <div className="txconf-007-detail-content">
                      <span className="txconf-007-detail-label">Recipient Bank</span>
                      <span className="txconf-007-detail-value">{transactionData.recipientBank}</span>
                    </div>
                  </div>
                )}

                {transactionData.payeeName && (
                  <div className="txconf-007-detail-item">
                    <div className="txconf-007-detail-icon">
                      <User size={20} />
                    </div>
                    <div className="txconf-007-detail-content">
                      <span className="txconf-007-detail-label">Payee Name</span>
                      <span className="txconf-007-detail-value">{transactionData.payeeName}</span>
                    </div>
                  </div>
                )}

                {transactionData.billType && (
                  <div className="txconf-007-detail-item">
                    <div className="txconf-007-detail-icon">
                      <FileText size={20} />
                    </div>
                    <div className="txconf-007-detail-content">
                      <span className="txconf-007-detail-label">Bill Type</span>
                      <span className="txconf-007-detail-value">
                        {transactionData.billType.charAt(0).toUpperCase() + transactionData.billType.slice(1)}
                      </span>
                    </div>
                  </div>
                )}

                {transactionData.description && (
                  <div className="txconf-007-detail-item txconf-007-full-width">
                    <div className="txconf-007-detail-icon">
                      <FileText size={20} />
                    </div>
                    <div className="txconf-007-detail-content">
                      <span className="txconf-007-detail-label">Description</span>
                      <span className="txconf-007-detail-value">{transactionData.description}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="txconf-007-error-message">
                <X size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="txconf-007-confirmation-actions">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="txconf-007-btn-confirm"
              >
                {loading ? (
                  <>
                    <span className="txconf-007-spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Confirm Transaction
                  </>
                )}
              </button>
              <button
                onClick={() => navigate(-1)}
                disabled={loading}
                className="txconf-007-btn-cancel"
              >
                Cancel
              </button>
            </div>

            <div className="txconf-007-security-notice">
              <p>🔒 Your transaction is secure and encrypted</p>
            </div>
          </div>
        </div>
      ) : (
        // Success Screen
        <div className="txconf-007-success-container">
          <div className="txconf-007-success-card">
            <div className="txconf-007-success-icon">
              <CheckCircle size={64} />
            </div>

            <h1 className="txconf-007-success-title">Transaction Successful!</h1>
            <p className="txconf-007-success-subtitle">
              Your transaction has been completed successfully
            </p>

            <div className="txconf-007-confirmation-number">
              <Hash size={20} />
              <div>
                <span className="txconf-007-conf-label">Confirmation Number</span>
                <span className="txconf-007-conf-value">
                  {confirmationResult?.confirmationNumber}
                </span>
              </div>
            </div>

            <div className="txconf-007-success-details">
              <div className="txconf-007-success-amount">
                {formatCurrency(transactionData.amount)}
              </div>
              <div className="txconf-007-success-meta">
                <Clock size={16} />
                <span>{formatDate(confirmationResult?.confirmedAt)}</span>
              </div>
              {confirmationResult?.newBalance !== undefined && (
                <div className="txconf-007-success-meta">
                  <DollarSign size={16} />
                  <span>New Balance: {formatCurrency(confirmationResult.newBalance)}</span>
                </div>
              )}
            </div>

            <div className="txconf-007-receipt-section">
              <h3>Transaction Details</h3>
              <div className="txconf-007-receipt-grid">
                <div className="txconf-007-receipt-row">
                  <span>Type:</span>
                  <span>{transactionData.type}</span>
                </div>
                <div className="txconf-007-receipt-row">
                  <span>Status:</span>
                  <span className="txconf-007-status-completed">Completed</span>
                </div>
                {(transactionData.sourceAccount || transactionData.accountNumber) && (
                  <div className="txconf-007-receipt-row">
                    <span>Account:</span>
                    <span>****{(transactionData.sourceAccount || transactionData.accountNumber).slice(-4)}</span>
                  </div>
                )}
                {transactionData.destinationAccount && (
                  <div className="txconf-007-receipt-row">
                    <span>To:</span>
                    <span>****{transactionData.destinationAccount.slice(-4)}</span>
                  </div>
                )}
                {confirmationResult?.reference && (
                  <div className="txconf-007-receipt-row">
                    <span>Reference:</span>
                    <span>{confirmationResult.reference}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="txconf-007-action-buttons">
              <button onClick={handlePrintReceipt} className="txconf-007-btn-action">
                <Printer size={20} />
                Print Receipt
              </button>
              <button onClick={handleDownloadReceipt} className="txconf-007-btn-action">
                <Download size={20} />
                Download Receipt
              </button>
            </div>

            <div className="txconf-007-navigation-buttons">
              <button
                onClick={handleReturnToAccount}
                className="txconf-007-btn-primary"
              >
                {fromAccountDetails ? 'Return to Account' : 'Return to Home'}
              </button>
              <button
                onClick={() => navigate('/transactions')}
                className="txconf-007-btn-secondary"
              >
                View All Transactions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionConfirmation;