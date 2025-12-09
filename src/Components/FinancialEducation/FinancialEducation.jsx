import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BookOpen, 
  Trophy, 
  TrendingUp, 
  Award, 
  Clock, 
  Search,
  Bookmark,
  Heart,
  CheckCircle,
  Star,
  Target,
  BarChart
} from 'lucide-react';
import './FinancialEducation.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const FinancialEducation = () => {
  const [activeTab, setActiveTab] = useState('articles');
  const [articles, setArticles] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [userProgress, setUserProgress] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchArticles(),
        fetchQuizzes(),
        fetchCategories(),
        fetchUserProgress()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    try {
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;

      const response = await axios.get(`${API_URL}/financial-education/articles`, { params });
      setArticles(response.data.data);
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;

      const response = await axios.get(`${API_URL}/financial-education/quizzes`, { params });
      setQuizzes(response.data.data);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/financial-education/categories`);
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchUserProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/financial-education/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserProgress(response.data.data);
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const fetchArticleById = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/financial-education/articles/${id}`);
      setSelectedArticle(response.data.data);
    } catch (error) {
      console.error('Error fetching article:', error);
    }
  };

  const fetchQuizById = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/financial-education/quizzes/${id}`);
      setSelectedQuiz(response.data.data);
      setQuizAnswers({});
      setQuizResults(null);
    } catch (error) {
      console.error('Error fetching quiz:', error);
    }
  };

  const handleLikeArticle = async (articleId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to like articles');
        return;
      }

      await axios.post(
        `${API_URL}/financial-education/articles/${articleId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchArticles();
    } catch (error) {
      console.error('Error liking article:', error);
    }
  };

  const handleSaveArticle = async (articleId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to save articles');
        return;
      }

      await axios.post(
        `${API_URL}/financial-education/articles/${articleId}/save`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUserProgress();
    } catch (error) {
      console.error('Error saving article:', error);
    }
  };

  const handleCompleteArticle = async (articleId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to track progress');
        return;
      }

      await axios.post(
        `${API_URL}/financial-education/articles/${articleId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUserProgress();
      alert('Article marked as completed! You earned 10 points!');
    } catch (error) {
      console.error('Error completing article:', error);
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to take quizzes');
        return;
      }

      const answers = Object.values(quizAnswers);
      if (answers.length !== selectedQuiz.questions.length) {
        alert('Please answer all questions');
        return;
      }

      const response = await axios.post(
        `${API_URL}/financial-education/quizzes/${selectedQuiz._id}/submit`,
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setQuizResults(response.data.data);
      fetchUserProgress();
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  useEffect(() => {
    if (selectedCategory !== 'all' || searchQuery) {
      fetchArticles();
      fetchQuizzes();
    }
  }, [selectedCategory, searchQuery]);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return 'difficulty-beginner';
      case 'Intermediate': return 'difficulty-intermediate';
      case 'Advanced': return 'difficulty-advanced';
      default: return 'difficulty-beginner';
    }
  };

  const isArticleSaved = (articleId) => {
    return userProgress?.savedArticles?.some(a => a._id === articleId);
  };

  const isArticleCompleted = (articleId) => {
    return userProgress?.completedArticles?.some(a => a.articleId === articleId);
  };

  if (loading) {
    return (
      <div className="fin-edu-loading">
        <div className="fin-edu-spinner"></div>
        <p>Loading Financial Education...</p>
      </div>
    );
  }

  // Article Detail View
  if (selectedArticle) {
    return (
      <div className="fin-edu-container">
        <div className="fin-edu-article-detail">
          <button 
            className="fin-edu-back-btn"
            onClick={() => setSelectedArticle(null)}
          >
            ← Back to Articles
          </button>
          
          <div className="fin-edu-article-header">
            <span className={`fin-edu-category-badge ${selectedArticle.category.toLowerCase()}`}>
              {selectedArticle.category}
            </span>
            <span className={`fin-edu-difficulty-badge ${getDifficultyColor(selectedArticle.difficulty)}`}>
              {selectedArticle.difficulty}
            </span>
          </div>

          <h1>{selectedArticle.title}</h1>
          
          <div className="fin-edu-article-meta">
            <span><Clock size={16} /> {selectedArticle.readTime} min read</span>
            <span><Heart size={16} /> {selectedArticle.likes?.length || 0} likes</span>
            <span>By {selectedArticle.author}</span>
          </div>

          {selectedArticle.imageUrl && (
            <img 
              src={selectedArticle.imageUrl} 
              alt={selectedArticle.title}
              className="fin-edu-article-image"
            />
          )}

          <div className="fin-edu-article-content">
            {selectedArticle.content}
          </div>

          <div className="fin-edu-article-actions">
            <button 
              className="fin-edu-action-btn primary"
              onClick={() => handleCompleteArticle(selectedArticle._id)}
              disabled={isArticleCompleted(selectedArticle._id)}
            >
              <CheckCircle size={20} />
              {isArticleCompleted(selectedArticle._id) ? 'Completed' : 'Mark as Complete'}
            </button>
            <button 
              className="fin-edu-action-btn"
              onClick={() => handleLikeArticle(selectedArticle._id)}
            >
              <Heart size={20} /> Like
            </button>
            <button 
              className="fin-edu-action-btn"
              onClick={() => handleSaveArticle(selectedArticle._id)}
            >
              <Bookmark size={20} />
              {isArticleSaved(selectedArticle._id) ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Detail View
  if (selectedQuiz) {
    return (
      <div className="fin-edu-container">
        <div className="fin-edu-quiz-detail">
          <button 
            className="fin-edu-back-btn"
            onClick={() => {
              setSelectedQuiz(null);
              setQuizResults(null);
            }}
          >
            ← Back to Quizzes
          </button>

          {!quizResults ? (
            <>
              <div className="fin-edu-quiz-header">
                <h1>{selectedQuiz.title}</h1>
                <div className="fin-edu-quiz-info">
                  <span className={`fin-edu-category-badge ${selectedQuiz.category.toLowerCase()}`}>
                    {selectedQuiz.category}
                  </span>
                  <span className={`fin-edu-difficulty-badge ${getDifficultyColor(selectedQuiz.difficulty)}`}>
                    {selectedQuiz.difficulty}
                  </span>
                  <span><Clock size={16} /> {selectedQuiz.timeLimit} minutes</span>
                </div>
              </div>

              <div className="fin-edu-questions">
                {selectedQuiz.questions.map((question, qIndex) => (
                  <div key={qIndex} className="fin-edu-question-card">
                    <h3>Question {qIndex + 1}</h3>
                    <p className="fin-edu-question-text">{question.question}</p>
                    
                    <div className="fin-edu-options">
                      {question.options.map((option, oIndex) => (
                        <label key={oIndex} className="fin-edu-option">
                          <input
                            type="radio"
                            name={`question-${qIndex}`}
                            value={oIndex}
                            checked={quizAnswers[qIndex] === oIndex}
                            onChange={() => setQuizAnswers({ ...quizAnswers, [qIndex]: oIndex })}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button 
                className="fin-edu-submit-btn"
                onClick={handleSubmitQuiz}
                disabled={Object.keys(quizAnswers).length !== selectedQuiz.questions.length}
              >
                Submit Quiz
              </button>
            </>
          ) : (
            <div className="fin-edu-quiz-results">
              <div className={`fin-edu-score ${quizResults.passed ? 'passed' : 'failed'}`}>
                <Trophy size={48} />
                <h2>Your Score: {quizResults.score}%</h2>
                <p>
                  {quizResults.passed 
                    ? `Congratulations! You passed with ${quizResults.correctAnswers}/${quizResults.totalQuestions} correct answers!`
                    : `You need ${selectedQuiz.passingScore}% to pass. Try again!`
                  }
                </p>
              </div>

              <div className="fin-edu-results-details">
                {quizResults.results.map((result, index) => (
                  <div key={index} className={`fin-edu-result-card ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                    <div className="fin-edu-result-header">
                      <h4>Question {index + 1}</h4>
                      {result.isCorrect ? (
                        <CheckCircle size={20} color="#10b981" />
                      ) : (
                        <span className="fin-edu-wrong">✗</span>
                      )}
                    </div>
                    <p className="fin-edu-result-question">{result.question}</p>
                    <p className="fin-edu-result-explanation">{result.explanation}</p>
                  </div>
                ))}
              </div>

              <button 
                className="fin-edu-retry-btn"
                onClick={() => {
                  setQuizResults(null);
                  setQuizAnswers({});
                }}
              >
                Retake Quiz
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main Dashboard View
  return (
    <div className="fin-edu-container">
      <header className="fin-edu-header">
        <div className="fin-edu-header-content">
          <div>
            <h1><BookOpen size={32} /> Financial Education Center</h1>
            <p>Enhance your financial literacy with our comprehensive resources</p>
          </div>

          {userProgress && (
            <div className="fin-edu-user-stats">
              <div className="fin-edu-stat">
                <Star size={20} />
                <div>
                  <strong>Level {userProgress.level}</strong>
                  <span>{userProgress.totalPoints} points</span>
                </div>
              </div>
              <div className="fin-edu-stat">
                <Target size={20} />
                <div>
                  <strong>{userProgress.streak.current} Day Streak</strong>
                  <span>Best: {userProgress.streak.longest}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="fin-edu-search-bar">
        <Search size={20} />
        <input
          type="text"
          placeholder="Search articles, quizzes, topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="fin-edu-categories">
        <button
          className={`fin-edu-category-chip ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.category}
            className={`fin-edu-category-chip ${selectedCategory === cat.category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.category)}
          >
            {cat.category} ({cat.count})
          </button>
        ))}
      </div>

      <div className="fin-edu-tabs">
        <button
          className={`fin-edu-tab ${activeTab === 'articles' ? 'active' : ''}`}
          onClick={() => setActiveTab('articles')}
        >
          <BookOpen size={20} /> Articles
        </button>
        <button
          className={`fin-edu-tab ${activeTab === 'quizzes' ? 'active' : ''}`}
          onClick={() => setActiveTab('quizzes')}
        >
          <Trophy size={20} /> Quizzes
        </button>
        {userProgress && (
          <button
            className={`fin-edu-tab ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            <BarChart size={20} /> My Progress
          </button>
        )}
      </div>

      <div className="fin-edu-content">
        {activeTab === 'articles' && (
          <div className="fin-edu-grid">
            {articles.map((article) => (
              <div key={article._id} className="fin-edu-card">
                {article.imageUrl && (
                  <div className="fin-edu-card-image">
                    <img src={article.imageUrl} alt={article.title} />
                  </div>
                )}
                <div className="fin-edu-card-content">
                  <div className="fin-edu-card-badges">
                    <span className={`fin-edu-category-badge ${article.category.toLowerCase()}`}>
                      {article.category}
                    </span>
                    <span className={`fin-edu-difficulty-badge ${getDifficultyColor(article.difficulty)}`}>
                      {article.difficulty}
                    </span>
                  </div>
                  <h3>{article.title}</h3>
                  <p>{article.summary}</p>
                  <div className="fin-edu-card-meta">
                    <span><Clock size={14} /> {article.readTime} min</span>
                    <span><Heart size={14} /> {article.likes?.length || 0}</span>
                    {isArticleCompleted(article._id) && (
                      <span className="fin-edu-completed"><CheckCircle size={14} /> Completed</span>
                    )}
                  </div>
                  <button
                    className="fin-edu-read-btn"
                    onClick={() => fetchArticleById(article._id)}
                  >
                    Read Article →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'quizzes' && (
          <div className="fin-edu-grid">
            {quizzes.map((quiz) => (
              <div key={quiz._id} className="fin-edu-card">
                <div className="fin-edu-card-content">
                  <div className="fin-edu-card-badges">
                    <span className={`fin-edu-category-badge ${quiz.category.toLowerCase()}`}>
                      {quiz.category}
                    </span>
                    <span className={`fin-edu-difficulty-badge ${getDifficultyColor(quiz.difficulty)}`}>
                      {quiz.difficulty}
                    </span>
                  </div>
                  <h3>{quiz.title}</h3>
                  <div className="fin-edu-quiz-info">
                    <span><Trophy size={14} /> {quiz.questions?.length} Questions</span>
                    <span><Clock size={14} /> {quiz.timeLimit} minutes</span>
                    <span><Award size={14} /> Pass: {quiz.passingScore}%</span>
                  </div>
                  <button
                    className="fin-edu-read-btn"
                    onClick={() => fetchQuizById(quiz._id)}
                  >
                    Take Quiz →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'progress' && userProgress && (
          <div className="fin-edu-progress">
            <div className="fin-edu-progress-card">
              <h2><TrendingUp size={24} /> Your Learning Journey</h2>
              <div className="fin-edu-progress-stats">
                <div className="fin-edu-progress-stat">
                  <strong>{userProgress.completedArticles?.length || 0}</strong>
                  <span>Articles Completed</span>
                </div>
                <div className="fin-edu-progress-stat">
                  <strong>{userProgress.completedQuizzes?.length || 0}</strong>
                  <span>Quizzes Completed</span>
                </div>
                <div className="fin-edu-progress-stat">
                  <strong>{userProgress.savedArticles?.length || 0}</strong>
                  <span>Saved Articles</span>
                </div>
                <div className="fin-edu-progress-stat">
                  <strong>{userProgress.badges?.length || 0}</strong>
                  <span>Badges Earned</span>
                </div>
              </div>
            </div>

            {userProgress.savedArticles?.length > 0 && (
              <div className="fin-edu-progress-card">
                <h3><Bookmark size={20} /> Saved Articles</h3>
                <div className="fin-edu-saved-list">
                  {userProgress.savedArticles.map((article) => (
                    <div key={article._id} className="fin-edu-saved-item">
                      <span>{article.title}</span>
                      <button onClick={() => fetchArticleById(article._id)}>
                        Read →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialEducation;