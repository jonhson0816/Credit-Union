import React, { useState, useEffect } from 'react';
import { Shield, Lock, Smartphone, Key, AlertCircle, Check, Eye, EyeOff, Bell, History, Monitor, HelpCircle } from 'lucide-react';
import axios from 'axios';
import './SecurityCenter.css';

const SecurityCenter = () => {
  const [activeTab, setActiveTab] = useState('password');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [securitySettings, setSecuritySettings] = useState(null);

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // 2FA State
  const [twoFactorData, setTwoFactorData] = useState({
    method: 'sms',
    phoneNumber: '',
    verificationCode: ''
  });
  const [showVerificationInput, setShowVerificationInput] = useState(false);

  // Security Questions State
  const [securityQuestions, setSecurityQuestions] = useState([
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' }
  ]);

  // Alert Preferences State
  const [alertPreferences, setAlertPreferences] = useState({
    loginAlerts: true,
    transactionAlerts: true,
    largeTransactionAmount: 1000,
    securityAlerts: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true
  });

  const predefinedQuestions = [
    "What is your mother's maiden name?",
    "What was the name of your first pet?",
    "What city were you born in?",
    "What is your favorite book?",
    "What was your childhood nickname?",
    "What is the name of your favorite teacher?",
    "What street did you grow up on?",
    "What was the make of your first car?",
    "What is your favorite movie?",
    "What is your father's middle name?"
  ];

  useEffect(() => {
    fetchSecuritySettings();
  }, []);

  const fetchSecuritySettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/security/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const settings = response.data.data;
        setSecuritySettings(settings);
        
        if (settings.alertPreferences) {
          setAlertPreferences(settings.alertPreferences);
        }

        if (settings.twoFactorEnabled) {
          setTwoFactorData(prev => ({
            ...prev,
            method: settings.twoFactorMethod || 'sms',
            phoneNumber: settings.phoneNumber || ''
          }));
        }

        if (settings.securityQuestions && settings.securityQuestions.length > 0) {
          const questions = settings.securityQuestions.map(q => ({
            question: q.question,
            answer: ''
          }));
          while (questions.length < 3) {
            questions.push({ question: '', answer: '' });
          }
          setSecurityQuestions(questions);
        }
      }
    } catch (error) {
      console.error('Error fetching security settings:', error);
    }
  };

  // Password Change Handler
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3000/api/security/change-password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to change password'
      });
    } finally {
      setLoading(false);
    }
  };

  // 2FA Enable Handler
  const handleEnable2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const payload = {
        method: twoFactorData.method
      };

      if (twoFactorData.method === 'sms') {
        payload.phoneNumber = twoFactorData.phoneNumber;
      }

      const response = await axios.post(
        'http://localhost:3000/api/security/enable-2fa',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setShowVerificationInput(true);
        setMessage({
          type: 'success',
          text: `Verification code sent! ${response.data.devCode ? `Code: ${response.data.devCode}` : ''}`
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to enable 2FA'
      });
    } finally {
      setLoading(false);
    }
  };

  // 2FA Verify Handler
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3000/api/security/verify-2fa',
        { code: twoFactorData.verificationCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Two-factor authentication enabled successfully!' });
        setShowVerificationInput(false);
        setTwoFactorData(prev => ({ ...prev, verificationCode: '' }));
        await fetchSecuritySettings();
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Invalid verification code'
      });
    } finally {
      setLoading(false);
    }
  };

  // 2FA Disable Handler
  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable two-factor authentication?')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3000/api/security/disable-2fa',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Two-factor authentication disabled' });
        await fetchSecuritySettings();
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to disable 2FA'
      });
    } finally {
      setLoading(false);
    }
  };

  // Security Questions Handler
  // Security Questions Handler
