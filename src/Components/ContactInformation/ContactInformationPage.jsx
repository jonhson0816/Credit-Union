import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import './ContactInformationPage.css';

const ContactInformationPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    memberNumber: '',
    preferredContactMethod: 'Email'
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  const subjectOptions = [
    'Account Inquiry',
    'Loan Information',
    'Credit Card Services',
    'Technical Support',
    'Fraud Report',
    'General Question',
    'Complaint',
    'Other'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!formData.subject) {
      setError('Please select a subject');
      return false;
    }
    if (!formData.message.trim()) {
      setError('Message is required');
      return false;
    }
    if (formData.message.trim().length < 10) {
      setError('Message must be at least 10 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://credit-unionapi.onrender.com/api/contact/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setReferenceNumber(data.data.referenceNumber);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          memberNumber: '',
          preferredContactMethod: 'Email'
        });

        // Scroll to success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(data.message || 'Failed to submit inquiry. Please try again.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('Unable to submit your inquiry. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="contact-page">
        <div className="contact-container">
          <div className="success-message-container">
            <div className="success-icon">
              <CheckCircle size={64} />
            </div>
            <h1>Thank You!</h1>
            <p className="success-main-text">Your inquiry has been received successfully.</p>
            <div className="reference-box">
              <p><strong>Reference Number:</strong></p>
              <p className="reference-number">{referenceNumber}</p>
            </div>
            <p className="success-sub-text">
              A member of our team will respond to you within 1-2 business days via your preferred contact method.
            </p>
            <p className="success-sub-text">
              A confirmation email has been sent to your email address.
            </p>
            <button 
              className="btn-primary"
              onClick={() => {
                setSuccess(false);
                setReferenceNumber('');
              }}
            >
              Submit Another Inquiry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <div className="contact-hero">
        <div className="hero-content">
          <h1>Contact Us</h1>
          <p>We're here to help you with all your banking needs</p>
        </div>
      </div>

      <div className="contact-container">
        {/* Contact Methods Grid */}
        <div className="contact-methods">
          <div className="method-card">
            <div className="method-icon">
              <Phone />
            </div>
            <h3>Call Us</h3>
            <p className="method-title">24/7 Member Support</p>
            <p className="method-detail">1-888-842-6328</p>
            <p className="method-info">Available 24 hours a day, 7 days a week</p>
          </div>

          <div className="method-card">
            <div className="method-icon">
              <Mail />
            </div>
            <h3>Email Us</h3>
            <p className="method-title">General Inquiries</p>
            <p className="method-detail">support@navyfederal.org</p>
            <p className="method-info">Response within 1-2 business days</p>
          </div>

          <div className="method-card">
            <div className="method-icon">
              <MapPin />
            </div>
            <h3>Visit Us</h3>
            <p className="method-title">Main Office</p>
            <p className="method-detail">820 Follin Lane, Vienna, VA 22180</p>
            <p className="method-info">Monday - Friday: 8AM - 5PM EST</p>
          </div>

          <div className="method-card">
            <div className="method-icon">
              <Clock />
            </div>
            <h3>Business Hours</h3>
            <p className="method-title">Customer Service</p>
            <p className="method-detail">Mon-Fri: 8AM - 10PM EST</p>
            <p className="method-detail">Sat-Sun: 9AM - 6PM EST</p>
            <p className="method-info">Holidays: 9AM - 5PM EST</p>
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="form-section">
          <div className="form-header">
            <MessageSquare className="form-header-icon" />
            <div>
              <h2>Send Us a Message</h2>
              <p>Fill out the form below and we'll get back to you as soon as possible</p>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">
                  First Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">
                  Last Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter your last name"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">
                  Email Address <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">
                  Phone Number <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="subject">
                  Subject <span className="required">*</span>
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">-- Select a subject --</option>
                  {subjectOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="memberNumber">
                  Member Number (Optional)
                </label>
                <input
                  type="text"
                  id="memberNumber"
                  name="memberNumber"
                  value={formData.memberNumber}
                  onChange={handleChange}
                  placeholder="Enter your member number"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="preferredContactMethod">
                Preferred Contact Method <span className="required">*</span>
              </label>
              <select
                id="preferredContactMethod"
                name="preferredContactMethod"
                value={formData.preferredContactMethod}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="Email">Email</option>
                <option value="Phone">Phone</option>
                <option value="Mail">Mail</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">
                Message <span className="required">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Please provide details about your inquiry..."
                rows="6"
                disabled={loading}
              ></textarea>
              <small className="char-count">
                {formData.message.length} / 1000 characters
              </small>
            </div>

            <div className="form-notice">
              <AlertCircle size={18} />
              <p>
                <strong>Security Notice:</strong> Please do not include sensitive information such as 
                account numbers, Social Security numbers, or passwords in your message.
              </p>
            </div>

            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Inquiry'}
            </button>
          </form>
        </div>

        {/* Additional Resources */}
        <div className="resources-section">
          <h2>Additional Resources</h2>
          <div className="resources-grid">
            <div className="resource-card">
              <h3>FAQs</h3>
              <p>Find answers to commonly asked questions about our services</p>
              <a href="/faq" className="resource-link">View FAQs →</a>
            </div>
            <div className="resource-card">
              <h3>Branch Locator</h3>
              <p>Find a Navy Federal branch or ATM near you</p>
              <a href="/branch-locator" className="resource-link">Find Locations →</a>
            </div>
            <div className="resource-card">
              <h3>Security Center</h3>
              <p>Learn how we protect your information and report fraud</p>
              <a href="/security" className="resource-link">Security Info →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInformationPage;