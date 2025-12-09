import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  CreditCard,
  LayoutDashboard,
  PieChart, 
  Wallet, 
  Receipt,
  TrendingUp, 
  Lock, 
  Bell,
  LogIn,
  UserPlus,
  LogOut, 
  Menu, 
  X,
  User,
  Settings,
  BarChart2Icon,
  DollarSign,
  Landmark
} from 'lucide-react';
import './Navbar.css';
import { useNavyFederal } from '../../Context/NavyFederalContext';


const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return '/default-avatar.png';
  if (imageUrl.startsWith('http')) return imageUrl;
  if (imageUrl.startsWith('/uploads')) return `http://localhost:3000${imageUrl}`;
  if (imageUrl.startsWith('data:')) return imageUrl;
  return imageUrl;
};

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeRoute, setActiveRoute] = useState('');
  const [greeting, setGreeting] = useState('');
  const [userProfile, setUserProfile] = useState(() => {
    const savedProfile = localStorage.getItem('userProfile');
    return savedProfile ? JSON.parse(savedProfile) : {
      firstName: '',
      lastName: '',
      profileImage: '',
    };
  });
  const [transactions, setTransactions] = useState([]);
  
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityCode, setSecurityCode] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [isSecurityVerified, setIsSecurityVerified] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  
  const validSecurityCodes = ['NFCU@!$&01', 'NFCU0011@@', 'NFCU-+020'];
  const validRegisterCodes = ['WWWNFCU@#', 'NFCUWWW$$', '$$WWNFCUW'];
  
  const { isAuthenticated, logout } = useNavyFederal();

  const navItems = [
    { icon: LayoutDashboard, name: 'Dashboard', path: '/dashboard' },
    { icon: Settings, name: 'Account Settings', path: '/account-settings' },
    { icon: Wallet, name: 'Financial Summary', path: '/financial-summary' },
    { icon: Receipt, name: 'Transactions History', path: '/transactions' },
    { icon: Landmark, name: 'Accounts', path: '/accounts' },
    { icon: TrendingUp, name: 'Budgeting', path: '/budgeting' },
    { icon: Lock, name: 'Security', path: '/security' },
    { icon: CreditCard, name: 'Fund Transfer', path: '/fund-transfer' },
    { icon: Wallet, name: 'Bill Payment', path: '/bill-payment' },
    { icon: DollarSign, name: 'Transaction Confirmation', path: '/transaction-confirmation' },
    { icon: BarChart2Icon, name: 'Expense Tracker', path: '/expense-tracker' },
    { icon: TrendingUp, name: 'Financial Goals', path: '/financial-goals' },
    { icon: PieChart, name: 'Budget Analytics', path: '/budget-analytics' },
    { icon: User, name: 'Profile', path: '/profile' }
  ];
  
  const getPersonalizedGreeting = () => {
    const currentHour = new Date().getHours();
    let baseGreeting = '';

    if (currentHour < 12) {
      baseGreeting = 'Good Morning';
    } else if (currentHour < 18) {
      baseGreeting = 'Good Afternoon';
    } else {
      baseGreeting = 'Good Evening';
    }

    return `${baseGreeting}, ${userProfile?.firstName || 'Member'}`;
  };

  useEffect(() => {
    const handleProfileUpdated = (event) => {
      setUserProfile(event.detail);
    };

    window.addEventListener('profileUpdated', handleProfileUpdated);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdated);
    };
  }, []);

  useEffect(() => {
    setGreeting(getPersonalizedGreeting());
  }, [userProfile]);

  const notifications = transactions?.filter(
    transaction => transaction.status !== 'Completed' || transaction.type === 'Warning'
  )?.map((transaction, index) => ({
    id: transaction.id,
    message: transaction.description,
    type: transaction.status === 'Completed' ? 'info' : 'warning'
  })) || [];

  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    setActiveRoute(location.pathname);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        menuButtonRef.current && 
        !menuButtonRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSecuritySubmit = (e) => {
    e.preventDefault();
    
    const codesToCheck = pendingAction === 'register' ? validRegisterCodes : validSecurityCodes;
    
    if (codesToCheck.includes(securityCode)) {
      setIsSecurityVerified(true);
      setShowSecurityModal(false);
      setSecurityError('');
      setSecurityCode('');
      
      if (pendingAction === 'menu') {
        setIsDropdownOpen(true);
      } else if (pendingAction === 'profile') {
        navigate('/profile');
      } else if (pendingAction === 'register') {
        navigate('/register');
      }
      
      setPendingAction(null);
    } else {
      setSecurityError('Invalid security code. Please contact support for assistance.');
      setSecurityCode('');
    }
  };

  const handleMenuClick = () => {
    if (!isAuthenticated) return;
    
    if (isSecurityVerified) {
      setIsDropdownOpen(prevState => !prevState);
    } else {
      setPendingAction('menu');
      setShowSecurityModal(true);
    }
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) return;
    
    if (isSecurityVerified) {
      navigate('/profile');
    } else {
      setPendingAction('profile');
      setShowSecurityModal(true);
    }
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setPendingAction('register');
    setShowSecurityModal(true);
  };

  const closeSecurityModal = () => {
    setShowSecurityModal(false);
    setSecurityCode('');
    setSecurityError('');
    setPendingAction(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('userProfile');
    setIsSecurityVerified(false);
    logout();
    navigate('/login');
  };

  const handleLogoClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      navigate('/login');
    }
  };

  const renderNotificationBadge = () => {
    const warningNotifications = notifications?.filter(n => n.type === 'warning') || [];
    return warningNotifications.length > 0 ? (
      <span className="nav-101-notification-badge">
        {warningNotifications.length}
      </span>
    ) : null;
  };

  return (
    <div className="nav-101-navbar-container">
      <nav className="nav-101-navbar">
        <div className="nav-101-navbar-brand">
          <Link to={isAuthenticated ? "/" : "/login"} className="nav-101-logo-link" onClick={handleLogoClick}>
            <img 
              src="/Images/NavyFe.webp" 
              alt="Navy Federal Credit Union" 
              className="nav-101-logo" 
            />
            <span className="nav-101-navbar-title">Navy Federal Credit Union</span>
          </Link>
          <button 
            ref={menuButtonRef}
            className={`nav-101-sidebar-toggle ${isDropdownOpen ? 'nav-101-active' : ''}`} 
            onClick={handleMenuClick}
            aria-label={isDropdownOpen ? 'Close Menu' : 'Open Menu'}
          >
            {isDropdownOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isAuthenticated && (
          <div className="nav-101-navbar-center">
            <div className="nav-101-user-greeting">
              <span className="nav-101-greeting-text">{greeting}</span>
            </div>
          </div>
        )}

        {isAuthenticated ? (
          <div className="nav-101-navbar-actions">
            <div className="nav-101-action-icons">
              <button 
                className="nav-101-user-profile-image"
                onClick={handleProfileClick}
                style={{ 
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img 
                  src={getFullImageUrl(userProfile?.profileImage)}
                  alt={`${userProfile?.firstName || 'User'} Profile`}
                  className="nav-101-profile-avatar"
                />
              </button>
              <button 
                className="nav-101-icon-button nav-101-notification-button"
                onClick={() => navigate('/notifications')}
                aria-label="Notifications"
              >
                <Bell size={20} />
                {renderNotificationBadge()}
              </button>
              <button 
                className="nav-101-icon-button nav-101-logout-button"
                onClick={handleLogout}
                aria-label="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="nav-101-navbar-actions">
            <div className="nav-101-action-icons">
              <Link to="/login" className="nav-101-nav-auth-link">
                <LogIn size={20} />
                <span>Login</span>
              </Link>
              <button 
                onClick={handleRegisterClick} 
                className="nav-101-nav-auth-link"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px'
                }}
              >
                <UserPlus size={20} />
                <span>Register</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {showSecurityModal && (
        <div className="security-modal-overlay" onClick={closeSecurityModal}>
          <div className="security-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="security-modal-header">
              <Lock size={40} color="#003366" />
              <h2>Security Verification Required</h2>
              <button className="security-modal-close" onClick={closeSecurityModal}>
                <X size={24} />
              </button>
            </div>
            <div className="security-modal-body">
              <p>Please contact support to obtain your security code for accessing this area.</p>
              <form onSubmit={handleSecuritySubmit}>
                <div className="security-input-group">
                  <label htmlFor="securityCode">Enter Security Code:</label>
                  <input
                    type="password"
                    id="securityCode"
                    value={securityCode}
                    onChange={(e) => setSecurityCode(e.target.value)}
                    placeholder="Enter security code"
                    autoFocus
                  />
                </div>
                {securityError && (
                  <div className="security-error-message">
                    {securityError}
                  </div>
                )}
                <div className="security-modal-actions">
                  <button type="button" onClick={closeSecurityModal} className="security-cancel-btn">
                    Cancel
                  </button>
                  <button type="submit" className="security-submit-btn">
                    Verify
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isDropdownOpen && isSecurityVerified && (
        <div 
          ref={dropdownRef}
          className="nav-101-navbar-dropdown"
        >
          <div className="nav-101-dropdown-nav">
            {isAuthenticated ? (
              navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.path}
                    to={item.path} 
                    className={`nav-101-dropdown-link ${activeRoute === item.path ? 'nav-101-active' : ''}`}
                    onClick={() => {
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </Link>
                );
              })
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="nav-101-dropdown-link"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <LogIn size={20} />
                  <span>Login</span>
                </Link>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    setIsDropdownOpen(false);
                    handleRegisterClick(e);
                  }}
                  className="nav-101-dropdown-link"
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <UserPlus size={20} />
                  <span>Register</span>
                </button>
              </>
            )}
            
            {isAuthenticated && (
              <button 
                className="nav-101-dropdown-link nav-101-logout-button"
                onClick={() => {
                  handleLogout();
                  setIsDropdownOpen(false);
                }}
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;