const handleSaveSecurityQuestions = async (e) => {
  e.preventDefault();

  // Filter out any empty questions first
  const filledQuestions = securityQuestions.filter(q => q.question && q.answer && q.answer.trim());

  // Validation
  if (filledQuestions.length < 3) {
    setMessage({ 
      type: 'error', 
      text: `Please fill all 3 security questions. You have only filled ${filledQuestions.length}.` 
    });
    return;
  }

  // Validate each filled question
  for (let i = 0; i < filledQuestions.length; i++) {
    if (filledQuestions[i].answer.trim().length < 2) {
      setMessage({ 
        type: 'error', 
        text: `Answer ${i + 1} must be at least 2 characters long` 
      });
      return;
    }
  }

  // Create payload with only filled questions
  const payload = { 
    questions: filledQuestions.map(q => ({
      question: q.question.trim(),
      answer: q.answer.trim()
    }))
  };

  console.log('Sending security questions:', payload);

  setLoading(true);
  setMessage({ type: '', text: '' });

  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      'http://localhost:3000/api/security/security-questions',
      payload,
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    );

    if (response.data.success) {
      setMessage({ type: 'success', text: 'Security questions saved successfully!' });
      // Clear only the answers, keep the questions selected
      setSecurityQuestions(securityQuestions.map(q => ({ 
        question: q.question, 
        answer: '' 
      })));
    }
  } catch (error) {
    console.error('Error saving security questions:', error);
    
    setMessage({
      type: 'error',
      text: error.response?.data?.message || 'Failed to save security questions'
    });
  } finally {
    setLoading(false);
  }
};

  // Alert Preferences Handler
  const handleSaveAlertPreferences = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3000/api/security/alert-preferences',
        alertPreferences,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Alert preferences saved successfully!' });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save alert preferences'
      });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'password', label: 'Change Password', icon: Lock },
    { id: '2fa', label: 'Two-Factor Auth', icon: Smartphone },
    { id: 'questions', label: 'Security Questions', icon: Key },
    { id: 'alerts', label: 'Alert Preferences', icon: Bell },
    { id: 'activity', label: 'Login History', icon: History }
  ];

  return (
    <div className="security-page">
      <div className="security-page-header">
        <Shield className="security-page-icon" size={48} />
        <h1>Security Settings</h1>
        <p>Manage your account security and privacy settings</p>
      </div>

      {message.text && (
        <div className={`security-message ${message.type}`}>
          {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="security-page-container">
        {/* Sidebar */}
        <div className="security-sidebar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`security-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                setMessage({ type: '', text: '' });
              }}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="security-content">
          {/* Change Password */}
          {activeTab === 'password' && (
            <div className="security-section">
              <h2><Lock size={24} /> Change Password</h2>
              <p className="section-description">
                Create a strong password to protect your account. Use a mix of letters, numbers, and symbols.
              </p>

              <form onSubmit={handlePasswordChange} className="security-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    >
                      {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    >
                      {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    >
                      {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {/* Two-Factor Authentication */}
          {activeTab === '2fa' && (
            <div className="security-section">
              <h2><Smartphone size={24} /> Two-Factor Authentication</h2>
              <p className="section-description">
                Add an extra layer of security to your account with two-factor authentication.
              </p>

              {securitySettings?.twoFactorEnabled ? (
                <div className="status-card enabled">
                  <Check size={24} />
                  <div>
                    <h3>2FA is Enabled</h3>
                    <p>Your account is protected with {securitySettings.twoFactorMethod} verification</p>
                  </div>
                  <button onClick={handleDisable2FA} className="btn-secondary" disabled={loading}>
                    Disable 2FA
                  </button>
                </div>
              ) : (
                <form onSubmit={showVerificationInput ? handleVerify2FA : handleEnable2FA} className="security-form">
                  {!showVerificationInput ? (
                    <>
                      <div className="form-group">
                        <label>Verification Method</label>
                        <select
                          value={twoFactorData.method}
                          onChange={(e) => setTwoFactorData({ ...twoFactorData, method: e.target.value })}
                        >
                          <option value="sms">SMS (Text Message)</option>
                          <option value="email">Email</option>
                          <option value="app">Authenticator App</option>
                        </select>
                      </div>

                      {twoFactorData.method === 'sms' && (
                        <div className="form-group">
                          <label>Phone Number</label>
                          <input
                            type="tel"
                            placeholder="+1234567890"
                            value={twoFactorData.phoneNumber}
                            onChange={(e) => setTwoFactorData({ ...twoFactorData, phoneNumber: e.target.value })}
                            required
                          />
                        </div>
                      )}

                      <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Sending...' : 'Enable 2FA'}
                      </button>
                    </>
                  ) : (
                    <div className="form-group">
                      <label>Enter Verification Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        value={twoFactorData.verificationCode}
                        onChange={(e) => setTwoFactorData({ ...twoFactorData, verificationCode: e.target.value })}
                        required
                      />
                      <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Verifying...' : 'Verify Code'}
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          )}

          {/* Security Questions */}
          {activeTab === 'questions' && (
            <div className="security-section">
              <h2><Key size={24} /> Security Questions</h2>
              <p className="section-description">
                Set up security questions to help recover your account if needed.
              </p>

              <form onSubmit={handleSaveSecurityQuestions} className="security-form">
                {securityQuestions.map((q, index) => (
                  <div key={index} className="question-group">
                    <label>Security Question {index + 1}</label>
                    <select
                      value={q.question}
                      onChange={(e) => {
                        const newQuestions = [...securityQuestions];
                        newQuestions[index].question = e.target.value;
                        setSecurityQuestions(newQuestions);
                      }}
                      required
                    >
                      <option value="">Select a question...</option>
                      {predefinedQuestions.map((question, qIndex) => (
                        <option key={qIndex} value={question}>{question}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Your answer"
                      value={q.answer}
                      onChange={(e) => {
                        const newQuestions = [...securityQuestions];
                        newQuestions[index].answer = e.target.value;
                        setSecurityQuestions(newQuestions);
                      }}
                      required
                      minLength={2}
                    />
                  </div>
                ))}

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Security Questions'}
                </button>
              </form>
            </div>
          )}

          {/* Alert Preferences */}
          {activeTab === 'alerts' && (
            <div className="security-section">
              <h2><Bell size={24} /> Alert Preferences</h2>
              <p className="section-description">
                Choose how and when you want to be notified about account activity.
              </p>

              <div className="security-form">
                <div className="alert-group">
                  <h3>Security Alerts</h3>
                  <div className="checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={alertPreferences.loginAlerts}
                        onChange={(e) => setAlertPreferences({ ...alertPreferences, loginAlerts: e.target.checked })}
                      />
                      <span>Login alerts from new devices</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={alertPreferences.securityAlerts}
                        onChange={(e) => setAlertPreferences({ ...alertPreferences, securityAlerts: e.target.checked })}
                      />
                      <span>Suspicious activity alerts</span>
                    </label>
                  </div>
                </div>

                <div className="alert-group">
                  <h3>Transaction Alerts</h3>
                  <div className="checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={alertPreferences.transactionAlerts}
                        onChange={(e) => setAlertPreferences({ ...alertPreferences, transactionAlerts: e.target.checked })}
                      />
                      <span>All transaction alerts</span>
                    </label>
                    <div className="form-group">
                      <label>Alert for transactions over</label>
                      <input
                        type="number"
                        value={alertPreferences.largeTransactionAmount}
                        onChange={(e) => setAlertPreferences({ ...alertPreferences, largeTransactionAmount: parseFloat(e.target.value) })}
                        min={0}
                      />
                    </div>
                  </div>
                </div>

                <div className="alert-group">
                  <h3>Notification Methods</h3>
                  <div className="checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={alertPreferences.emailNotifications}
                        onChange={(e) => setAlertPreferences({ ...alertPreferences, emailNotifications: e.target.checked })}
                      />
                      <span>Email notifications</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={alertPreferences.smsNotifications}
                        onChange={(e) => setAlertPreferences({ ...alertPreferences, smsNotifications: e.target.checked })}
                      />
                      <span>SMS notifications</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={alertPreferences.pushNotifications}
                        onChange={(e) => setAlertPreferences({ ...alertPreferences, pushNotifications: e.target.checked })}
                      />
                      <span>Push notifications</span>
                    </label>
                  </div>
                </div>

                <button onClick={handleSaveAlertPreferences} className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}

          {/* Login History */}
          {activeTab === 'activity' && (
            <div className="security-section">
              <h2><History size={24} /> Login History</h2>
              <p className="section-description">
                Review recent login activity and active sessions on your account.
              </p>

              <div className="activity-list">
                {securitySettings?.loginHistory && securitySettings.loginHistory.length > 0 ? (
                  securitySettings.loginHistory.map((login, index) => (
                    <div key={index} className="activity-item">
                      <Monitor size={24} />
                      <div className="activity-details">
                        <p className="activity-device">{login.device}</p>
                        <p className="activity-location">{login.location}</p>
                        <p className="activity-time">{new Date(login.timestamp).toLocaleString()}</p>
                      </div>
                      <span className={`activity-status ${login.success ? 'success' : 'failed'}`}>
                        {login.success ? 'Successful' : 'Failed'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <HelpCircle size={48} />
                    <p>No login history available</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityCenter;