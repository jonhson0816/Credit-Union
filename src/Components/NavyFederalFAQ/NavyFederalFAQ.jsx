import React, { useState } from 'react';
import { ChevronDown, Search, Phone, Mail, MessageCircle } from 'lucide-react';
import './NavyFederalFAQ.css';

const NavyFederalFAQ = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [openFAQ, setOpenFAQ] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: 'All Topics' },
    { id: 'accounts', name: 'Accounts & Services' },
    { id: 'loans', name: 'Loans & Credit' },
    { id: 'digital', name: 'Digital Banking' },
    { id: 'security', name: 'Security & Privacy' },
    { id: 'membership', name: 'Membership' }
  ];

  const faqs = [
    {
      category: 'membership',
      question: 'Who is eligible to join Navy Federal Credit Union?',
      answer: 'Navy Federal membership is open to all Department of Defense (DoD) military members (Army, Marine Corps, Navy, Air Force, Space Force, Coast Guard), DoD civilian employees, and their family members. This includes veterans, retirees, and annuitants. Family members include grandparents, parents, spouses, siblings, children (including adopted and stepchildren), and grandchildren.'
    },
    {
      category: 'membership',
      question: 'How do I become a member?',
      answer: 'You can join Navy Federal online, by phone at 1-888-842-6328, or at any branch. You\'ll need to verify your eligibility and make a minimum deposit of $5 into a savings account. You\'ll also need a valid government-issued ID, Social Security number, and proof of eligibility (military ID, DoD credentials, or documentation of family relationship).'
    },
    {
      category: 'accounts',
      question: 'What types of checking accounts does Navy Federal offer?',
      answer: 'Navy Federal offers several checking account options: Free EveryDay Checking (no monthly fees, no minimum balance), Flagship Checking (premium features with higher balance requirements), and Campus Checking (for students). All accounts include free online and mobile banking, bill pay, and access to over 30,000 fee-free ATMs worldwide.'
    },
    {
      category: 'accounts',
      question: 'Are there monthly fees for Navy Federal accounts?',
      answer: 'Navy Federal\'s EveryDay Checking and regular savings accounts have no monthly service fees and no minimum balance requirements. Some specialty accounts may have requirements, but we focus on providing fee-free banking to our members.'
    },
    {
      category: 'accounts',
      question: 'How do I open a savings account?',
      answer: 'You can open a savings account online, through our mobile app, by calling us, or at any branch. The minimum opening deposit is $5. We offer various savings products including regular savings, money market savings, and certificates with competitive rates for our members.'
    },
    {
      category: 'digital',
      question: 'How do I enroll in online banking?',
      answer: 'To enroll in online banking, visit navyfederal.org and click "Enroll" in the login section. You\'ll need your account number, Social Security number, and member access number (found on your statement). Once enrolled, you can download our mobile app and use the same login credentials.'
    },
    {
      category: 'digital',
      question: 'Is the Navy Federal mobile app secure?',
      answer: 'Yes, our mobile app uses industry-leading security including 256-bit encryption, multi-factor authentication, biometric login (fingerprint/face ID), and automatic timeout features. We also offer instant card controls, fraud alerts, and the ability to freeze/unfreeze your cards directly from the app.'
    },
    {
      category: 'digital',
      question: 'Can I deposit checks through the mobile app?',
      answer: 'Yes, mobile check deposit is available through our app. Simply log in, select "Deposit," take photos of the front and back of your endorsed check, and submit. Deposits made before 6 PM ET on business days are typically available the next business day.'
    },
    {
      category: 'digital',
      question: 'How do I set up Zelle for sending money?',
      answer: 'Zelle is integrated into Navy Federal\'s mobile app and online banking. Go to "Transfers" and select "Send Money with Zelle." Enroll using your email or mobile number, then you can send money to others with Zelle. Most transfers are completed within minutes.'
    },
    {
      category: 'loans',
      question: 'What types of auto loans does Navy Federal offer?',
      answer: 'We offer new and used auto loans, refinancing, lease buyouts, and private party auto loans. Our rates are highly competitive, and we offer up to 100% financing on new vehicles, 110% on used vehicles (to cover taxes and fees). The application process can be completed online with instant decisions for most applicants.'
    },
    {
      category: 'loans',
      question: 'What are the requirements for a mortgage?',
      answer: 'Navy Federal offers various mortgage options including conventional, VA, FHA, and ARM loans. Requirements vary by loan type, but generally include stable income, acceptable credit history, sufficient funds for closing costs, and an appraisal. VA loans offer special benefits like no down payment and no PMI for eligible military members.'
    },
    {
      category: 'loans',
      question: 'How do I apply for a personal loan?',
      answer: 'You can apply for a personal loan online, through our mobile app, by phone, or at a branch. Personal loans range from $250 to $50,000 with terms up to 60 months. Most applications receive an instant decision, and approved funds can be available as soon as the same day.'
    },
    {
      category: 'loans',
      question: 'What credit cards does Navy Federal offer?',
      answer: 'Navy Federal offers a variety of credit cards including cashRewards, Go Rewards, Platinum, and secured cards for building credit. Benefits include competitive rates, no balance transfer fees, no foreign transaction fees, and rewards programs. Many cards also include travel insurance and purchase protection.'
    },
    {
      category: 'security',
      question: 'How do I report a lost or stolen debit card?',
      answer: 'Report a lost or stolen card immediately by calling 1-888-842-6328 (24/7). You can also instantly freeze your card through our mobile app or online banking. Once reported, we\'ll cancel the card and issue a replacement, which typically arrives within 7-10 business days. Expedited delivery is available.'
    },
    {
      category: 'security',
      question: 'How does Navy Federal protect against fraud?',
      answer: 'We use advanced fraud monitoring systems that track unusual activity 24/7. You\'ll receive real-time alerts for suspicious transactions via text, email, or push notifications. We also offer Zero Liability protection, meaning you won\'t be responsible for unauthorized transactions when reported promptly.'
    },
    {
      category: 'security',
      question: 'What should I do if I suspect fraud on my account?',
      answer: 'Contact us immediately at 1-888-842-6328. Our fraud specialists are available 24/7. You can also freeze your cards instantly through the mobile app. Review your account regularly and report any unauthorized transactions within 60 days for full protection under our Zero Liability policy.'
    },
    {
      category: 'accounts',
      question: 'Where can I find Navy Federal ATMs?',
      answer: 'Navy Federal has over 30,000 fee-free ATMs worldwide through the CO-OP and Allpoint networks. Use our mobile app or website ATM locator to find the nearest location. We also reimburse up to $20 per month in fees if you use out-of-network ATMs.'
    },
    {
      category: 'accounts',
      question: 'How do I order checks?',
      answer: 'You can order checks online through the "Services" tab, through our mobile app, or by calling member services. First check orders are free for new members. We offer various check designs, and standard delivery takes about 7-10 business days.'
    },
    {
      category: 'digital',
      question: 'Can I pay bills through Navy Federal?',
      answer: 'Yes, our free Bill Pay service allows you to pay anyone from your Navy Federal account. Set up one-time or recurring payments, schedule payments in advance, and track payment history. Most electronic payments arrive within 1-3 business days.'
    },
    {
      category: 'loans',
      question: 'How do I check my credit score?',
      answer: 'Navy Federal members have free access to their FICO score through online banking and the mobile app. Your score updates monthly, and we provide tips for improving your credit. This is a true FICO score, not an estimate, and checking it won\'t impact your credit.'
    }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="faq-container">
      <div className="faq-header">
        <h1>Frequently Asked Questions</h1>
        <p>Find answers to common questions about Navy Federal Credit Union accounts, services, and membership. Can't find what you're looking for? Our member services team is here to help 24/7.</p>
      </div>

      <div className="search-section">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            className="search-input"
            placeholder="Search for answers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="categories">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="faq-list">
        {filteredFAQs.length > 0 ? (
          filteredFAQs.map((faq, index) => (
            <div key={index} className="faq-item">
              <button
                className={`faq-question ${openFAQ === index ? 'open' : ''}`}
                onClick={() => toggleFAQ(index)}
              >
                <span className="question-text">{faq.question}</span>
                <ChevronDown 
                  className={`chevron-icon ${openFAQ === index ? 'open' : ''}`}
                  size={24}
                />
              </button>
              <div className={`faq-answer ${openFAQ === index ? 'open' : ''}`}>
                <p>{faq.answer}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <h3>No results found</h3>
            <p>Try adjusting your search or browse by category</p>
          </div>
        )}
      </div>

      <div className="contact-section">
        <h2>Still Need Help?</h2>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '10px' }}>Our member services team is available 24/7 to assist you</p>
        
        <div className="contact-options">
          <div className="contact-card">
            <Phone className="contact-icon" />
            <h3>Call Us</h3>
            <p>Available 24/7</p>
            <div className="contact-detail">1-888-842-6328</div>
          </div>
          
          <div className="contact-card">
            <MessageCircle className="contact-icon" />
            <h3>Live Chat</h3>
            <p>Chat with a representative</p>
            <div className="contact-detail">Start Chat</div>
          </div>
          
          <div className="contact-card">
            <Mail className="contact-icon" />
            <h3>Secure Message</h3>
            <p>Send us a message</p>
            <div className="contact-detail">Login to Message</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavyFederalFAQ;