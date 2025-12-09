import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNavyFederal } from '../../Context/NavyFederalContext';
import { 
  Eye, 
  EyeOff, 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Feather,
  Calendar,
  CreditCard,
  Camera
} from 'lucide-react';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  ssn: '',  // NEW
  phoneNumber: '',  // NEW
  // NEW: Address fields
  street: '',
  city: '',
  state: '',
  zipCode: '',
  // NEW: Employment fields
  employmentStatus: 'employed',
  employer: '',
  annualIncome: '',
  // NEW: Security questions
  securityQuestion1: '',
  securityAnswer1: '',
  securityQuestion2: '',
  securityAnswer2: '',
  militaryBranch: 'Navy',
  rank: 'Junior Rank',
  dateOfBirth: '',
  accountType: [],
  profileImage: null,
  termsAccepted: false  // NEW
});

  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false
  });
  
  const [error, setError] = useState(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const { register, isLoading } = useNavyFederal();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleAccountTypeChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      accountType: checked 
        ? [...prevState.accountType, value]
        : prevState.accountType.filter(type => type !== value)
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prevState => ({
        ...prevState,
        profileImage: file
      }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

    const validateForm = () => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError("Please enter a valid email address");
      return false;
    }

    // Password match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    // Password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError("Password must be at least 8 characters long and include uppercase, lowercase, number, and special character");
      return false;
    }

    // Name validation
    if (formData.firstName.trim().length < 2) {
      setError("First name must be at least 2 characters long");
      return false;
    }

    if (formData.lastName.trim().length < 2) {
      setError("Last name must be at least 2 characters long");
      return false;
    }

    // NEW: SSN validation
    const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
    if (!ssnRegex.test(formData.ssn)) {
      setError("Please enter a valid SSN in format XXX-XX-XXXX");
      return false;
    }

    // NEW: Phone validation
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      setError("Please enter a valid phone number in format XXX-XXX-XXXX");
      return false;
    }

    // NEW: Address validation
    if (!formData.street.trim() || !formData.city.trim() || !formData.state.trim() || !formData.zipCode.trim()) {
      setError("Please fill in all address fields");
      return false;
    }

    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(formData.zipCode)) {
      setError("Please enter a valid ZIP code");
      return false;
    }

    // NEW: Employment validation
    if (formData.employmentStatus !== 'unemployed') {
      if (!formData.employer.trim()) {
        setError("Please enter your employer name");
        return false;
      }
      if (!formData.annualIncome || formData.annualIncome <= 0) {
        setError("Please enter a valid annual income");
        return false;
      }
    }

    // NEW: Security questions validation
    if (!formData.securityQuestion1 || !formData.securityAnswer1.trim()) {
      setError("Please complete security question 1");
      return false;
    }
    if (!formData.securityQuestion2 || !formData.securityAnswer2.trim()) {
      setError("Please complete security question 2");
      return false;
    }
    if (formData.securityQuestion1 === formData.securityQuestion2) {
      setError("Please select different security questions");
      return false;
    }

    // Date of birth
    if (!formData.dateOfBirth) {
      setError("Date of birth is required");
      return false;
    }

    // Account type
    // Account type validation is not needed - Checking is always created
    // Optional accounts can be zero or more

    // NEW: Terms acceptance
    if (!formData.termsAccepted) {
      setError("You must accept the Terms & Conditions to continue");
      return false;
    }

    return true;
  };

  const generateAccountNumber = () => {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) return;
  
    const attemptRegistration = async (attempt = 0) => {
      try {
        const age = calculateAge(formData.dateOfBirth);
        
        const formDataToSend = new FormData();
          formDataToSend.append('firstName', formData.firstName.trim());
          formDataToSend.append('lastName', formData.lastName.trim());
          formDataToSend.append('email', formData.email.trim());
          formDataToSend.append('username', formData.username.trim());
          formDataToSend.append('password', formData.password);
          formDataToSend.append('militaryBranch', formData.militaryBranch);
          formDataToSend.append('rank', formData.rank);
          formDataToSend.append('dateOfBirth', formData.dateOfBirth);
          formDataToSend.append('age', age);

          // NEW: Add SSN and phone
          formDataToSend.append('ssn', formData.ssn);
          formDataToSend.append('phoneNumber', formData.phoneNumber);

          // NEW: Add address
          formDataToSend.append('street', formData.street.trim());
          formDataToSend.append('city', formData.city.trim());
          formDataToSend.append('state', formData.state.trim().toUpperCase());
          formDataToSend.append('zipCode', formData.zipCode.trim());

          // NEW: Add employment
          formDataToSend.append('employmentStatus', formData.employmentStatus);
          if (formData.employmentStatus !== 'unemployed') {
            formDataToSend.append('employer', formData.employer.trim());
            formDataToSend.append('annualIncome', formData.annualIncome);
          }

          // NEW: Add security questions
          formDataToSend.append('securityQuestion1', formData.securityQuestion1);
          formDataToSend.append('securityAnswer1', formData.securityAnswer1.trim());
          formDataToSend.append('securityQuestion2', formData.securityQuestion2);
          formDataToSend.append('securityAnswer2', formData.securityAnswer2.trim());

          // NEW: Add terms acceptance
          formDataToSend.append('termsAccepted', formData.termsAccepted);
          formDataToSend.append('termsAcceptedDate', new Date().toISOString());

          // Account types
          // Always ensure Checking is first and included
          const accountTypes = ['Checking']; // Start with Checking
          const additionalTypes = formData.accountType.filter(type => type !== 'Checking');
          accountTypes.push(...additionalTypes);

          // Append account types
          accountTypes.forEach(type => {
            formDataToSend.append('accountType', type);
          });

          // Profile image
          if (formData.profileImage) {
            formDataToSend.append('profileImage', formData.profileImage);
          }

        const response = await register(formDataToSend);
        setRetryAttempt(0);

        let profileDataForStorage = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          militaryBranch: formData.militaryBranch,
          rank: formData.rank,
          email: formData.email.trim(),
          phoneNumber: '',
          profileImage: previewImage,
          memberSince: new Date().toISOString(),
          id: response.user._id,
          _id: response.user._id,
          accounts: response.user.accounts || formData.accountType.map(type => ({
            accountType: type,
            accountNumber: generateAccountNumber(),
            balance: type === 'Savings' ? 100 : 50,
            routingNumber: '256074974'
          }))
        };
        
        localStorage.setItem('userProfile', JSON.stringify(profileDataForStorage));
        
        const profileUpdatedEvent = new CustomEvent('profileUpdated', { 
          detail: profileDataForStorage 
        });
        window.dispatchEvent(profileUpdatedEvent);
        
        navigate('/');
        return response;
      } catch (error) {
        if (error?.response?.status === 429 && attempt < MAX_RETRIES) {
          setRetryAttempt(attempt + 1);
          setError(`Rate limit reached. Retrying in ${RETRY_DELAY/1000} seconds... (Attempt ${attempt + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return attemptRegistration(attempt + 1);
        }
        throw error;
      }
    };

    try {
      await attemptRegistration();
    } catch (error) {
      console.error('Registration Error:', error);
      
      let errorMessage;
      switch (error?.response?.status) {
        case 429:
          errorMessage = 'Registration limit reached. Please try again later.';
          break;
        case 409:
          errorMessage = 'An account with this email already exists.';
          break;
        case 400:
          errorMessage = error.response?.data?.message || 'Invalid registration data.';
          break;
        default:
          errorMessage = 'Registration failed. Please try again later.';
      }
      
      setError(errorMessage);
    }
  };

  return (
    <div className="reg020-register-container">
      <div className="reg020-register-wrapper">
        <form onSubmit={handleSubmit} className="reg020-register-form">
          <div className="reg020-register-header">
            <h2>Navy Federal Credit Union</h2>
            <p>Join The Navy Federal Credit Union Family</p>
          </div>
          
          {error && <div className="reg020-error-message">{error}</div>}
          
          <div className="reg020-profile-image-upload">
            <div className="reg020-image-preview-container" onClick={triggerFileInput}>
              {previewImage ? (
                <img src={previewImage} alt="Profile Preview" className="reg020-profile-preview" />
              ) : (
                <div className="reg020-profile-placeholder">
                  <Camera size={24} />
                  <span>Add Profile Picture</span>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>
          
          <div className="reg020-name-group">
            <div className="reg020-form-group">
              <div className="reg020-input-icon-wrapper">
                <User className="reg020-input-icon" size={20} />
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                  required
                  autoComplete="given-name"
                  className="reg020-inputs"
                />
              </div>
            </div>
            
            <div className="reg020-form-group">
              <div className="reg020-input-icon-wrapper">
                <User className="reg020-input-icon" size={20} />
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                  required
                  autoComplete="family-name"
                  className="reg020-inputs"
                />
              </div>
            </div>
          </div>

          <div className="reg020-form-group">
            <div className="reg020-input-icon-wrapper">
              <Calendar className="reg020-input-icon" size={20} />
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                max={new Date().toISOString().split('T')[0]}
                className="reg020-input reg020-date-input"
              />
            </div>
          </div>
          
          {/* Email field */}
          <div className="reg020-form-group">
            <div className="reg020-input-icon-wrapper">
              <Mail className="reg020-input-icon" size={20} />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
                required
                autoComplete="email"
                className="reg020-input"
              />
            </div>
          </div>

          {/* NEW: Username field - ADD THIS */}
          <div className="reg020-form-group">
            <div className="reg020-input-icon-wrapper">
              <User className="reg020-input-icon" size={20} />
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a Username"
                required
                autoComplete="username"
                className="reg020-input"
                minLength="3"
                maxLength="20"
                pattern="[a-zA-Z0-9_]+"
                title="Username must be 3-20 characters and contain only letters, numbers, and underscores"
              />
            </div>
            <div className="reg020-password-requirements">
              Username: 3-20 characters (letters, numbers, underscore only)
            </div>
          </div>

          {/* Username field - YOUR EXISTING CODE */}
          <div className="reg020-form-group">
            <div className="reg020-input-icon-wrapper">
              <User className="reg020-input-icon" size={20} />
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a Username"
                required
                autoComplete="username"
                className="reg020-input"
                minLength="3"
                maxLength="20"
                pattern="[a-zA-Z0-9_]+"
                title="Username must be 3-20 characters and contain only letters, numbers, and underscores"
              />
            </div>
          </div>

          <div className="reg020-form-group">
            <div className="reg020-input-icon-wrapper">
              <Shield className="reg020-input-icon" size={20} />
              <input
                type="text"
                id="ssn"
                name="ssn"
                value={formData.ssn}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  const formatted = value.slice(0, 3) + 
                    (value.length > 3 ? '-' + value.slice(3, 5) : '') +
                    (value.length > 5 ? '-' + value.slice(5, 9) : '');
                  setFormData(prev => ({ ...prev, ssn: formatted }));
                }}
                placeholder="Social Security Number (XXX-XX-XXXX)"
                required
                className="reg020-input"
                maxLength="11"
                pattern="^\d{3}-\d{2}-\d{4}$"
                title="SSN must be in format XXX-XX-XXXX"
              />
            </div>
            <div className="reg020-password-requirements">
              Your SSN is encrypted and securely stored
            </div>
          </div>

          {/* Phone Number Field */}
          <div className="reg020-form-group">
            <div className="reg020-input-icon-wrapper">
              <Mail className="reg020-input-icon" size={20} />
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  const formatted = value.slice(0, 3) + 
                    (value.length > 3 ? '-' + value.slice(3, 6) : '') +
                    (value.length > 6 ? '-' + value.slice(6, 10) : '');
                  setFormData(prev => ({ ...prev, phoneNumber: formatted }));
                }}
                placeholder="Phone Number (XXX-XXX-XXXX)"
                required
                className="reg020-input"
                maxLength="12"
                pattern="^\d{3}-\d{3}-\d{4}$"
              />
            </div>
          </div>

          {/* Address Fields */}
          <div className="reg020-form-group">
            <div className="reg020-input-icon-wrapper">
              <User className="reg020-input-icon" size={20} />
              <input
                type="text"
                id="street"
                name="street"
                value={formData.street}
                onChange={handleChange}
                placeholder="Street Address"
                required
                className="reg020-input"
              />
            </div>
          </div>

          <div className="reg020-name-group">
            <div className="reg020-form-group">
              <div className="reg020-input-icon-wrapper">
                <User className="reg020-input-icon" size={20} />
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  required
                  className="reg020-inputs"
                />
              </div>
            </div>
            
            <div className="reg020-form-group">
              <div className="reg020-input-icon-wrapper">
                <User className="reg020-input-icon" size={20} />
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                  required
                  className="reg020-inputs"
                  maxLength="2"
                  pattern="[A-Z]{2}"
                  title="Two-letter state code (e.g., CA)"
                />
              </div>
            </div>
          </div>

          <div className="reg020-form-group">
            <div className="reg020-input-icon-wrapper">
              <User className="reg020-input-icon" size={20} />
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                placeholder="ZIP Code"
                required
                className="reg020-input"
                pattern="^\d{5}(-\d{4})?$"
                title="5-digit ZIP code"
              />
            </div>
          </div>

          {/* Employment Information */}
          <div className="reg020-form-group">
            <div className="reg020-input-icon-wrapper">
              <User className="reg020-input-icon" size={20} />
              <select
                id="employmentStatus"
                name="employmentStatus"
                value={formData.employmentStatus}
                onChange={handleChange}
                required
                className="reg020-input"
              >
                <option value="employed">Employed</option>
                <option value="self-employed">Self-Employed</option>
                <option value="unemployed">Unemployed</option>
                <option value="retired">Retired</option>
                <option value="student">Student</option>
              </select>
            </div>
          </div>

          {formData.employmentStatus !== 'unemployed' && (
            <>
              <div className="reg020-form-group">
                <div className="reg020-input-icon-wrapper">
                  <User className="reg020-input-icon" size={20} />
                  <input
                    type="text"
                    id="employer"
                    name="employer"
                    value={formData.employer}
                    onChange={handleChange}
                    placeholder="Employer Name"
                    required={formData.employmentStatus !== 'unemployed'}
                    className="reg020-input"
                  />
                </div>
              </div>

              <div className="reg020-form-group">
                <div className="reg020-input-icon-wrapper">
                  <User className="reg020-input-icon" size={20} />
                  <input
                    type="number"
                    id="annualIncome"
                    name="annualIncome"
                    value={formData.annualIncome}
                    onChange={handleChange}
                    placeholder="Annual Income ($)"
                    required={formData.employmentStatus !== 'unemployed'}
                    className="reg020-input"
                    min="0"
                  />
                </div>
              </div>
            </>
          )}

          {/* Security Questions */}
          <div className="reg020-form-group">
            <div className="reg020-input-icon-wrapper">
              <Shield className="reg020-input-icon" size={20} />
              <select
                id="securityQuestion1"
                name="securityQuestion1"
                value={formData.securityQuestion1}
                onChange={handleChange}
                required
                className="reg020-input"
              >
                <option value="">Select Security Question 1</option>
                <option value="mother_maiden">What is your mother's maiden name?</option>
                <option value="first_pet">What was the name of your first pet?</option>
                <option value="birth_city">In what city were you born?</option>
                <option value="first_car">What was your first car?</option>
              </select>
            </div>
          </div>

          <div className="reg020-form-group">
            <div className="reg020-input-icon-wrapper">
              <Lock className="reg020-input-icon" size={20} />
              <input
                type="text"
                id="securityAnswer1"
                name="securityAnswer1"
                value={formData.securityAnswer1}
                onChange={handleChange}
                placeholder="Security Answer 1"
                required
                className="reg020-input"
              />
            </div>
          </div>

          <div className="reg020-form-group">
            <div className="reg020-input-icon-wrapper">
              <Shield className="reg020-input-icon" size={20} />
              <select
                id="securityQuestion2"
                name="securityQuestion2"
                value={formData.securityQuestion2}
                onChange={handleChange}
                required
                className="reg020-input"
              >
                <option value="">Select Security Question 2</option>
                <option value="favorite_teacher">Who was your favorite teacher?</option>
                <option value="childhood_friend">What was your childhood best friend's name?</option>
                <option value="first_job">What was your first job?</option>
                <option value="favorite_book">What is your favorite book?</option>
              </select>
            </div>
          </div>

          <div className="reg020-form-group">
            <div className="reg020-input-icon-wrapper">
              <Lock className="reg020-input-icon" size={20} />
              <input
                type="text"
                id="securityAnswer2"
                name="securityAnswer2"
                value={formData.securityAnswer2}
                onChange={handleChange}
                placeholder="Security Answer 2"
                required
                className="reg020-input"
              />
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="reg020-form-group">
            <label className="reg020-checkbox-label">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={(e) => setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }))}
                required
                className="reg020-checkbox"
              />
              <span className="reg020-checkbox-text">
                I agree to the <a href="/terms" target="_blank">Terms & Conditions</a> and <a href="/privacy" target="_blank">Privacy Policy</a>
              </span>
            </label>
          </div>

          <div className="reg020-form-group reg020-account-type-group">
            <div className="reg020-input-icon-wrapper">
              <CreditCard className="reg020-input-icon" size={20} />
              <div className="reg020-account-checkboxes">
                <div className="reg020-default-account-notice">
                  ✓ Checking Account is included by default ($60,000 starting balance)
                </div>
                
                <label className="reg020-checkbox-label">
                  <input
                    type="checkbox"
                    name="accountType"
                    value="Savings"
                    checked={formData.accountType.includes('Savings')}
                    onChange={handleAccountTypeChange}
                    className="reg020-checkbox"
                  />
                  <span className="reg020-checkbox-text">Add Savings Account (+$5,000)</span>
                </label>
                
                <label className="reg020-checkbox-label">
                  <input
                    type="checkbox"
                    name="accountType"
                    value="Credit"
                    checked={formData.accountType.includes('Credit')}
                    onChange={handleAccountTypeChange}
                    className="reg020-checkbox"
                  />
                  <span className="reg020-checkbox-text">Add Credit Account</span>
                </label>
                
                <label className="reg020-checkbox-label">
                  <input
                    type="checkbox"
                    name="accountType"
                    value="Investment"
                    checked={formData.accountType.includes('Investment')}
                    onChange={handleAccountTypeChange}
                    className="reg020-checkbox"
                  />
                  <span className="reg020-checkbox-text">Add Investment Account</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="reg020-form-group reg020-password-group">
            <div className="reg020-input-icon-wrapper">
              <Lock className="reg020-input-icon" size={20} />
              <input
                type={showPassword.password ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create Password"
                required
                autoComplete="new-password"
                className="reg020-input"
              />
              <button 
                type="button" 
                className="reg020-password-toggle"
                onClick={() => togglePasswordVisibility('password')}
                aria-label={showPassword.password ? "Hide password" : "Show password"}
              >
                {showPassword.password ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="reg020-password-requirements">
              Password must include uppercase, lowercase, number, and special character
            </div>
          </div>
          
          <div className="reg020-form-group reg020-password-group">
            <div className="reg020-input-icon-wrapper">
              <Lock className="reg020-input-icon" size={20} />
              <input
                type={showPassword.confirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                required
                autoComplete="new-password"
                className="reg020-input"
              />
              <button 
                type="button" 
                className="reg020-password-toggle"
                onClick={() => togglePasswordVisibility('confirmPassword')}
                aria-label={showPassword.confirmPassword ? "Hide password" : "Show password"}
              >
                {showPassword.confirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="reg020-register-button"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
          
          <div className="reg020-login-section">
            <p>Already have an account?</p>
            <Link to="/login" className="reg020-login-link">
              Sign In
            </Link>
          </div>
        </form>
        
        <div className="reg020-register-features">
          <div className="reg020-feature">
            <Shield size={24} className="reg020-feature-icon" />
            <span>Secure Registration</span>
          </div>
          <div className="reg020-feature">
            <Feather size={24} className="reg020-feature-icon" />
            <span>Quick & Easy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;