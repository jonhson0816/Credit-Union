import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  CheckCircle, 
  Calendar,
  DollarSign,
  CreditCard,
  Building,
  User,
  FileText,
  Hash,
  Clock
} from 'lucide-react';
import './TransactionReceiptModal.css';

const TransactionReceiptModal = ({ transaction, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount) || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transaction Receipt - ${transaction.reference || 'N/A'}</title>
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
              color: ${transaction.type === 'credit' ? '#10b981' : '#dc2626'};
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
            Reference Number: ${transaction.reference || 'N/A'}
          </div>

          <div class="receipt-section">
            <h2>Transaction Details</h2>
            <div class="receipt-row">
              <span class="label">Transaction Type:</span>
              <span class="value">${transaction.type === 'credit' ? 'Credit' : 'Debit'}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Category:</span>
              <span class="value">${transaction.category || 'N/A'}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Amount:</span>
              <span class="value amount">${formatCurrency(transaction.amount)}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Date & Time:</span>
              <span class="value">${formatDate(transaction.createdAt || transaction.date)}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Status:</span>
              <span class="value">${transaction.status || 'Completed'}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Balance After:</span>
              <span class="value">${formatCurrency(transaction.balance)}</span>
            </div>
          </div>

          ${transaction.description ? `
            <div class="receipt-section">
              <h2>Description</h2>
              <p>${transaction.description}</p>
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

  const handleDownload = () => {
    const receiptContent = `
TRANSACTION RECEIPT
Navy Federal Credit Union
${'='.repeat(50)}

Reference Number: ${transaction.reference || 'N/A'}
Transaction ID: ${transaction._id || 'N/A'}

TRANSACTION DETAILS
Type: ${transaction.type === 'credit' ? 'Credit' : 'Debit'}
Category: ${transaction.category || 'N/A'}
Amount: ${formatCurrency(transaction.amount)}
Date: ${formatDate(transaction.createdAt || transaction.date)}
Status: ${transaction.status || 'Completed'}
Balance After: ${formatCurrency(transaction.balance)}

${transaction.description ? `Description: ${transaction.description}` : ''}

${'='.repeat(50)}
Generated: ${new Date().toLocaleString()}
Member FDIC
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${transaction.reference || transaction._id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!transaction) return null;

  return (
    <div className="txr-modal-overlay" onClick={onClose}>
      <div className="txr-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="txr-modal-header">
          <div className="txr-header-content">
            <div className="txr-success-icon">
              <CheckCircle size={32} />
            </div>
            <h2>Transaction Receipt</h2>
            <p>Navy Federal Credit Union</p>
          </div>
          <button onClick={onClose} className="txr-close-button">
            <X size={24} />
          </button>
        </div>

        {/* Reference Number */}
        <div className="txr-reference-banner">
          <Hash size={20} />
          <div>
            <span className="txr-ref-label">Reference Number</span>
            <span className="txr-ref-value">{transaction.reference || 'N/A'}</span>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="txr-details-section">
          <h3>Transaction Details</h3>
          
          <div className="txr-detail-grid">
            <div className="txr-detail-item">
              <div className="txr-detail-icon">
                <FileText size={20} />
              </div>
              <div className="txr-detail-content">
                <span className="txr-detail-label">Transaction Type</span>
                <span className="txr-detail-value">
                  {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                </span>
              </div>
            </div>

            <div className="txr-detail-item">
              <div className="txr-detail-icon">
                <FileText size={20} />
              </div>
              <div className="txr-detail-content">
                <span className="txr-detail-label">Category</span>
                <span className="txr-detail-value">{transaction.category || 'N/A'}</span>
              </div>
            </div>

            <div className="txr-detail-item">
              <div className="txr-detail-icon">
                <DollarSign size={20} />
              </div>
              <div className="txr-detail-content">
                <span className="txr-detail-label">Amount</span>
                <span 
                  className="txr-detail-value txr-amount"
                  style={{ color: transaction.type === 'credit' ? '#10b981' : '#dc2626' }}
                >
                  {transaction.type === 'credit' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
            </div>

            <div className="txr-detail-item">
              <div className="txr-detail-icon">
                <Calendar size={20} />
              </div>
              <div className="txr-detail-content">
                <span className="txr-detail-label">Date & Time</span>
                <span className="txr-detail-value">
                  {formatDate(transaction.createdAt || transaction.date)}
                </span>
              </div>
            </div>

            <div className="txr-detail-item">
              <div className="txr-detail-icon">
                <Clock size={20} />
              </div>
              <div className="txr-detail-content">
                <span className="txr-detail-label">Status</span>
                <span className="txr-detail-value txr-status-completed">
                  {transaction.status || 'Completed'}
                </span>
              </div>
            </div>

            <div className="txr-detail-item">
              <div className="txr-detail-icon">
                <DollarSign size={20} />
              </div>
              <div className="txr-detail-content">
                <span className="txr-detail-label">Balance After</span>
                <span className="txr-detail-value">
                  {formatCurrency(transaction.balance)}
                </span>
              </div>
            </div>

            {transaction.accountId && (
              <div className="txr-detail-item">
                <div className="txr-detail-icon">
                  <CreditCard size={20} />
                </div>
                <div className="txr-detail-content">
                  <span className="txr-detail-label">Account</span>
                  <span className="txr-detail-value">
                    {transaction.accountId.accountType || 'Account'} 
                    {' (*'}
                    {transaction.accountId.accountNumber?.slice(-4) || 'N/A'}
                    {')'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {transaction.description && (
            <div className="txr-description-box">
              <strong>Description:</strong>
              <p>{transaction.description}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="txr-action-buttons">
          <button onClick={handlePrint} className="txr-btn-action">
            <Printer size={20} />
            Print Receipt
          </button>
          <button onClick={handleDownload} className="txr-btn-action">
            <Download size={20} />
            Download Receipt
          </button>
        </div>

        {/* Footer */}
        <div className="txr-footer">
          <p>🔒 This is an official transaction receipt. Please keep for your records.</p>
        </div>
      </div>
    </div>
  );
};

export default TransactionReceiptModal;