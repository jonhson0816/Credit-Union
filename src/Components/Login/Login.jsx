import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useNavyFederal } from '../../Context/NavyFederalContext';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error, setError, isAuthenticated, userRole } = useNavyFederal();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if there's a redirect path in the location state
  const from = location.state?.from || '/';

  useEffect(() => {
    // Clear any existing errors when component mounts
    if (setError) setError(null);
    
    // Check if user is already authenticated
    const token = localStorage.getItem('token');
    if (token && isAuthenticated) {
      navigateBasedOnRole();
    }
    
    return () => {
      if (setError) setError(null);
    };
  }, [isAuthenticated]);

  const navigateBasedOnRole = () => {
    if (userRole === 'admin') {
      navigate('/admin-dashboard', { replace: true });
    } else if (userRole === 'moderator') {
      navigate('/moderator-dashboard', { replace: true });
    } else {
      navigate(from, { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
  
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }
  
    setIsSubmitting(true);
    try {
      await login({ username, password });
      navigateBasedOnRole();
    } catch (err) {
      console.error('Login error:', err);
      
      // Provide more user-friendly error messages
      let errorMessage;
      if (err.message.includes('Network Error') || err.message.includes('connect')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (err.message.includes('401') || err.message.includes('Invalid credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else {
        errorMessage = err.message || 'Login failed. Please try again later.';
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="log010-login-container">
      <div className="log010-login-wrapper">
        <form onSubmit={handleSubmit} className="log010-login-form">
          <div className="log010-login-header">
            <h2>Navy Federal Credit Union</h2>
            <p>Sign in to access your account</p>
          </div>
          
          {error && <div className="log010-error-message" role="alert">{error}</div>}
          
          <div className="log010-form-group">
            <div className="log010-input-icon-wrapper">
              <Mail className="log010-input-icon" size={20} />
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.trim())}
                placeholder="Username"
                required
                autoComplete="username"
                disabled={isSubmitting}
                className="log010-input"
              />
            </div>
          </div>
          
          <div className="log010-form-group log010-password-group">
            <div className="log010-input-icon-wrapper">
              <Lock className="log010-input-icon" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                autoComplete="current-password"
                disabled={isSubmitting}
                minLength={6}
                className="log010-input"
              />
              <button 
                type="button" 
                className="log010-password-toggle"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <div className="log010-login-extras">
            <Link to="/forgot-password" className="log010-forgot-password-link">
              Forgot Password?
            </Link>
          </div>
          
          <button 
            type="submit" 
            className="log010-login-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
          
          <div className="log010-register-section">
            <p>Don't have an account?</p>
            <Link to="/register" className="log010-register-link">
              Create Account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;