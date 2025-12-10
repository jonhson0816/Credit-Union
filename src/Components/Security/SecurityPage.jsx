import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Lock, 
  Key, 
  Smartphone, 
  AlertCircle, 
  CheckCircle,
  X,
  Eye,
  EyeOff,
  Monitor,
  MapPin,
  Clock,
  Bell,
  Mail,
  MessageSquare,
  Trash2,
  LogOut
} from 'lucide-react';
import { useNavyFederal } from '../../Context/NavyFederalContext';
import './SecurityPage.css';

const SecurityPage = () => {
  const navigate = useNavigate();
  const { currentUser, updateProfile } = useNavyFederal();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  
  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState('sms');
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Security questions state
  const [securityQuestions, setSecurityQuestions] = useState([
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' }
  ]);

  // Login history state
  const [loginHistory, setLoginHistory] = useState([]);

  // Active sessions state
  const [activeSessions, setActiveSessions] = useState([]);

  // Alert preferences state
  const [alertPreferences, setAlertPreferences] = useState({
    loginAlerts: true,
    transactionAlerts: true,
    largeTransactionAmount: 1000,
    securityAlerts: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true
  });

  // Trusted devices state
  const [trustedDevices, setTrustedDevices] = useState([]);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required');
        navigate('/login');
        return;
      }

      // Fetch security settings
      const response = await fetch('https://credit-unionapi.onrender.com/api/security/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setTwoFactorEnabled(data.data.twoFactorEnabled || false);
        setTwoFactorMethod(data.data.twoFactorMethod || 'sms');
        setPhoneNumber(data.data.phoneNumber || '');
        setSecurityQuestions(data.data.securityQuestions || securityQuestions);
        setAlertPreferences(data.data.alertPreferences || alertPreferences);
        setLoginHistory(data.data.loginHistory || []);
        setActiveSessions(data.data.activeSessions || []);
        setTrustedDevices(data.data.trustedDevices || []);
      }
    } catch (err) {
      console.error('Error fetching security data:', err);
      // Set default data if fetch fails
      setLoginHistory(generateMockLoginHistory());
      setActiveSessions(generateMockSessions());
      setTrustedDevices(generateMockDevices());
    } finally {
      setLoading(false);
    }
  };

  // Generate mock data for demonstration
  const generateMockLoginHistory = () => {
    return [
      {
        _id: '1',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        location: 'Toronto, ON, Canada',
        device: 'Chrome on Windows',
        ipAddress: '192.168.1.1',
        success: true
      },
      {
        _id: '2',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        location: 'Toronto, ON, Canada',
        device: 'Safari on iPhone',
        ipAddress: '192.168.1.2',
        success: true
      },
      {
        _id: '3',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        location: 'Toronto, ON, Canada',
        device: 'Firefox on MacOS',
        ipAddress: '192.168.1.3',
        success: true
      }
    ];
  };

  const generateMockSessions = () => {
    return [
      {
        _id: '1',
        device: 'Chrome on Windows',
        location: 'Toronto, ON',
        lastActive: new Date().toISOString(),
        isCurrent: true
      },
      {
        _id: '2',
        device: 'Safari on iPhone',
        location: 'Toronto, ON',
        lastActive: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        isCurrent: false
      }
    ];
  };

  const generateMockDevices = () => {
    return [
      {
        _id: '1',
        deviceName: 'Windows PC - Chrome',
        addedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastUsed: new Date().toISOString()
      },
      {
        _id: '2',
        deviceName: 'iPhone 13 - Safari',
        addedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch('https://credit-unionapi.onrender.com/api/security/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Password changed successfully!');
        setActiveModal(null);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (err) {
      setError('Error changing password');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('https://credit-unionapi.onrender.com/api/security/enable-2fa', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          method: twoFactorMethod,
          phoneNumber: phoneNumber
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('2FA verification code sent!');
        // Show verification input
      } else {
        setError(data.message || 'Failed to enable 2FA');
      }
    } catch (err) {
      setError('Error enabling 2FA');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('https://credit-unionapi.onrender.com/api/security/verify-2fa', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: verificationCode
        })
      });

      const data = await response.json();

      if (data.success) {
        setTwoFactorEnabled(true);
        setSuccess('Two-factor authentication enabled successfully!');
        setActiveModal(null);
        setVerificationCode('');
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch (err) {
      setError('Error verifying code');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('https://credit-unionapi.onrender.com/api/security/disable-2fa', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setTwoFactorEnabled(false);
        setSuccess('Two-factor authentication disabled');
        setActiveModal(null);
      } else {
        setError(data.message || 'Failed to disable 2FA');
      }
    } catch (err) {
      setError('Error disabling 2FA');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecurityQuestions = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('https://credit-unionapi.onrender.com/api/security/security-questions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ questions: securityQuestions })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Security questions saved successfully!');
        setActiveModal(null);
      } else {
        setError(data.message || 'Failed to save security questions');
      }
    } catch (err) {
      setError('Error saving security questions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAlertPreferences = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('https://credit-unionapi.onrender.com/api/security/alert-preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(alertPreferences)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Alert preferences saved successfully!');
        setActiveModal(null);
      } else {
        setError(data.message || 'Failed to save preferences');
      }
    } catch (err) {
      setError('Error saving preferences');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`https://credit-unionapi.onrender.com/api/security/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setActiveSessions(prev => prev.filter(s => s._id !== sessionId));
        setSuccess('Session terminated successfully');
      } else {
        setError(data.message || 'Failed to terminate session');
      }
    } catch (err) {
      setError('Error terminating session');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTrustedDevice = async (deviceId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`https://credit-unionapi.onrender.com/api/security/trusted-devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setTrustedDevices(prev => prev.filter(d => d._id !== deviceId));
        setSuccess('Device removed successfully');
      } else {
        setError(data.message || 'Failed to remove device');
      }
    } catch (err) {
      setError('Error removing device');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  if (loading && !activeSessions.length) {
    return (
      <div className="security-page-container">
        <div className="security-page-loading">Loading security settings...</div>
      </div>
    );
  }

  return (
    <div className="security-page-container">
      {/* Header */}
      <div className="security-page-header">
        <div className="security-page-header-content">
          <Shield size={32} className="security-page-header-icon" />
          <div>
            <h1>Security Center</h1>
            <p>Manage your account security and privacy settings</p>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="security-page-alert security-page-alert-success">
          <CheckCircle size={20} />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="security-page-alert-close">
            <X size={16} />
          </button>
        </div>
      )}
      
      {error && (
        <div className="security-page-alert security-page-alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError('')} className="security-page-alert-close">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Security Grid */}
      <div className="security-page-grid">
        {/* Password Section */}
        <div className="security-page-card">
          <div className="security-page-card-header">
            <Lock size={24} />
            <h2>Password</h2>
          </div>
          <p className="security-page-card-description">
            Update your password regularly to keep your account secure
          </p>
          <button 
            onClick={() => setActiveModal('password')}
            className="security-page-btn-primary"
          >
            Change Password
          </button>
        </div>

        {/* Two-Factor Authentication */}
        <div className="security-page-card">
          <div className="security-page-card-header">
            <Smartphone size={24} />
            <h2>Two-Factor Authentication</h2>
          </div>
          <div className="security-page-2fa-status">
            {twoFactorEnabled ? (
              <>
                <div className="security-page-status-badge security-page-status-active">
                  <CheckCircle size={16} />
                  <span>Enabled</span>
                </div>
                <p className="security-page-card-description">
                  Your account is protected with {twoFactorMethod === 'sms' ? 'SMS' : 'Authenticator App'} verification
                </p>
                <button 
                  onClick={() => setActiveModal('disable-2fa')}
                  className="security-page-btn-secondary"
                >
                  Disable 2FA
                </button>
              </>
            ) : (
              <>
                <div className="security-page-status-badge security-page-status-inactive">
                  <AlertCircle size={16} />
                  <span>Disabled</span>
                </div>
                <p className="security-page-card-description">
                  Add an extra layer of security to your account
                </p>
                <button 
                  onClick={() => setActiveModal('enable-2fa')}
                  className="security-page-btn-primary"
                >
                  Enable 2FA
                </button>
              </>
            )}
          </div>
        </div>

        {/* Security Questions */}
        <div className="security-page-card">
          <div className="security-page-card-header">
            <Key size={24} />
            <h2>Security Questions</h2>
          </div>
          <p className="security-page-card-description">
            Set up security questions for account recovery
          </p>
          <button 
            onClick={() => setActiveModal('security-questions')}
            className="security-page-btn-primary"
          >
            Manage Questions
          </button>
        </div>

        {/* Alert Preferences */}
        <div className="security-page-card">
          <div className="security-page-card-header">
            <Bell size={24} />
            <h2>Security Alerts</h2>
          </div>
          <p className="security-page-card-description">
            Configure how you want to be notified about account activity
          </p>
          <button 
            onClick={() => setActiveModal('alerts')}
            className="security-page-btn-primary"
          >
            Manage Alerts
          </button>
        </div>
      </div>

      {/* Login History */}
      <div className="security-page-section">
        <div className="security-page-section-header">
          <Clock size={24} />
          <h2>Recent Login Activity</h2>
        </div>
        <div className="security-page-table-container">
          <table className="security-page-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Device</th>
                <th>Location</th>
                <th>IP Address</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loginHistory.map((login) => (
                <tr key={login._id}>
                  <td>{formatDateTime(login.timestamp)}</td>
                  <td>
                    <div className="security-page-device-info">
                      <Monitor size={16} />
                      <span>{login.device}</span>
                    </div>
                  </td>
                  <td>
                    <div className="security-page-location-info">
                      <MapPin size={16} />
                      <span>{login.location}</span>
                    </div>
                  </td>
                  <td className="security-page-ip-address">{login.ipAddress}</td>
                  <td>
                    {login.success ? (
                      <span className="security-page-status-badge security-page-status-success">
                        <CheckCircle size={14} />
                        Success
                      </span>
                    ) : (
                      <span className="security-page-status-badge security-page-status-failed">
                        <AlertCircle size={14} />
                        Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="security-page-section">
        <div className="security-page-section-header">
          <Monitor size={24} />
          <h2>Active Sessions</h2>
        </div>
        <div className="security-page-sessions-grid">
          {activeSessions.map((session) => (
            <div key={session._id} className="security-page-session-card">
              <div className="security-page-session-header">
                <Monitor size={20} />
                <div className="security-page-session-info">
                  <h3>{session.device}</h3>
                  <p className="security-page-session-location">
                    <MapPin size={14} />
                    {session.location}
                  </p>
                </div>
                {session.isCurrent && (
                  <span className="security-page-current-badge">Current</span>
                )}
              </div>
              <div className="security-page-session-footer">
                <span className="security-page-session-time">
                  Last active: {getTimeAgo(session.lastActive)}
                </span>
                {!session.isCurrent && (
                  <button
                    onClick={() => handleTerminateSession(session._id)}
                    className="security-page-btn-danger-small"
                  >
                    <LogOut size={14} />
                    End Session
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trusted Devices */}
      <div className="security-page-section">
        <div className="security-page-section-header">
          <Smartphone size={24} />
          <h2>Trusted Devices</h2>
        </div>
        <div className="security-page-devices-grid">
          {trustedDevices.map((device) => (
            <div key={device._id} className="security-page-device-card">
              <div className="security-page-device-header">
                <Smartphone size={20} />
                <div>
                  <h3>{device.deviceName}</h3>
                  <p className="security-page-device-date">
                    Added: {new Date(device.addedDate).toLocaleDateString()}
                  </p>
                  <p className="security-page-device-date">
                    Last used: {getTimeAgo(device.lastUsed)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveTrustedDevice(device._id)}
                className="security-page-btn-danger-small"
              >
                <Trash2 size={14} />
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      
      {/* Change Password Modal */}
      {activeModal === 'password' && (
        <div className="security-page-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="security-page-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="security-page-modal-header">
              <h2>Change Password</h2>
              <button onClick={() => setActiveModal(null)} className="security-page-close-btn">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="security-page-form-group">
                <label>Current Password *</label>
                <div className="security-page-password-input">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="security-page-form-input"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                    className="security-page-password-toggle"
                  >
                    {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="security-page-form-group">
                <label>New Password *</label>
                <div className="security-page-password-input">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="security-page-form-input"
                    required
                    minLength="8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                    className="security-page-password-toggle"
                  >
                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="security-page-password-hint">Must be at least 8 characters long</p>
              </div>
              <div className="security-page-form-group">
                <label>Confirm New Password *</label>
                <div className="security-page-password-input">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="security-page-form-input"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                    className="security-page-password-toggle"
                  >
                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="security-page-modal-actions">
                <button type="submit" className="security-page-btn-primary" disabled={loading}>
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
                <button type="button" onClick={() => setActiveModal(null)} className="security-page-btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enable 2FA Modal */}
      {activeModal === 'enable-2fa' && (
        <div className="security-page-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="security-page-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="security-page-modal-header">
              <h2>Enable Two-Factor Authentication</h2>
              <button onClick={() => setActiveModal(null)} className="security-page-close-btn">
                <X size={24} />
              </button>
            </div>
            <div className="security-page-modal-body">
              <div className="security-page-form-group">
                <label>Verification Method</label>
                <select 
                  value={twoFactorMethod}
                  onChange={(e) => setTwoFactorMethod(e.target.value)}
                  className="security-page-form-input"
                >
                  <option value="sms">SMS Text Message</option>
                  <option value="app">Authenticator App</option>
                  <option value="email">Email</option>
                </select>
              </div>
              
              {twoFactorMethod === 'sms' && (
                <div className="security-page-form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="security-page-form-input"
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
              )}
              
              {verificationCode === '' ? (
                <div className="security-page-modal-actions">
                  <button 
                    onClick={handleEnable2FA}
                    className="security-page-btn-primary"
                    disabled={loading || (twoFactorMethod === 'sms' && !phoneNumber)}
                  >
                    {loading ? 'Sending...' : 'Send Verification Code'}
                  </button>
                  <button 
                    onClick={() => setActiveModal(null)} 
                    className="security-page-btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="security-page-form-group">
                    <label>Verification Code *</label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="security-page-form-input"
                      placeholder="Enter 6-digit code"
                      maxLength="6"
                    />
                  </div>
                  <div className="security-page-modal-actions">
                    <button 
                      onClick={handleVerify2FA}
                      className="security-page-btn-primary"
                      disabled={loading || verificationCode.length !== 6}
                    >
                      {loading ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                    <button 
                      onClick={() => {
                        setActiveModal(null);
                        setVerificationCode('');
                      }} 
                      className="security-page-btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Disable 2FA Modal */}
      {activeModal === 'disable-2fa' && (
        <div className="security-page-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="security-page-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="security-page-modal-header">
              <h2>Disable Two-Factor Authentication</h2>
              <button onClick={() => setActiveModal(null)} className="security-page-close-btn">
                <X size={24} />
              </button>
            </div>
            <div className="security-page-modal-body">
              <div className="security-page-warning-box">
                <AlertCircle size={24} />
                <div>
                  <h3>Are you sure?</h3>
                  <p>Disabling two-factor authentication will make your account less secure.</p>
                </div>
              </div>
            </div>
            <div className="security-page-modal-actions">
              <button 
                onClick={handleDisable2FA}
                className="security-page-btn-danger"
                disabled={loading}
              >
                {loading ? 'Disabling...' : 'Yes, Disable 2FA'}
              </button>
              <button 
                onClick={() => setActiveModal(null)} 
                className="security-page-btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Questions Modal */}
      {activeModal === 'security-questions' && (
        <div className="security-page-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="security-page-modal-content security-page-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="security-page-modal-header">
              <h2>Security Questions</h2>
              <button onClick={() => setActiveModal(null)} className="security-page-close-btn">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveSecurityQuestions}>
              {securityQuestions.map((sq, index) => (
                <div key={index} className="security-page-question-group">
                  <div className="security-page-form-group">
                    <label>Question {index + 1} *</label>
                    <select
                      value={sq.question}
                      onChange={(e) => {
                        const newQuestions = [...securityQuestions];
                        newQuestions[index].question = e.target.value;
                        setSecurityQuestions(newQuestions);
                      }}
                      className="security-page-form-input"
                      required
                    >
                      <option value="">Select a question...</option>
                      <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                      <option value="What city were you born in?">What city were you born in?</option>
                      <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                      <option value="What was the name of your first school?">What was the name of your first school?</option>
                      <option value="What is your favorite movie?">What is your favorite movie?</option>
                      <option value="What was your childhood nickname?">What was your childhood nickname?</option>
                    </select>
                  </div>
                  <div className="security-page-form-group">
                    <label>Answer *</label>
                    <input
                      type="text"
                      value={sq.answer}
                      onChange={(e) => {
                        const newQuestions = [...securityQuestions];
                        newQuestions[index].answer = e.target.value;
                        setSecurityQuestions(newQuestions);
                      }}
                      className="security-page-form-input"
                      placeholder="Your answer..."
                      required
                    />
                  </div>
                </div>
              ))}
              <div className="security-page-modal-actions">
                <button type="submit" className="security-page-btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Questions'}
                </button>
                <button type="button" onClick={() => setActiveModal(null)} className="security-page-btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alert Preferences Modal */}
      {activeModal === 'alerts' && (
        <div className="security-page-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="security-page-modal-content security-page-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="security-page-modal-header">
              <h2>Security Alert Preferences</h2>
              <button onClick={() => setActiveModal(null)} className="security-page-close-btn">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveAlertPreferences}>
              <div className="security-page-alerts-section">
                <h3>Alert Types</h3>
                <div className="security-page-checkbox-group">
                  <label className="security-page-checkbox-label">
                    <input
                      type="checkbox"
                      checked={alertPreferences.loginAlerts}
                      onChange={(e) => setAlertPreferences({...alertPreferences, loginAlerts: e.target.checked})}
                    />
                    <span>Login Alerts - Get notified when someone logs into your account</span>
                  </label>
                  <label className="security-page-checkbox-label">
                    <input
                      type="checkbox"
                      checked={alertPreferences.transactionAlerts}
                      onChange={(e) => setAlertPreferences({...alertPreferences, transactionAlerts: e.target.checked})}
                    />
                    <span>Transaction Alerts - Notifications for all transactions</span>
                  </label>
                  <label className="security-page-checkbox-label">
                    <input
                      type="checkbox"
                      checked={alertPreferences.securityAlerts}
                      onChange={(e) => setAlertPreferences({...alertPreferences, securityAlerts: e.target.checked})}
                    />
                    <span>Security Alerts - Critical security-related notifications</span>
                  </label>
                </div>

                {alertPreferences.transactionAlerts && (
                  <div className="security-page-form-group">
                    <label>Alert for transactions over:</label>
                    <input
                      type="number"
                      value={alertPreferences.largeTransactionAmount}
                      onChange={(e) => setAlertPreferences({...alertPreferences, largeTransactionAmount: parseFloat(e.target.value)})}
                      className="security-page-form-input"
                      min="0"
                      step="100"
                    />
                  </div>
                )}
              </div>

              <div className="security-page-alerts-section">
                <h3>Notification Methods</h3>
                <div className="security-page-checkbox-group">
                  <label className="security-page-checkbox-label">
                    <input
                      type="checkbox"
                      checked={alertPreferences.emailNotifications}
                      onChange={(e) => setAlertPreferences({...alertPreferences, emailNotifications: e.target.checked})}
                    />
                    <Mail size={18} />
                    <span>Email Notifications</span>
                  </label>
                  <label className="security-page-checkbox-label">
                    <input
                      type="checkbox"
                      checked={alertPreferences.smsNotifications}
                      onChange={(e) => setAlertPreferences({...alertPreferences, smsNotifications: e.target.checked})}
                    />
                    <MessageSquare size={18} />
                    <span>SMS Notifications</span>
                  </label>
                  <label className="security-page-checkbox-label">
                    <input
                      type="checkbox"
                      checked={alertPreferences.pushNotifications}
                      onChange={(e) => setAlertPreferences({...alertPreferences, pushNotifications: e.target.checked})}
                    />
                    <Bell size={18} />
                    <span>Push Notifications</span>
                  </label>
                </div>
              </div>

              <div className="security-page-modal-actions">
                <button type="submit" className="security-page-btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
                <button type="button" onClick={() => setActiveModal(null)} className="security-page-btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityPage;