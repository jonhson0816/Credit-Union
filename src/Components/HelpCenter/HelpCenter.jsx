import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Phone, 
  MessageCircle, 
  Mail, 
  MapPin,
  CreditCard,
  DollarSign,
  Smartphone,
  Lock,
  Users,
  FileText,
  Calculator,
  Building,
  Clock,
  ChevronRight,
  HelpCircle,
  BookOpen,
  Video,
  Headphones,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Star,
  Send,
  AlertCircle
} from 'lucide-react';
import './HelpCenter.css';

const API_BASE_URL = 'http://localhost:3000/api/help';

// Icon mapping for categories
const categoryIcons = {
  'account-management': Users,
  'digital-banking': Smartphone,
  'cards-payments': CreditCard,
  'loans-credit': DollarSign,
  'security-fraud': Lock,
  'transfers-billpay': FileText,
  'membership': Building,
  'financial-tools': Calculator
};

// Main Help Center Component
const HelpCenter = () => {
  const [view, setView] = useState('home');
  const [categories, setCategories] = useState([]);
  const [popularArticles, setPopularArticles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [categoryArticles, setCategoryArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchPopularArticles();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchPopularArticles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/popular?limit=6`);
      const data = await response.json();
      if (data.success) {
        setPopularArticles(data.data);
      }
    } catch (err) {
      console.error('Error fetching popular articles:', err);
    }
  };

  const fetchCategoryArticles = async (categoryId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/articles`);
      const data = await response.json();
      if (data.success) {
        setCategoryArticles(data.data);
      }
    } catch (err) {
      setError('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const fetchArticle = async (slug) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/articles/${slug}`);
      const data = await response.json();
      if (data.success) {
        setSelectedArticle(data.data);
      }
    } catch (err) {
      setError('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setView('search');
    try {
      const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    fetchCategoryArticles(category.id);
    setView('category');
  };

  const handleArticleClick = (article) => {
    fetchArticle(article.slug);
    setView('article');
  };

  const handleBack = () => {
    if (view === 'article' && selectedCategory) {
      setView('category');
    } else {
      setView('home');
      setSelectedCategory(null);
      setSelectedArticle(null);
    }
  };

  if (view === 'article' && selectedArticle) {
    return <ArticleView article={selectedArticle} onBack={handleBack} />;
  }

  if (view === 'category' && selectedCategory) {
    return (
      <CategoryView 
        category={selectedCategory} 
        articles={categoryArticles}
        loading={loading}
        onBack={handleBack}
        onArticleClick={handleArticleClick}
      />
    );
  }

  if (view === 'search') {
    return (
      <SearchView 
        query={searchQuery}
        results={searchResults}
        loading={loading}
        onBack={handleBack}
        onArticleClick={handleArticleClick}
      />
    );
  }

  if (view === 'ticket') {
    return <CreateTicketView onBack={handleBack} />;
  }

  return (
    <div className="help-center">
      <div className="help-hero">
        <div className="help-hero-content">
          <h1 className="help-hero-title">How Can We Help You?</h1>
          <p className="help-hero-subtitle">Search our help center or browse categories below</p>
          
          <form onSubmit={handleSearch} className="help-search-box">
            <Search className="help-search-icon" size={22} />
            <input
              type="text"
              placeholder="Search for help articles, topics, or questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="help-search-input"
            />
          </form>

          <div className="help-quick-links">
            <button className="help-quick-link-btn" onClick={() => setView('ticket')}>
              <Headphones size={20} />
              <span>Create Ticket</span>
            </button>
          </div>
        </div>
      </div>

      <div className="help-content">
        <section className="help-section">
          <h2 className="help-section-title">Browse by Category</h2>
          <div className="help-categories-grid">
            {categories.map((category) => {
              const IconComponent = categoryIcons[category.id] || HelpCircle;
              return (
                <div 
                  key={category.id}
                  className="help-category-card"
                  onClick={() => handleCategoryClick(category)}
                >
                  <div className="help-category-icon">
                    <IconComponent size={32} />
                  </div>
                  <h3 className="help-category-title">{category.title}</h3>
                  <p className="help-category-desc">{category.description}</p>
                  <div className="help-category-meta">
                    <span>{category.articleCount} articles</span>
                    <ChevronRight size={18} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="help-section">
          <h2 className="help-section-title">Popular Help Articles</h2>
          <div className="help-popular-grid">
            {popularArticles.map((article, index) => (
              <div 
                key={index}
                className="help-popular-card"
                onClick={() => handleArticleClick(article)}
              >
                <div className="help-popular-icon">
                  <FileText size={20} />
                </div>
                <div className="help-popular-content">
                  <h4 className="help-popular-title">{article.title}</h4>
                  <span className="help-popular-views">{article.views.toLocaleString()} views</span>
                </div>
                <ChevronRight size={20} />
              </div>
            ))}
          </div>
        </section>

        <section className="help-section">
          <div className="help-contact-header">
            <h2>Need More Help?</h2>
            <p>Our member services team is here to assist you</p>
          </div>
          <div className="help-contact-grid">
            <ContactCard
              icon={<Phone size={28} />}
              title="Phone Support"
              description="24/7 Member Services"
              detail="1-888-842-6328"
              available="Available 24/7"
              action="Call Now"
              onClick={() => window.location.href = 'tel:1-888-842-6328'}
            />
            <ContactCard
              icon={<MessageCircle size={28} />}
              title="Create Support Ticket"
              description="Submit a detailed request"
              detail="Response within 1 business day"
              available="Login required"
              action="Create Ticket"
              onClick={() => setView('ticket')}
            />
          </div>
        </section>

        <div className="help-emergency-banner">
          <Lock size={28} />
          <div className="help-emergency-content">
            <h3 className="help-emergency-title">Report Fraud or Lost Card Immediately</h3>
            <p className="help-emergency-text">
              If you suspect fraud or have lost your card, contact us right away at <strong>1-888-842-6328</strong> (24/7)
            </p>
          </div>
          <button 
            className="help-emergency-btn"
            onClick={() => window.location.href = 'tel:1-888-842-6328'}
          >
            Report Now
          </button>
        </div>
      </div>
    </div>
  );
};

// Category View Component
const CategoryView = ({ category, articles, loading, onBack, onArticleClick }) => {
  const IconComponent = categoryIcons[category.id] || HelpCircle;

  return (
    <div className="help-center">
      <div className="help-header">
        <button onClick={onBack} className="help-back-btn">
          <ArrowLeft size={20} />
          Back to Help Center
        </button>
      </div>

      <div className="help-content">
        <div className="help-category-header">
          <div className="help-category-icon-large">
            <IconComponent size={48} />
          </div>
          <div>
            <h1 className="help-page-title">{category.title}</h1>
            <p className="help-page-subtitle">{category.description}</p>
          </div>
        </div>

        {loading ? (
          <div className="help-loading">Loading articles...</div>
        ) : (
          <div className="help-articles-grid">
            {articles.map((article) => (
              <div 
                key={article._id}
                className="help-article-card"
                onClick={() => onArticleClick(article)}
              >
                <h3 className="help-article-card-title">{article.title}</h3>
                <p className="help-article-card-excerpt">{article.excerpt}</p>
                <div className="help-article-card-meta">
                  <span>{article.readTime} min read</span>
                  <span>•</span>
                  <span>{article.views} views</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Article View Component
const ArticleView = ({ article, onBack }) => {
  const [feedback, setFeedback] = useState(null);

  const handleFeedback = async (helpful) => {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: article._id, helpful })
      });
      const data = await response.json();
      if (data.success) {
        setFeedback(helpful);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
    }
  };

  return (
    <div className="help-center">
      <div className="help-header">
        <button onClick={onBack} className="help-back-btn">
          <ArrowLeft size={20} />
          Back
        </button>
      </div>

      <div className="help-article-container">
        <article className="help-article">
          <div className="help-article-header">
            <span className="help-article-category">{article.categoryTitle}</span>
            <h1 className="help-article-title">{article.title}</h1>
            <div className="help-article-meta">
              <span>{article.readTime} min read</span>
              <span>•</span>
              <span>{article.views} views</span>
              <span>•</span>
              <span>Last updated: {new Date(article.lastUpdated).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="help-article-content">
            {article.content.split('\n').map((paragraph, index) => {
              if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                return <h3 key={index} className="help-article-subheading">{paragraph.replace(/\*\*/g, '')}</h3>;
              }
              if (paragraph.startsWith('- ')) {
                return <li key={index} className="help-article-list-item">{paragraph.substring(2)}</li>;
              }
              if (paragraph.trim()) {
                return <p key={index} className="help-article-paragraph">{paragraph}</p>;
              }
              return null;
            })}
          </div>

          <div className="help-feedback-section">
            <h3 className="help-feedback-title">Was this article helpful?</h3>
            {feedback === null ? (
              <div className="help-feedback-buttons">
                <button 
                  className="help-feedback-btn"
                  onClick={() => handleFeedback(true)}
                >
                  <ThumbsUp size={20} />
                  Yes
                </button>
                <button 
                  className="help-feedback-btn"
                  onClick={() => handleFeedback(false)}
                >
                  <ThumbsDown size={20} />
                  No
                </button>
              </div>
            ) : (
              <div className="help-feedback-thanks">
                Thank you for your feedback!
              </div>
            )}
          </div>

          {article.relatedArticles && article.relatedArticles.length > 0 && (
            <div className="help-related-section">
              <h3 className="help-related-title">Related Articles</h3>
              <div className="help-related-grid">
                {article.relatedArticles.map((related) => (
                  <div key={related._id} className="help-related-card">
                    <h4 className="help-related-card-title">{related.title}</h4>
                    <p className="help-related-card-excerpt">{related.excerpt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
};

// Search View Component
const SearchView = ({ query, results, loading, onBack, onArticleClick }) => {
  return (
    <div className="help-center">
      <div className="help-header">
        <button onClick={onBack} className="help-back-btn">
          <ArrowLeft size={20} />
          Back to Help Center
        </button>
      </div>

      <div className="help-content">
        <h1 className="help-page-title">Search Results for "{query}"</h1>
        <p className="help-page-subtitle">Found {results.length} article{results.length !== 1 ? 's' : ''}</p>

        {loading ? (
          <div className="help-loading">Searching...</div>
        ) : results.length > 0 ? (
          <div className="help-articles-grid">
            {results.map((article) => (
              <div 
                key={article._id}
                className="help-article-card"
                onClick={() => onArticleClick(article)}
              >
                <span className="help-article-card-category">{article.categoryTitle}</span>
                <h3 className="help-article-card-title">{article.title}</h3>
                <p className="help-article-card-excerpt">{article.excerpt}</p>
                <div className="help-article-card-meta">
                  <span>{article.readTime} min read</span>
                  <span>•</span>
                  <span>{article.views} views</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="help-no-results">
            <HelpCircle size={48} />
            <h3>No results found</h3>
            <p>Try different keywords or browse our categories</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Create Ticket View Component
const CreateTicketView = ({ onBack }) => {
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    description: '',
    priority: 'medium'
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to create a support ticket');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.message || 'Failed to create ticket');
      }
    } catch (err) {
      setError('Failed to create ticket. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="help-center">
        <div className="help-content">
          <div className="help-success-message">
            <div className="help-success-icon">✓</div>
            <h2>Ticket Created Successfully!</h2>
            <p>We've received your request and will respond within 1 business day.</p>
            <button onClick={onBack} className="help-primary-btn">
              Back to Help Center
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="help-center">
      <div className="help-header">
        <button onClick={onBack} className="help-back-btn">
          <ArrowLeft size={20} />
          Back to Help Center
        </button>
      </div>

      <div className="help-content">
        <h1 className="help-page-title">Create Support Ticket</h1>
        <p className="help-page-subtitle">Fill out the form below and we'll get back to you soon</p>

        {error && (
          <div className="help-error-message">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="help-form">
          <div className="help-form-group">
            <label className="help-label">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="help-select"
              required
            >
              <option value="">Select a category</option>
              <option value="account-management">Account Management</option>
              <option value="digital-banking">Online & Mobile Banking</option>
              <option value="cards-payments">Cards & Payments</option>
              <option value="loans-credit">Loans & Credit</option>
              <option value="security-fraud">Security & Fraud</option>
              <option value="transfers-billpay">Transfers & Bill Pay</option>
              <option value="membership">Membership</option>
              <option value="financial-tools">Financial Tools</option>
            </select>
          </div>

          <div className="help-form-group">
            <label className="help-label">Priority *</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({...formData, priority: e.target.value})}
              className="help-select"
              required
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="help-form-group">
            <label className="help-label">Subject *</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              className="help-input"
              placeholder="Brief description of your issue"
              required
              maxLength={200}
            />
          </div>

          <div className="help-form-group">
            <label className="help-label">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="help-textarea"
              placeholder="Please provide detailed information about your issue..."
              required
              rows={8}
              maxLength={5000}
            />
          </div>

          <button type="submit" className="help-submit-btn">
            <Send size={20} />
            Submit Ticket
          </button>
        </form>
      </div>
    </div>
  );
};

// Contact Card Component
const ContactCard = ({ icon, title, description, detail, available, action, onClick }) => (
  <div className="help-contact-card">
    <div className="help-contact-icon">{icon}</div>
    <h3 className="help-contact-title">{title}</h3>
    <p className="help-contact-desc">{description}</p>
    <div className="help-contact-detail">{detail}</div>
    <div className="help-contact-available">
      <Clock size={16} />
      <span>{available}</span>
    </div>
    <button className="help-contact-btn" onClick={onClick}>
      {action}
    </button>
  </div>
);

export default HelpCenter;