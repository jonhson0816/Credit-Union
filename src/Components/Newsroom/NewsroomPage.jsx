import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './NewsroomPage.css';

const NewsroomPage = () => {
  const [news, setNews] = useState([]);
  const [featuredNews, setFeaturedNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || 'https://credit-unionapi.onrender.com/api';

  // Fetch news articles
  const fetchNews = async (page = 1, category = 'All', search = '') => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 9,
        ...(category !== 'All' && { category }),
        ...(search && { search })
      };

      const response = await axios.get(`${API_URL}/news`, { params });
      
      setNews(response.data.data);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.page);
      setError(null);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load news articles. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch featured news
  const fetchFeaturedNews = async () => {
    try {
      const response = await axios.get(`${API_URL}/news/featured?limit=3`);
      setFeaturedNews(response.data.data);
    } catch (err) {
      console.error('Error fetching featured news:', err);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/news/categories`);
      setCategories(response.data.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchFeaturedNews();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchNews(currentPage, selectedCategory, searchQuery);
  }, [currentPage, selectedCategory, searchQuery]);

  // Handle category change
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchNews(1, selectedCategory, searchQuery);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Truncate text
  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  return (
    <div className="newsroom-page">
      {/* Hero Section */}
      <section className="newsroom-hero">
        <div className="hero-content">
          <h1>Navy Federal Newsroom</h1>
          <p>Stay informed with the latest news, updates, and stories from Navy Federal Credit Union</p>
        </div>
      </section>

      {/* Featured News Section */}
      {featuredNews.length > 0 && (
        <section className="featured-news-section">
          <div className="container">
            <h2 className="section-title">Featured Stories</h2>
            <div className="featured-news-grid">
              {featuredNews.map((article) => (
                <div key={article._id} className="featured-card">
                  <div className="featured-image">
                    <img 
                      src={article.imageUrl || '/default-news.jpg'} 
                      alt={article.title}
                      onError={(e) => e.target.src = '/default-news.jpg'}
                    />
                    <span className="featured-badge">Featured</span>
                  </div>
                  <div className="featured-content">
                    <span className="category-badge">{article.category}</span>
                    <h3>{article.title}</h3>
                    <p className="subtitle">{article.subtitle}</p>
                    <div className="article-meta">
                      <span className="date">{formatDate(article.publishDate)}</span>
                      <span className="author">By {article.author}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content Section */}
      <section className="newsroom-content">
        <div className="container">
          {/* Search and Filter Bar */}
          <div className="filter-section">
            <form onSubmit={handleSearch} className="search-bar">
              <input
                type="text"
                placeholder="Search news articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-button">
                <span>Search</span>
              </button>
            </form>

            <div className="category-filters">
              <button
                className={`category-btn ${selectedCategory === 'All' ? 'active' : ''}`}
                onClick={() => handleCategoryChange('All')}
              >
                All News
              </button>
              <button
                className={`category-btn ${selectedCategory === 'Press Release' ? 'active' : ''}`}
                onClick={() => handleCategoryChange('Press Release')}
              >
                Press Releases
              </button>
              <button
                className={`category-btn ${selectedCategory === 'Company News' ? 'active' : ''}`}
                onClick={() => handleCategoryChange('Company News')}
              >
                Company News
              </button>
              <button
                className={`category-btn ${selectedCategory === 'Community' ? 'active' : ''}`}
                onClick={() => handleCategoryChange('Community')}
              >
                Community
              </button>
              <button
                className={`category-btn ${selectedCategory === 'Awards' ? 'active' : ''}`}
                onClick={() => handleCategoryChange('Awards')}
              >
                Awards
              </button>
              <button
                className={`category-btn ${selectedCategory === 'Financial Tips' ? 'active' : ''}`}
                onClick={() => handleCategoryChange('Financial Tips')}
              >
                Financial Tips
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading news articles...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="error-state">
              <p>{error}</p>
            </div>
          )}

          {/* News Grid */}
          {!loading && !error && (
            <>
              <div className="news-grid">
                {news.map((article) => (
                  <article key={article._id} className="news-card">
                    <div className="news-image">
                      <img 
                        src={article.imageUrl || '/default-news.jpg'} 
                        alt={article.title}
                        onError={(e) => e.target.src = '/default-news.jpg'}
                      />
                    </div>
                    <div className="news-content">
                      <span className="category-badge">{article.category}</span>
                      <h3 className="news-title">{article.title}</h3>
                      <p className="news-excerpt">
                        {truncateText(article.subtitle || article.content, 120)}
                      </p>
                      <div className="news-meta">
                        <span className="date">{formatDate(article.publishDate)}</span>
                        <span className="views">{article.views} views</span>
                      </div>
                      <button className="read-more-btn">Read More</button>
                    </div>
                  </article>
                ))}
              </div>

              {/* No Results */}
              {news.length === 0 && (
                <div className="no-results">
                  <h3>No articles found</h3>
                  <p>Try adjusting your search or filter criteria</p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  
                  <div className="page-numbers">
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNum = index + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        pageNum === currentPage - 2 ||
                        pageNum === currentPage + 2
                      ) {
                        return <span key={pageNum} className="page-ellipsis">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-content">
            <h2>Stay Updated</h2>
            <p>Subscribe to receive the latest news and updates from Navy Federal Credit Union</p>
            <form className="newsletter-form">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                required 
              />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default NewsroomPage;