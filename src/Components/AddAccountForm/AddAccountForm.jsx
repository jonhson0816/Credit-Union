import React, { useState } from 'react';
import { useNavyFederal } from '../../Context/NavyFederalContext';
import './AddAccountForm.css';

const AddAccountForm = ({ onSecurityRequired, isSecurityVerified }) => {
  const { createAccount, currentUser } = useNavyFederal();
  const [selectedAccountType, setSelectedAccountType] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const accountTypes = [
    { value: 'Savings', label: 'Savings Account', description: '2.5% APY' },
    { value: 'Credit', label: 'Credit Account', description: '12% APR' },
    { value: 'Investment', label: 'Investment Account', description: '8% APY' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedAccountType) {
      setError('Please select an account type');
      return;
    }

    setIsCreating(true);

    try {
      const newAccount = await createAccount(selectedAccountType, currentUser?._id);
      setSuccess(`${selectedAccountType} account created successfully!`);
      setSelectedAccountType('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="add-account-form">
      <form onSubmit={handleSubmit}>
        <div className="account-type-grid">
          {accountTypes.map((type) => (
            <div
              key={type.value}
              className={`account-type-card ${selectedAccountType === type.value ? 'selected' : ''}`}
              onClick={() => {
                if (!isSecurityVerified && onSecurityRequired) {
                  onSecurityRequired(type.value);
                } else {
                  setSelectedAccountType(type.value);
                }
              }}
            >
              <input
                type="radio"
                name="accountType"
                value={type.value}
                checked={selectedAccountType === type.value}
                onChange={(e) => setSelectedAccountType(e.target.value)}
              />
              <h3>{type.label}</h3>
              <p>{type.description}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="error-message" style={{ 
            color: '#dc2626', 
            padding: '10px', 
            background: '#fee2e2', 
            borderRadius: '4px',
            marginTop: '10px'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div className="success-message" style={{ 
            color: '#059669', 
            padding: '10px', 
            background: '#d1fae5', 
            borderRadius: '4px',
            marginTop: '10px'
          }}>
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={!selectedAccountType || isCreating}
          className="create-account-btn"
          style={{
            width: '100%',
            padding: '12px',
            marginTop: '20px',
            backgroundColor: selectedAccountType && !isCreating ? '#2563eb' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: selectedAccountType && !isCreating ? 'pointer' : 'not-allowed'
          }}
        >
          {isCreating ? 'Creating Account...' : 'Open Account'}
        </button>
      </form>
    </div>
  );
};

export default AddAccountForm;