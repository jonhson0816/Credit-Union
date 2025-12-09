import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  Shield,
  Lock,
  FileText
} from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="nfcu-footer">
      <div className="nfcu-footer-container">
        {/* Main Footer Content */}
        <div className="nfcu-footer-main">
          {/* Contact Section */}
          <div className="nfcu-footer-section">
            <h3 className="nfcu-footer-title">Contact Us</h3>
            <ul className="nfcu-footer-list">
              <li className="nfcu-footer-item">
                <Phone size={18} />
                <div>
                  <strong>Member Services</strong>
                  <a href="tel:1-888-842-6328">1-888-842-6328</a>
                </div>
              </li>
              <li className="nfcu-footer-item">
                <Phone size={18} />
                <div>
                  <strong>24/7 Support</strong>
                  <a href="tel:1-888-842-6328">1-888-842-6328</a>
                </div>
              </li>
              <li className="nfcu-footer-item">
                <Mail size={18} />
                <div>
                  <strong>Email</strong>
                  <a href="mailto:support@navyfederal.org">support@navyfederal.org</a>
                </div>
              </li>
              <li className="nfcu-footer-item">
                <MapPin size={18} />
                <div>
                  <strong>Headquarters</strong>
                  <span>820 Follin Lane, Vienna, VA 22180</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Quick Links Section */}
          <div className="nfcu-footer-section">
            <h3 className="nfcu-footer-title">Quick Links</h3>
            <ul className="nfcu-footer-list">
              <li><Link to="/accounts">Accounts</Link></li>
              <li><Link to="/fund-transfer">Transfer Funds</Link></li>
              <li><Link to="/bill-payment">Pay Bills</Link></li>
              <li><Link to="/financial-goals">Financial Goals</Link></li>
              <li><Link to="/budgeting">Budget Tools</Link></li>
              <li><Link to="/transactions">Transaction History</Link></li>
              <li><Link to="/profile">Profile Settings</Link></li>
            </ul>
          </div>

          {/* Resources Section */}
          <div className="nfcu-footer-section">
            <h3 className="nfcu-footer-title">Resources</h3>
            <ul className="nfcu-footer-list">
              <li><Link to="/financial-education">Financial Education</Link></li>
              <li><Link to="/calculators">Loan Calculators</Link></li>
              <li><Link to="/mobile-app">Mobile Banking App</Link></li>
              <li><Link to="/branch-locator">Branch Locator</Link></li>
              <li><Link to="/atm-locator">ATM Locator</Link></li>
              <li><Link to="/help-center">Help Center</Link></li>
              <li><Link to="/faq">FAQs</Link></li>
            </ul>
          </div>

          {/* About Section */}
          <div className="nfcu-footer-section">
            <h3 className="nfcu-footer-title">About Navy Federal</h3>
            <ul className="nfcu-footer-list">
              <li><Link to="/about-us">About Us</Link></li>
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/newsroom">Newsroom</Link></li>
              <li><Link to="/community">Community Support</Link></li>
              <li><Link to="/membership">Membership</Link></li>
              <li><Link to="/security">Security Center</Link></li>
              <li><Link to="/contact">Contact Information</Link></li>
            </ul>
          </div>
        </div>

        {/* Security & Social Section */}
        <div className="nfcu-footer-security-social">
          {/* Security Badges */}
          <div className="nfcu-footer-security">
            <h4>Your Security is Our Priority</h4>
            <div className="nfcu-security-badges">
              <div className="nfcu-badge">
                <Shield size={24} />
                <span>FDIC Insured</span>
              </div>
              <div className="nfcu-badge">
                <Lock size={24} />
                <span>256-bit Encryption</span>
              </div>
              <div className="nfcu-badge">
                <FileText size={24} />
                <span>NCUA Insured</span>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="nfcu-footer-social">
            <h4>Connect With Us</h4>
            <div className="nfcu-social-links">
              <a href="https://facebook.com/navyfederal" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook size={24} />
              </a>
              <a href="https://twitter.com/navyfederal" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <Twitter size={24} />
              </a>
              <a href="https://instagram.com/navyfederal" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram size={24} />
              </a>
              <a href="https://linkedin.com/company/navy-federal-credit-union" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <Linkedin size={24} />
              </a>
            </div>
          </div>
        </div>

        {/* Legal Section */}
        <div className="nfcu-footer-legal">
          <div className="nfcu-footer-legal-links">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <span className="nfcu-divider">|</span>
            <Link to="/terms-conditions">Terms & Conditions</Link>
            <span className="nfcu-divider">|</span>
            <Link to="/accessibility">Accessibility</Link>
            <span className="nfcu-divider">|</span>
            <Link to="/site-map">Site Map</Link>
            <span className="nfcu-divider">|</span>
            <Link to="/disclosures">Disclosures</Link>
          </div>
          
          <div className="nfcu-footer-disclaimer">
            <p>
              <strong>Important:</strong> Navy Federal Credit Union is federally insured by NCUA. 
              APY = Annual Percentage Yield. Rates subject to change. Membership required.
            </p>
            <p>
              © {currentYear} Navy Federal Credit Union. All rights reserved. 
              Navy Federal Credit Union is an Equal Housing Lender.
            </p>
            <p className="nfcu-footer-member-notice">
              Federally insured by NCUA. Equal Housing Opportunity.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;