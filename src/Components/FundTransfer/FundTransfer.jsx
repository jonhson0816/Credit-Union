import React, { useState, useEffect } from 'react';
import { ArrowRight, DollarSign, AlertCircle, ChevronDown, Check } from 'lucide-react';
import axios from 'axios';
import './FundTransfer.css';

const FundTransfer = () => {
  // Local state management
  const [accounts, setAccounts] = useState([]);
  const [selectedSourceAccount, setSelectedSourceAccount] = useState(null);
  const [selectedDestinationAccount, setSelectedDestinationAccount] = useState(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [formError, setFormError] = useState(null);
  const [transferFee, setTransferFee] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transferHistory, setTransferHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [transferNote, setTransferNote] = useState('');
  const [processingTransfer, setProcessingTransfer] = useState(false);

  // API endpoints
  const API_BASE_URL = 'http://localhost:3000/api';
  const ACCOUNTS_ENDPOINT = `${API_BASE_URL}/accounts`;
  const TRANSFER_ENDPOINT = `${API_BASE_URL}/transfers`;

  // Fetch user accounts
  useEffect(() => {
    const fetchUserAccounts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(ACCOUNTS_ENDPOINT);
        
        if (response.data && Array.isArray(response.data)) {
          // Format accounts for display
          const formattedAccounts = response.data.map(account => ({
            id: account._id,
            name: account.nickname || `${account.accountType} Account`,
            balance: account.balance,
            type: account.accountType.toLowerCase(),
            accountNumber: account.accountNumber
          }));
          
          setAccounts(formattedAccounts);
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
        setFormError('Unable to load your accounts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAccounts();
  }, []);

  // Fetch transfer history
  useEffect(() => {
    const fetchTransferHistory = async () => {
      if (showHistory) {
        try {
          const response = await axios.get(`${TRANSFER_ENDPOINT}/history`);
          
          if (response.data && response.data.success && response.data.data) {
            setTransferHistory(response.data.data);
          }
        } catch (error) {
          console.error('Error fetching transfer history:', error);
        }
      }
    };

    fetchTransferHistory();
  }, [showHistory, transferSuccess]);

  const handleSourceAccountChange = (account) => {
    setSelectedSourceAccount(account);
    // Reset error when changing source
    setFormError(null);
    
    // Calculate fee if destination is already selected
    if (selectedDestinationAccount) {
      calculateFee(account.id, selectedDestinationAccount.id, transferAmount);
    }
  };

  const handleDestinationAccountChange = (account) => {
    setSelectedDestinationAccount(account);
    // Reset error when changing destination
    setFormError(null);
    
    // Calculate fee if source is already selected
    if (selectedSourceAccount) {
      calculateFee(selectedSourceAccount.id, account.id, transferAmount);
    }
  };

  const handleAmountChange = (e) => {
    const amount = e.target.value;
    setTransferAmount(amount);
    
    // Calculate fee whenever amount changes
    if (selectedSourceAccount && selectedDestinationAccount) {
      calculateFee(selectedSourceAccount.id, selectedDestinationAccount.id, amount);
    }
  };

  const calculateFee = async (sourceId, destinationId, amount) => {
    if (!amount || parseFloat(amount) <= 0) {
      setTransferFee(0);
      return;
    }
    
    try {
      const response = await axios.get(`${TRANSFER_ENDPOINT}/calculate-fee`, {
        params: {
          sourceAccountId: sourceId,
          destinationAccountId: destinationId,
          amount: parseFloat(amount)
        }
      });
      
      if (response.data && response.data.success) {
        setTransferFee(response.data.data.fee);
      }
    } catch (error) {
      console.error('Error calculating fee:', error);
      // Fall back to client-side fee calculation if API fails
      let fee = 0;
      const parsedAmount = parseFloat(amount) || 0;
      
      const sourceAccount = accounts.find(acc => acc.id === sourceId);
      const destinationAccount = accounts.find(acc => acc.id === destinationId);
      
      if (sourceAccount && destinationAccount) {
        if (sourceAccount.type === 'investment' || destinationAccount.type === 'investment') {
          fee = parsedAmount * 0.01; // 1% fee for investment accounts
        } else if (sourceAccount.type !== destinationAccount.type) {
          fee = Math.min(parsedAmount * 0.005, 25); // 0.5% fee up to $25 for cross-account-type transfers
        }
      }
      
      setTransferFee(fee);
    }
  };

  const validateTransfer = () => {
    if (!selectedSourceAccount) {
      setFormError('Please select a source account');
      return false;
    }
    if (!selectedDestinationAccount) {
      setFormError('Please select a destination account');
      return false;
    }
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      setFormError('Please enter a valid transfer amount');
      return false;
    }
    if (parseFloat(transferAmount) > selectedSourceAccount.balance) {
      setFormError('Insufficient funds');
      return false;
    }
    return true;
  };

  const handleReviewTransfer = () => {
    setFormError(null);
    if (validateTransfer()) {
      setShowModal(true);
    }
  };

  const handleConfirmTransfer = async () => {
    // Perform transfer through API
    setProcessingTransfer(true);
    
    try {
      const response = await axios.post(`${TRANSFER_ENDPOINT}/transfer`, {
        sourceAccountId: selectedSourceAccount.id,
        destinationAccountId: selectedDestinationAccount.id,
        amount: parseFloat(transferAmount),
        fee: transferFee,
        note: transferNote
      });
      
      if (response.data && response.data.success) {
        // Update account balances from response
        const updatedAccounts = accounts.map(account => {
          if (account.id === selectedSourceAccount.id) {
            return {
              ...account,
              balance: response.data.data.sourceAccount.newBalance
            };
          }
          if (account.id === selectedDestinationAccount.id) {
            return {
              ...account,
              balance: response.data.data.destinationAccount.newBalance
            };
          }
          return account;
        });
        
        setAccounts(updatedAccounts);
        setTransferSuccess(true);
        
        // Reset form after successful transfer
        setTimeout(() => {
          setShowModal(false);
          setTransferSuccess(false);
          setSelectedSourceAccount(null);
          setSelectedDestinationAccount(null);
          setTransferAmount('');
          setTransferFee(0);
          setTransferNote('');
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Transfer failed');
      }
    } catch (error) {
      setFormError(error.response?.data?.message || error.message || 'Transfer failed. Please try again.');
      setShowModal(false);
    } finally {
      setProcessingTransfer(false);
    }
  };

  const handleCancelTransfer = () => {
    setShowModal(false);
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };
  
  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="fund-transfer-container">
      <div className="fund-transfer-header">
        <h2>Fund Transfer</h2>
        <button className="history-toggle-button" onClick={toggleHistory}>
          {showHistory ? 'Hide History' : 'Show History'}
          <ChevronDown className={`history-chevron ${showHistory ? 'rotated' : ''}`} />
        </button>
      </div>
      
      {showHistory && (
        <div className="transfer-history-section">
          <h3>Recent Transfers</h3>
          {transferHistory.length === 0 ? (
            <p className="no-history">No transfer history available</p>
          ) : (
            <div className="history-table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Amount</th>
                    <th>Fee</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {transferHistory.map(transfer => (
                    <tr key={transfer.id}>
                      <td>{transfer.date}</td>
                      <td>{transfer.from}</td>
                      <td>{transfer.to}</td>
                      <td>{formatCurrency(transfer.amount)}</td>
                      <td>{formatCurrency(transfer.fee)}</td>
                      <td>{transfer.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <div className="transfer-form">
          <div className="account-selection">
            <div className="source-accounts">
              <label>From Account</label>
              <div className="account-list">
                {accounts.map(account => (
                  <div 
                    key={account.id} 
                    className={`account-item ${selectedSourceAccount?.id === account.id ? 'selected' : ''}`}
                    onClick={() => handleSourceAccountChange(account)}
                  >
                    <div className="account-details">
                      <span className="account-name">{account.name}</span>
                      <span className="account-type">{account.type}</span>
                    </div>
                    <span className="balance">{formatCurrency(account.balance)}</span>
                    {selectedSourceAccount?.id === account.id && <Check className="check-icon" />}
                  </div>
                ))}
              </div>
            </div>

            <ArrowRight className="transfer-arrow" />

            <div className="destination-accounts">
              <label>To Account</label>
              <div className="account-list">
                {accounts
                  .filter(account => account.id !== selectedSourceAccount?.id)
                  .map(account => (
                    <div 
                      key={account.id} 
                      className={`account-item ${selectedDestinationAccount?.id === account.id ? 'selected' : ''}`}
                      onClick={() => handleDestinationAccountChange(account)}
                    >
                      <div className="account-details">
                        <span className="account-name">{account.name}</span>
                        <span className="account-type">{account.type}</span>
                      </div>
                      <span className="balance">{formatCurrency(account.balance)}</span>
                      {selectedDestinationAccount?.id === account.id && <Check className="check-icon" />}
                    </div>
                  ))
                }
              </div>
            </div>
          </div>

          <div className="transfer-amount-section">
            <label>Transfer Amount</label>
            <div className="amount-input-container">
              <DollarSign className="dollar-icon" />
              <input 
                type="number" 
                value={transferAmount}
                onChange={handleAmountChange}
                placeholder="Enter transfer amount"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          <div className="transfer-note-section">
            <label>Note (Optional)</label>
            <textarea
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              placeholder="Add a note for this transfer"
              maxLength={100}
            />
          </div>

          {formError && (
            <div className="error-message">
              <AlertCircle className="error-icon" />
              {formError}
            </div>
          )}

          <div className="transfer-summary">
            <div className="transfer-fee">
              <span>Transfer Fee:</span>
              <span>{formatCurrency(transferFee)}</span>
            </div>
            <div className="total-transfer">
              <span>Total Amount:</span>
              <span>{formatCurrency(parseFloat(transferAmount || 0) + transferFee)}</span>
            </div>
          </div>

          <button 
            className="transfer-button" 
            onClick={handleReviewTransfer}
            disabled={
              !selectedSourceAccount || 
              !selectedDestinationAccount || 
              !transferAmount || 
              parseFloat(transferAmount) <= 0 ||
              loading
            }
          >
            Review Transfer
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            {transferSuccess ? (
              <div className="success-message">
                <Check className="success-icon" />
                <h3>Transfer Successful!</h3>
                <p>Your transfer has been processed successfully.</p>
              </div>
            ) : (
              <>
                <h3>Confirm Transfer</h3>
                <div className="confirmation-details">
                  <div className="confirmation-row">
                    <span>From:</span>
                    <span>{selectedSourceAccount.name}</span>
                  </div>
                  <div className="confirmation-row">
                    <span>To:</span>
                    <span>{selectedDestinationAccount.name}</span>
                  </div>
                  <div className="confirmation-row">
                    <span>Amount:</span>
                    <span>{formatCurrency(parseFloat(transferAmount))}</span>
                  </div>
                  <div className="confirmation-row">
                    <span>Fee:</span>
                    <span>{formatCurrency(transferFee)}</span>
                  </div>
                  <div className="confirmation-row total">
                    <span>Total:</span>
                    <span>{formatCurrency(parseFloat(transferAmount) + transferFee)}</span>
                  </div>
                  {transferNote && (
                    <div className="confirmation-row note">
                      <span>Note:</span>
                      <span>{transferNote}</span>
                    </div>
                  )}
                </div>
                <div className="confirmation-buttons">
                  <button className="cancel-button" onClick={handleCancelTransfer}>Cancel</button>
                  <button 
                    className="confirm-button" 
                    onClick={handleConfirmTransfer}
                    disabled={processingTransfer}
                  >
                    {processingTransfer ? 'Processing...' : 'Confirm Transfer'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FundTransfer;