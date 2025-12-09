import React, { useState } from 'react';
import { useAuth } from '../../Context/AuthContext';
import './PasswordReset.css';

const PasswordReset = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        return;
      }

      await resetPassword(email);
      setMessage('Password reset link has been sent to your email');
    } catch (err) {
      setError('Failed to send password reset link. Please try again.');
    }
  };

  return (
    <div className="password-reset-container">
      <form onSubmit={handleSubmit} className="password-reset-form">
        <h2>Reset Your Password</h2>
        
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        
        <p className="reset-instructions">
          Enter the email address associated with your account, 
          and we'll send you a link to reset your password.
        </p>
        
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </div>
        
        <button type="submit" className="reset-button">
          Send Password Reset Link
        </button>
        
        <div className="form-footer">
          <a href="/login">Back to Login</a>
        </div>
      </form>
    </div>
  );
};

export default PasswordReset;