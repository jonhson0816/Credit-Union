import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AccountSettings.css';

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api' 
  : 'https://credit-unionapi.onrender.com/api';

const AccountSettings = () => {
  const [settings, setSettings] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    notifications: true,
    security: false,
    display: false,
    paperless: false
  });
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [activeTab, setActiveTab] = useState('notifications');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch settings from API on component mount
  useEffect(() => {
  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required. Please log in.');
        setIsLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/account-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSettings(response.data);
      
      // Initialize email from fetched settings
      if (response.data.paperlessSettings && response.data.paperlessSettings.emailForStatements) {
        setNewEmail(response.data.paperlessSettings.emailForStatements);
      }
      
      // Initialize phone from fetched settings
      if (response.data.notifications && response.data.notifications.sms.verifiedPhone) {
        setNewPhone(response.data.notifications.sms.verifiedPhone);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching account settings:', err);
      setError('Failed to load account settings. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  fetchSettings();
}, []);


  // Toggle expanded section
  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Handle toggle switches for boolean settings
  const handleToggleSwitch = async (path) => {
    if (!settings) return;
    
    try {
      // Create a deep copy of settings
      const updatedSettings = JSON.parse(JSON.stringify(settings));
      
      // Navigate to the correct setting and toggle it
      const keys = path.split('.');
      let current = updatedSettings;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      const lastKey = keys[keys.length - 1];
      current[lastKey] = !current[lastKey];
      
      // Optimistically update UI
      setSettings(updatedSettings);
      
      // Determine which API endpoint to call based on the path
      let endpoint = '/api/account-settings';
      let payload = {};
      
      // Handle different section updates
      if (path.startsWith('notifications')) {
        // For notification toggles
        const channel = keys[1]; // email, sms, or pushNotifications
        endpoint = `${API_URL}/account-settings/notifications`;
        payload = {
          channel,
          settings: updatedSettings.notifications[channel]
        };
      } else if (path.startsWith('paperlessSettings.paperlessStatements')) {
        // For paperless toggle
        endpoint = `${API_URL}/account-settings/paperless`;
        payload = {
          enabled: current[lastKey]
        };
      } else if (path.startsWith('securitySettings')) {
        // For security settings updates
        endpoint = `${API_URL}/account-settings/securitySettings`;
        payload = {
          securitySettings: updatedSettings.securitySettings
        };
      } else if (path.startsWith('displayPreferences')) {
        // For display preferences
        endpoint = `${API_URL}/account-settings/displayPreferences`;
        payload = updatedSettings.displayPreferences;
      } else {
        // Generic update using the updateSettingsSection endpoint
        const section = keys[0];
        endpoint = `${API_URL}/account-settings/${section}`;
        payload = updatedSettings[section];
      }
      
      // Make API call
      const method = endpoint.includes('paperless') ? 'post' : 'patch';
        const response = await axios[method](endpoint, payload, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      
      // Show confirmation message
      const settingName = formatSettingName(path);
      const isEnabled = current[lastKey];
      
      setConfirmationMessage(`${settingName} has been ${isEnabled ? 'enabled' : 'disabled'}`);
      setShowConfirmation(true);
      
      setTimeout(() => {
        setShowConfirmation(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error updating setting:', err);
      
      // Revert the optimistic update
      const response = await axios.get(`${API_URL}/account-settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSettings(response.data);
      
      // Show error message
      setConfirmationMessage('Failed to update setting. Please try again.');
      setShowConfirmation(true);
      
      setTimeout(() => {
        setShowConfirmation(false);
      }, 3000);
    }
  };

  // Handle select change (for dropdowns)
  const handleSelectChange = async (path, value) => {
    if (!settings) return;
    
    try {
      // Create a deep copy of settings
      const updatedSettings = JSON.parse(JSON.stringify(settings));
      
      // Navigate to the correct setting and update it
      const keys = path.split('.');
      let current = updatedSettings;
      
      // Create nested objects if they don't exist
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      const lastKey = keys[keys.length - 1];
      current[lastKey] = value;
      
      // Optimistically update UI
      setSettings(updatedSettings);
      
      // Determine which section this belongs to for the API call
      const section = keys[0];
      const endpoint = `${API_URL}/account-settings/${section}`;
      
      // Make API call
      await axios.patch(endpoint, updatedSettings[section], {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Show confirmation
      setConfirmationMessage('Setting updated successfully');
      setShowConfirmation(true);
      
      setTimeout(() => {
        setShowConfirmation(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error updating setting:', err);
      
      // Revert the optimistic update
      const response = await axios.get(`${API_URL}/account-settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSettings(response.data);
      
      // Show error message
      setConfirmationMessage('Failed to update setting. Please try again.');
      setShowConfirmation(true);
      
      setTimeout(() => {
        setShowConfirmation(false);
      }, 3000);
    }
  };

  // Handle email update
  const handleSaveEmail = async () => {
    if (!validateEmail(newEmail)) {
      alert('Please enter a valid email address');
      return;
    }
    
    try {
      // Make API call
      await axios.post(`${API_URL}/account-settings/email`, { email: newEmail }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Update settings locally
      setSettings(prev => ({
        ...prev,
        paperlessSettings: {
          ...prev.paperlessSettings,
          emailForStatements: newEmail
        }
      }));
      
      setIsEditingEmail(false);
      setConfirmationMessage('Email updated successfully');
      setShowConfirmation(true);
      
      setTimeout(() => {
        setShowConfirmation(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error updating email:', err);
      setConfirmationMessage('Failed to update email. Please try again.');
      setShowConfirmation(true);
      
      setTimeout(() => {
        setShowConfirmation(false);
      }, 3000);
    }
  };

  // Handle phone update
  const handleSavePhone = async () => {
    if (!validatePhone(newPhone)) {
      alert('Please enter a valid phone number');
      return;
    }
    
    try {
      // Make API call
      await axios.post(`${API_URL}/account-settings/phone`, { phoneNumber: newPhone }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Update settings locally
      setSettings(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          sms: {
            ...prev.notifications.sms,
            verifiedPhone: newPhone,
            enabled: true
          }
        }
      }));
      
      setIsEditingPhone(false);
      setConfirmationMessage('Phone number updated successfully');
      setShowConfirmation(true);
      
      setTimeout(() => {
        setShowConfirmation(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error updating phone:', err);
      setConfirmationMessage('Failed to update phone. Please try again.');
      setShowConfirmation(true);
      
      setTimeout(() => {
        setShowConfirmation(false);
      }, 3000);
    }
  };
  
  // Handle 2FA setup
  const setupTwoFactor = async (method) => {
    try {
      // Make API call
      await axios.post(`${API_URL}/account-settings/twoFactor`, { method }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Update settings locally
      setSettings(prev => ({
        ...prev,
        securitySettings: {
          ...prev.securitySettings,
          twoFactorAuthentication: {
            ...prev.securitySettings.twoFactorAuthentication,
            enabled: true,
            method: method,
            lastVerified: new Date().toISOString()
          }
        }
      }));
      
      setConfirmationMessage('Two-factor authentication enabled successfully');
      setShowConfirmation(true);
      setIsModalOpen(false);
      
      setTimeout(() => {
        setShowConfirmation(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error setting up 2FA:', err);
      
      if (err.response && err.response.status === 400 && err.response.data.message.includes('Phone')) {
        setConfirmationMessage('Phone number must be verified before enabling SMS 2FA');
      } else {
        setConfirmationMessage('Failed to enable two-factor authentication. Please try again.');
      }
      
      setShowConfirmation(true);
      
      setTimeout(() => {
        setShowConfirmation(false);
      }, 3000);
    }
  };
  
  // Handle biometric setup
  const setupBiometric = async (methods) => {
    try {
      // Make API call
      await axios.post(`${API_URL}/account-settings/biometric`, { methods }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Update settings locally
      setSettings(prev => ({
        ...prev,
        securitySettings: {
          ...prev.securitySettings,
          biometricLogin: {
            ...prev.securitySettings.biometricLogin,
            enabled: true,
            supportedMethods: methods,
            lastConfigured: new Date().toISOString()
          }
        }
      }));
      
      setConfirmationMessage('Biometric login enabled successfully');
      setShowConfirmation(true);
      setIsModalOpen(false);
      
      setTimeout(() => {
        setShowConfirmation(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error setting up biometric login:', err);
      setConfirmationMessage('Failed to enable biometric login. Please try again.');
      setShowConfirmation(true);
      
      setTimeout(() => {
        setShowConfirmation(false);
      }, 3000);
    }
  };
  
  // Handle clearing pending actions
  const clearPendingAction = async (action) => {
    try {
      // Make API call
      await axios.post(`${API_URL}/account-settings/pendingAction`, { action }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Update settings locally
      setSettings(prev => ({
        ...prev,
        accountActivity: {
          ...prev.accountActivity,
          pendingActions: prev.accountActivity.pendingActions.filter(item => item !== action)
        }
      }));
      
      setConfirmationMessage('Action completed successfully');
      setShowConfirmation(true);
      
      setTimeout(() => {
        setShowConfirmation(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error clearing pending action:', err);
      setConfirmationMessage('Failed to complete action. Please try again.');
      setShowConfirmation(true);
      
      setTimeout(() => {
        setShowConfirmation(false);
      }, 3000);
    }
  };

  // Email validation helper
  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };
  
  // Phone validation helper
  const validatePhone = (phone) => {
    return phone && phone.length >= 10;
  };

  // Open modal with specified content
  const openModal = (content) => {
    setModalContent(content);
    setIsModalOpen(true);
  };
  
  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  // Helper to format setting names for display
  const formatSettingName = (path) => {
    const parts = path.split('.');
    const lastPart = parts[parts.length - 1];
    
    return lastPart
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };
  
  // Helper to format category names for display
  const formatCategoryName = (name) => {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  // Render category checkboxes for notification types
  const renderCategoryCheckboxes = (basePath, categories) => {
    if (!categories) return null;
    
    return Object.keys(categories).map(category => (
      <div className="category-item" key={category}>
        <label>
          <input
            type="checkbox"
            checked={categories[category]}
            onChange={() => handleToggleSwitch(`${basePath}.categories.${category}`)}
          />
          {formatCategoryName(category)}
        </label>
      </div>
    ));
  };

  // Render recent logins
  const renderRecentLogins = () => {
    if (!settings || !settings.securitySettings || !settings.securitySettings.recentLogins) {
      return <p>No recent login data available</p>;
    }
    
    return settings.securitySettings.recentLogins.map((login, index) => {
      const date = new Date(login.date);
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      return (
        <div className="recent-login-item" key={index}>
          <div className="login-device-icon">
            <i className={login.device.includes('iPhone') || login.device.includes('Android') ? 'fas fa-mobile-alt' : 'fas fa-laptop'}></i>
          </div>
          <div className="login-details">
            <div className="login-device">{login.device}</div>
            <div className="login-location">{login.location}</div>
            <div className="login-time">{formattedDate} at {formattedTime}</div>
          </div>
        </div>
      );
    });
  };

  // Render pending actions
  const renderPendingActions = () => {
    if (!settings || !settings.accountActivity || !settings.accountActivity.pendingActions || settings.accountActivity.pendingActions.length === 0) {
      return <p>No pending actions</p>;
    }
    
    return settings.accountActivity.pendingActions.map((action, index) => (
      <div className="pending-action-item" key={index}>
        <span>{action}</span>
        <button 
          className="action-button"
          onClick={() => clearPendingAction(action)}
        >
          Complete
        </button>
      </div>
    ));
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="account-settings-loading">
        <div className="spinner"></div>
        <p>Loading your settings...</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="account-settings-error">
        <div className="error-icon">❌</div>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }
  
  // If settings haven't loaded yet
  if (!settings) {
    return null;
  }

  return (
    <div className="account-settings-container">
      <h1>Account Settings</h1>
      
      {/* Tabs */}
      <div className="settings-tabs">
        <button 
          className={activeTab === 'notifications' ? 'active' : ''} 
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </button>
        <button 
          className={activeTab === 'security' ? 'active' : ''} 
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
        <button 
          className={activeTab === 'display' ? 'active' : ''} 
          onClick={() => setActiveTab('display')}
        >
          Display
        </button>
        <button 
          className={activeTab === 'paperless' ? 'active' : ''} 
          onClick={() => setActiveTab('paperless')}
        >
          Paperless
        </button>
      </div>
      
      {/* Content based on active tab */}
      <div className="settings-content">
        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="settings-section">
            <h2>Notification Preferences</h2>
            
            {/* Email Notifications */}
            <div className="settings-group">
              <div className="settings-header" onClick={() => toggleSection('emailNotifications')}>
                <h3>Email Notifications</h3>
                <span className={expandedSections.emailNotifications ? 'chevron up' : 'chevron down'}></span>
              </div>
              
              {expandedSections.emailNotifications && (
                <div className="settings-details">
                  <div className="settings-row">
                    <span>Enable Email Notifications</span>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.email.enabled} 
                        onChange={() => handleToggleSwitch('notifications.email.enabled')}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  
                  {settings.notifications.email.enabled && (
                    <>
                      <div className="settings-row">
                        <span>Email Frequency</span>
                        <select 
                          value={settings.notifications.email.frequency}
                          onChange={(e) => handleSelectChange('notifications.email.frequency', e.target.value)}
                        >
                          <option value="immediate">Immediate</option>
                          <option value="daily">Daily Digest</option>
                          <option value="weekly">Weekly Digest</option>
                        </select>
                      </div>
                      
                      <div className="settings-row">
                        <span>Categories</span>
                        <div className="categories-container">
                          {renderCategoryCheckboxes('notifications.email', settings.notifications.email.categories)}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* SMS Notifications */}
            <div className="settings-group">
              <div className="settings-header" onClick={() => toggleSection('smsNotifications')}>
                <h3>SMS Notifications</h3>
                <span className={expandedSections.smsNotifications ? 'chevron up' : 'chevron down'}></span>
              </div>
              
              {expandedSections.smsNotifications && (
                <div className="settings-details">
                  <div className="settings-row">
                    <span>Enable SMS Notifications</span>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.sms.enabled} 
                        onChange={() => handleToggleSwitch('notifications.sms.enabled')}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  
                  <div className="settings-row">
                    <span>Phone Number</span>
                    {isEditingPhone ? (
                      <div className="edit-container">
                        <input 
                          type="text" 
                          value={newPhone} 
                          onChange={(e) => setNewPhone(e.target.value)}
                          placeholder="Enter phone number"
                        />
                        <div className="edit-actions">
                          <button onClick={handleSavePhone}>Save</button>
                          <button onClick={() => {
                            setIsEditingPhone(false);
                            setNewPhone(settings.notifications.sms.verifiedPhone);
                          }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="value-with-edit">
                        <span>{settings.notifications.sms.verifiedPhone || 'Not set'}</span>
                        <button className="edit-button" onClick={() => setIsEditingPhone(true)}>Edit</button>
                      </div>
                    )}
                  </div>
                  
                  {settings.notifications.sms.enabled && settings.notifications.sms.verifiedPhone && (
                    <div className="settings-row">
                      <span>Categories</span>
                      <div className="categories-container">
                        {renderCategoryCheckboxes('notifications.sms', settings.notifications.sms.categories)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Push Notifications */}
            <div className="settings-group">
              <div className="settings-header" onClick={() => toggleSection('pushNotifications')}>
                <h3>Push Notifications</h3>
                <span className={expandedSections.pushNotifications ? 'chevron up' : 'chevron down'}></span>
              </div>
              
              {expandedSections.pushNotifications && (
                <div className="settings-details">
                  <div className="settings-row">
                    <span>Enable Push Notifications</span>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={settings.notifications.pushNotifications.enabled} 
                        onChange={() => handleToggleSwitch('notifications.pushNotifications.enabled')}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  
                  {settings.notifications.pushNotifications.enabled && (
                    <div className="settings-row">
                      <span>Categories</span>
                      <div className="categories-container">
                        {renderCategoryCheckboxes('notifications.pushNotifications', settings.notifications.pushNotifications.categories)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="settings-section">
            <h2>Security Settings</h2>
            
            {/* Two-Factor Authentication */}
            <div className="settings-group">
              <div className="settings-header" onClick={() => toggleSection('twoFactorAuth')}>
                <h3>Two-Factor Authentication</h3>
                <span className={expandedSections.twoFactorAuth ? 'chevron up' : 'chevron down'}></span>
              </div>
              
              {expandedSections.twoFactorAuth && (
                <div className="settings-details">
                  <div className="settings-row">
                    <span>Enable Two-Factor Authentication</span>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={settings.securitySettings.twoFactorAuthentication.enabled} 
                        onChange={() => {
                          if (!settings.securitySettings.twoFactorAuthentication.enabled) {
                            openModal(
                              <div className="setup-2fa-modal">
                                <h3>Set Up Two-Factor Authentication</h3>
                                <p>Choose your preferred authentication method:</p>
                                <div className="auth-methods">
                                  <button onClick={() => setupTwoFactor('sms')}>SMS</button>
                                  <button onClick={() => setupTwoFactor('email')}>Email</button>
                                  <button onClick={() => setupTwoFactor('authenticator')}>Authenticator App</button>
                                </div>
                                <button className="cancel-button" onClick={closeModal}>Cancel</button>
                              </div>
                            );
                          } else {
                            handleToggleSwitch('securitySettings.twoFactorAuthentication.enabled');
                          }
                        }}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  
                  {settings.securitySettings.twoFactorAuthentication.enabled && (
                    <>
                      <div className="settings-row">
                        <span>Current Method</span>
                        <span className="value-display">{settings.securitySettings.twoFactorAuthentication.method}</span>
                      </div>
                      <div className="settings-row">
                        <span>Last Verified</span>
                        <span className="value-display">
                          {new Date(settings.securitySettings.twoFactorAuthentication.lastVerified).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="settings-row">
                        <button 
                          className="secondary-button"
                          onClick={() => openModal(
                            <div className="setup-2fa-modal">
                              <h3>Change Two-Factor Authentication Method</h3>
                              <p>Choose your preferred authentication method:</p>
                              <div className="auth-methods">
                                <button onClick={() => setupTwoFactor('sms')}>SMS</button>
                                <button onClick={() => setupTwoFactor('email')}>Email</button>
                                <button onClick={() => setupTwoFactor('authenticator')}>Authenticator App</button>
                              </div>
                              <button className="cancel-button" onClick={closeModal}>Cancel</button>
                            </div>
                          )}
                        >
                          Change Method
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Biometric Login */}
            <div className="settings-group">
              <div className="settings-header" onClick={() => toggleSection('biometricLogin')}>
                <h3>Biometric Login</h3>
                <span className={expandedSections.biometricLogin ? 'chevron up' : 'chevron down'}></span>
              </div>
              
              {expandedSections.biometricLogin && (
                <div className="settings-details">
                  <div className="settings-row">
                    <span>Enable Biometric Login</span>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={settings.securitySettings.biometricLogin.enabled} 
                        onChange={() => {
                          if (!settings.securitySettings.biometricLogin.enabled) {
                            openModal(
                              <div className="setup-biometric-modal">
                                <h3>Set Up Biometric Login</h3>
                                <p>Choose your biometric authentication methods:</p>
                                <div className="biometric-methods">
                                  <label>
                                    <input 
                                      type="checkbox" 
                                      defaultChecked={true}
                                      id="fingerprint" 
                                    />
                                    Fingerprint
                                  </label>
                                  <label>
                                    <input 
                                      type="checkbox" 
                                      defaultChecked={true}
                                      id="faceId" 
                                    />
                                    Face ID
                                  </label>
                                </div>
                                <div className="modal-actions">
                                  <button onClick={() => {
                                    const methods = [];
                                    if (document.getElementById('fingerprint').checked) methods.push('fingerprint');
                                    if (document.getElementById('faceId').checked) methods.push('faceId');
                                    setupBiometric(methods);
                                  }}>Save</button>
                                  <button className="cancel-button" onClick={closeModal}>Cancel</button>
                                </div>
                              </div>
                            );
                          } else {
                            handleToggleSwitch('securitySettings.biometricLogin.enabled');
                          }
                        }}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  
                  {settings.securitySettings.biometricLogin.enabled && (
                    <>
                      <div className="settings-row">
                        <span>Supported Methods</span>
                        <span className="value-display">
                          {settings.securitySettings.biometricLogin.supportedMethods.join(', ')}
                          </span>
              </div>
              <div className="settings-row">
                <button 
                  className="secondary-button"
                  onClick={() => openModal(
                    <div className="setup-biometric-modal">
                      <h3>Configure Biometric Methods</h3>
                      <p>Update your biometric authentication methods:</p>
                      <div className="biometric-methods">
                        <label>
                          <input 
                            type="checkbox" 
                            defaultChecked={settings.securitySettings.biometricLogin.supportedMethods.includes('fingerprint')}
                            id="fingerprint" 
                          />
                          Fingerprint
                        </label>
                        <label>
                          <input 
                            type="checkbox" 
                            defaultChecked={settings.securitySettings.biometricLogin.supportedMethods.includes('faceId')}
                            id="faceId" 
                          />
                          Face ID
                        </label>
                      </div>
                      <div className="modal-actions">
                        <button onClick={() => {
                          const methods = [];
                          if (document.getElementById('fingerprint').checked) methods.push('fingerprint');
                          if (document.getElementById('faceId').checked) methods.push('faceId');
                          setupBiometric(methods);
                        }}>Save</button>
                        <button className="cancel-button" onClick={closeModal}>Cancel</button>
                      </div>
                    </div>
                  )}
                >
                  Update Methods
                </button>
              </div>
              </>
              )}
              </div>
              )}
            </div>

      {/* Recent Logins */}
      <div className="settings-group">
        <div className="settings-header" onClick={() => toggleSection('recentLogins')}>
          <h3>Recent Logins</h3>
          <span className={expandedSections.recentLogins ? 'chevron up' : 'chevron down'}></span>
        </div>
        
        {expandedSections.recentLogins && (
          <div className="settings-details">
            <div className="recent-logins-container">
              {renderRecentLogins()}
            </div>
          </div>
        )}
      </div>

      {/* Session Management */}
      <div className="settings-group">
        <div className="settings-header" onClick={() => toggleSection('sessionManagement')}>
          <h3>Session Management</h3>
          <span className={expandedSections.sessionManagement ? 'chevron up' : 'chevron down'}></span>
        </div>
        
        {expandedSections.sessionManagement && (
          <div className="settings-details">
            <div className="settings-row">
        <span>Auto Logout After Inactivity</span>
        <label className="switch">
          <input 
            type="checkbox" 
            checked={settings?.securitySettings?.sessionManagement?.autoLogout || false} 
            onChange={() => handleToggleSwitch('securitySettings.sessionManagement.autoLogout')}
          />
          <span className="slider round"></span>
        </label>
      </div>

      {settings?.securitySettings?.sessionManagement?.autoLogout && (
        <div className="settings-row">
          <span>Inactivity Timeout (minutes)</span>
          <select 
            value={settings?.securitySettings?.sessionManagement?.logoutAfterMinutes || 15}
            onChange={(e) => handleSelectChange('securitySettings.sessionManagement.logoutAfterMinutes', parseInt(e.target.value))}
          >
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">60 minutes</option>
          </select>
        </div>
      )}
            
            <div className="settings-row action-row">
              <button 
                className="secondary-button"
                onClick={() => {
                  // API call to log out all other sessions
                  axios.post(`${API_URL}/account-settings/logout-all-sessions`, {}, {
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                  })
                  .then(() => {
                    setConfirmationMessage('All other sessions have been logged out');
                    setShowConfirmation(true);
                    
                    setTimeout(() => {
                      setShowConfirmation(false);
                    }, 3000);
                  })
                  .catch(err => {
                    console.error('Error logging out sessions:', err);
                    setConfirmationMessage('Failed to log out sessions. Please try again.');
                    setShowConfirmation(true);
                    
                    setTimeout(() => {
                      setShowConfirmation(false);
                    }, 3000);
                  });
                }}
              >
                Log Out All Other Sessions
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Password Management */}
      <div className="settings-group">
        <div className="settings-header" onClick={() => toggleSection('passwordManagement')}>
          <h3>Password Management</h3>
          <span className={expandedSections.passwordManagement ? 'chevron up' : 'chevron down'}></span>
        </div>
        
        {expandedSections.passwordManagement && (
          <div className="settings-details">
            <div className="settings-row">
              <span>Last Password Change</span>
              <span className="value-display">
                {settings?.securitySettings?.passwordManagement?.lastChanged 
                  ? new Date(settings.securitySettings.passwordManagement.lastChanged).toLocaleDateString()
                  : 'Not available'}
              </span>
            </div>
            
            <div className="settings-row action-row">
              <button 
                className="secondary-button"
                onClick={() => openModal(
                  <div className="change-password-modal">
                    <h3>Change Password</h3>
                    <form>
                      <div className="form-group">
                        <label>Current Password</label>
                        <input type="password" id="currentPassword" />
                      </div>
                      <div className="form-group">
                        <label>New Password</label>
                        <input type="password" id="newPassword" />
                      </div>
                      <div className="form-group">
                        <label>Confirm New Password</label>
                        <input type="password" id="confirmPassword" />
                      </div>
                      <div className="password-requirements">
                        <p>Password must:</p>
                        <ul>
                          <li>Be at least 8 characters long</li>
                          <li>Include at least one uppercase letter</li>
                          <li>Include at least one number</li>
                          <li>Include at least one special character</li>
                        </ul>
                      </div>
                      <div className="modal-actions">
                        <button type="button" onClick={() => {
                          const currentPassword = document.getElementById('currentPassword').value;
                          const newPassword = document.getElementById('newPassword').value;
                          const confirmPassword = document.getElementById('confirmPassword').value;
                          
                          if (!currentPassword || !newPassword || !confirmPassword) {
                            alert('All fields are required');
                            return;
                          }
                          
                          if (newPassword !== confirmPassword) {
                            alert('New passwords do not match');
                            return;
                          }
                          
                          // Password validation regex
                          const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
                          if (!passwordRegex.test(newPassword)) {
                            alert('New password does not meet requirements');
                            return;
                          }
                          
                          // API call to change password
                          axios.post(`${API_URL}/account-settings/change-password`, {
                            currentPassword,
                            newPassword
                          }, {
                            headers: {
                              'Authorization': `Bearer ${localStorage.getItem('token')}`
                            }
                          })
                          .then(() => {
                            closeModal();
                            
                            // Update settings locally
                            setSettings(prev => ({
                              ...prev,
                              securitySettings: {
                                ...prev.securitySettings,
                                passwordManagement: {
                                  ...(prev.securitySettings?.passwordManagement || {}),
                                  lastChanged: new Date().toISOString()
                                }
                              }
                            }));
                            
                            setConfirmationMessage('Password changed successfully');
                            setShowConfirmation(true);
                            
                            setTimeout(() => {
                              setShowConfirmation(false);
                            }, 3000);
                          })
                          .catch(err => {
                            console.error('Error changing password:', err);
                            
                            if (err.response && err.response.status === 401) {
                              alert('Current password is incorrect');
                            } else {
                              alert('Failed to change password. Please try again.');
                            }
                          });
                        }}>Change Password</button>
                        <button type="button" className="cancel-button" onClick={closeModal}>Cancel</button>
                      </div>
                    </form>
                  </div>
                )}
              >
                Change Password
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Activity Alerts */}
      <div className="settings-group">
        <div className="settings-header" onClick={() => toggleSection('activityAlerts')}>
          <h3>Activity Alerts</h3>
          <span className={expandedSections.activityAlerts ? 'chevron up' : 'chevron down'}></span>
        </div>
        
        {expandedSections.activityAlerts && (
          <div className="settings-details">
            <div className="settings-row">
              <span>Login Alerts</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={settings?.securitySettings?.activityAlerts?.loginAlerts || false} 
                  onChange={() => handleToggleSwitch('securitySettings.activityAlerts.loginAlerts')}
                />
                <span className="slider round"></span>
              </label>
            </div>
            
            <div className="settings-row">
              <span>Password Change Alerts</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={settings?.securitySettings?.activityAlerts?.passwordChangeAlerts || false} 
                  onChange={() => handleToggleSwitch('securitySettings.activityAlerts.passwordChangeAlerts')}
                />
                <span className="slider round"></span>
              </label>
            </div>
            
            <div className="settings-row">
              <span>Profile Update Alerts</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={settings?.securitySettings?.activityAlerts?.profileUpdateAlerts || false} 
                  onChange={() => handleToggleSwitch('securitySettings.activityAlerts.profileUpdateAlerts')}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Pending Actions */}
      {settings.accountActivity && settings.accountActivity.pendingActions && settings.accountActivity.pendingActions.length > 0 && (
        <div className="settings-group">
          <div className="settings-header" onClick={() => toggleSection('pendingActions')}>
            <h3>Pending Actions</h3>
            <span className={expandedSections.pendingActions ? 'chevron up' : 'chevron down'}></span>
          </div>
          
          {expandedSections.pendingActions && (
            <div className="settings-details">
              <div className="pending-actions-container">
                {renderPendingActions()}
              </div>
            </div>
          )}
        </div>
      )}
      </div>
      )}

      {/* Display Tab */}
      {activeTab === 'display' && (
        <div className="settings-section">
          <h2>Display Preferences</h2>
          
          {/* Theme Settings */}
          <div className="settings-group">
            <div className="settings-header" onClick={() => toggleSection('theme')}>
              <h3>Theme</h3>
              <span className={expandedSections.theme ? 'chevron up' : 'chevron down'}></span>
            </div>
            
            {expandedSections.theme && (
              <div className="settings-details">
                <div className="settings-row">
                  <span>Theme Mode</span>
                  <select 
                    value={settings?.displayPreferences?.theme?.mode || 'system'}
                    onChange={(e) => handleSelectChange('displayPreferences.theme.mode', e.target.value)}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System Default</option>
                  </select>
                </div>
                
                <div className="settings-row">
                  <span>Color Scheme</span>
                  <div className="color-scheme-options">
                    {['blue', 'green', 'purple', 'orange', 'red'].map(color => (
                      <div 
                        key={color}
                        className={`color-option ${color} ${settings?.displayPreferences?.theme?.colorScheme === color ? 'selected' : ''}`}
                        onClick={() => handleSelectChange('displayPreferences.theme.colorScheme', color)}
                      >
                        <div className="color-swatch"></div>
                        <span>{color.charAt(0).toUpperCase() + color.slice(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Font Settings */}
          <div className="settings-group">
            <div className="settings-header" onClick={() => toggleSection('font')}>
              <h3>Font</h3>
              <span className={expandedSections.font ? 'chevron up' : 'chevron down'}></span>
            </div>
            
            {expandedSections.font && (
              <div className="settings-details">
                <div className="settings-row">
                  <span>Font Size</span>
                  <select 
                    value={settings?.displayPreferences?.font?.size || 'medium'}
                    onChange={(e) => handleSelectChange('displayPreferences.font.size', e.target.value)}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                
                <div className="settings-row">
                  <span>Font Family</span>
                  <select 
                    value={settings?.displayPreferences?.font?.family || 'system'}
                    onChange={(e) => handleSelectChange('displayPreferences.font.family', e.target.value)}
                  >
                    <option value="system">System Default</option>
                    <option value="sans-serif">Sans-serif</option>
                    <option value="serif">Serif</option>
                    <option value="monospace">Monospace</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          
          {/* Layout Settings */}
          <div className="settings-group">
            <div className="settings-header" onClick={() => toggleSection('layout')}>
              <h3>Layout</h3>
              <span className={expandedSections.layout ? 'chevron up' : 'chevron down'}></span>
            </div>
            
            {expandedSections.layout && (
              <div className="settings-details">
                <div className="settings-row">
                  <span>Compact Mode</span>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={settings?.displayPreferences?.layout?.compactMode || false} 
                      onChange={() => handleToggleSwitch('displayPreferences.layout.compactMode')}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                <div className="settings-row">
                  <span>Show Account Summary</span>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={settings?.displayPreferences?.layout?.showAccountSummary || false} 
                      onChange={() => handleToggleSwitch('displayPreferences.layout.showAccountSummary')}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                <div className="settings-row">
                  <span>Default Dashboard View</span>
                  <select 
                    value={settings?.displayPreferences?.layout?.defaultDashboardView || 'overview'}
                    onChange={(e) => handleSelectChange('displayPreferences.layout.defaultDashboardView', e.target.value)}
                  >
                    <option value="overview">Overview</option>
                    <option value="transactions">Transactions</option>
                    <option value="budgets">Budgets</option>
                    <option value="goals">Goals</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          
          {/* Accessibility Settings */}
          <div className="settings-group">
            <div className="settings-header" onClick={() => toggleSection('accessibility')}>
              <h3>Accessibility</h3>
              <span className={expandedSections.accessibility ? 'chevron up' : 'chevron down'}></span>
            </div>
            
            {expandedSections.accessibility && (
              <div className="settings-details">
                <div className="settings-row">
                  <span>High Contrast Mode</span>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={settings?.displayPreferences?.accessibility?.highContrast || false} 
                      onChange={() => handleToggleSwitch('displayPreferences.accessibility.highContrast')}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                <div className="settings-row">
                  <span>Reduce Motion</span>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={settings?.displayPreferences?.accessibility?.reduceMotion || false} 
                      onChange={() => handleToggleSwitch('displayPreferences.accessibility.reduceMotion')}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                <div className="settings-row">
                  <span>Screen Reader Optimized</span>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={settings?.displayPreferences?.accessibility?.screenReaderOptimized || false} 
                      onChange={() => handleToggleSwitch('displayPreferences.accessibility.screenReaderOptimized')}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paperless Tab */}
      {activeTab === 'paperless' && (
        <div className="settings-section">
          <h2>Paperless Settings</h2>
          
          {/* Paperless Statements */}
          <div className="settings-group">
            <div className="settings-header" onClick={() => toggleSection('paperlessStatements')}>
              <h3>Paperless Statements</h3>
              <span className={expandedSections.paperlessStatements ? 'chevron up' : 'chevron down'}></span>
            </div>
            
            {expandedSections.paperlessStatements && (
              <div className="settings-details">
                <div className="settings-row">
                  <span>Receive Paperless Statements</span>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={settings.paperlessSettings.paperlessStatements} 
                      onChange={() => handleToggleSwitch('paperlessSettings.paperlessStatements')}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                
                {settings.paperlessSettings.paperlessStatements && (
                  <>
                    <div className="settings-row">
                      <span>Email for Statements</span>
                      {isEditingEmail ? (
                        <div className="edit-container">
                          <input 
                            type="email" 
                            value={newEmail} 
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="Enter email address"
                          />
                          <div className="edit-actions">
                            <button onClick={handleSaveEmail}>Save</button>
                            <button onClick={() => {
                              setIsEditingEmail(false);
                              setNewEmail(settings.paperlessSettings.emailForStatements);
                            }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="value-with-edit">
                          <span>{settings.paperlessSettings.emailForStatements}</span>
                          <button className="edit-button" onClick={() => setIsEditingEmail(true)}>Edit</button>
                        </div>
                      )}
                    </div>
                    
                    <div className="settings-row">
                      <span>Statement Format</span>
                      <select 
                        value={settings.paperlessSettings.statementFormat}
                        onChange={(e) => handleSelectChange('paperlessSettings.statementFormat', e.target.value)}
                      >
                        <option value="pdf">PDF</option>
                        <option value="csv">CSV</option>
                        <option value="both">Both PDF & CSV</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Document Delivery */}
          <div className="settings-group">
            <div className="settings-header" onClick={() => toggleSection('documentDelivery')}>
              <h3>Document Delivery</h3>
              <span className={expandedSections.documentDelivery ? 'chevron up' : 'chevron down'}></span>
            </div>
            
            {expandedSections.documentDelivery && (
              <div className="settings-details">
                <div className="settings-row">
                  <span>Tax Documents</span>
                  <select 
                    value={settings?.paperlessSettings?.documentDelivery?.taxDocuments || 'electronic'}
                    onChange={(e) => handleSelectChange('paperlessSettings.documentDelivery.taxDocuments', e.target.value)}
                  >
                    <option value="electronic">Electronic Only</option>
                    <option value="paper">Paper Only</option>
                    <option value="both">Both Electronic & Paper</option>
                  </select>
                </div>
                
                <div className="settings-row">
                  <span>Account Notices</span>
                  <select 
                    value={settings?.paperlessSettings?.documentDelivery?.accountNotices || 'electronic'}
                    onChange={(e) => handleSelectChange('paperlessSettings.documentDelivery.accountNotices', e.target.value)}
                  >
                    <option value="electronic">Electronic Only</option>
                    <option value="paper">Paper Only</option>
                    <option value="both">Both Electronic & Paper</option>
                  </select>
                </div>
                
                <div className="settings-row">
                  <span>Marketing Materials</span>
                  <select 
                    value={settings?.paperlessSettings?.documentDelivery?.marketingMaterials || 'electronic'}
                    onChange={(e) => handleSelectChange('paperlessSettings.documentDelivery.marketingMaterials', e.target.value)}
                  >
                    <option value="electronic">Electronic Only</option>
                    <option value="paper">Paper Only</option>
                    <option value="both">Both Electronic & Paper</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          
          {/* Statement History */}
          <div className="settings-group">
            <div className="settings-header" onClick={() => toggleSection('statementHistory')}>
              <h3>Statement History</h3>
              <span className={expandedSections.statementHistory ? 'chevron up' : 'chevron down'}></span>
            </div>
            
            {expandedSections.statementHistory && (
              <div className="settings-details">
                <div className="settings-row">
                  <span>Statements Retention Period</span>
                  <select 
                    value={settings?.paperlessSettings?.statementHistory?.retentionPeriod || '7years'}
                    onChange={(e) => handleSelectChange('paperlessSettings.statementHistory.retentionPeriod', e.target.value)}
                  >
                    <option value="7years">7 Years</option>
                    <option value="10years">10 Years</option>
                    <option value="indefinite">Indefinite</option>
                  </select>
                </div>
                
                <div className="settings-row action-row">
                  <button 
                    className="secondary-button"
                    onClick={() => {
                      window.location.href = '/account/statements';
                    }}
                  >
                    View Statement History
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>

      {/* Confirmation Toast */}
      {showConfirmation && (
        <div className="confirmation-toast">
          <span>{confirmationMessage}</span>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-close" onClick={closeModal}>×</div>
            {modalContent}
          </div>
        </div>
      )}
      </div>
      );
      };

export default AccountSettings;