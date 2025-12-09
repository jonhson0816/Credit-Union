import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Check, Plus, ChevronUp, ChevronDown, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import axios from 'axios';
import './FinancialGoals.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const FinancialGoals = () => {
  // Local state management instead of context
  const [financialGoals, setFinancialGoals] = useState([]);  // Initialize as empty array
  
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    currentAmount: 0,
    notes: '',
    category: 'Savings'
  });
  
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'amount', 'progress'
  const [sortDirection, setSortDirection] = useState('asc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGoals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/financial-goals`, {
        withCredentials: true
      });
      
      // Handle both response structures - direct array or {data: array}
      const goalsData = response.data.data || response.data || [];
      setFinancialGoals(Array.isArray(goalsData) ? goalsData : []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      setError('Failed to load financial goals. Please try again.');
      setFinancialGoals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewGoal(prev => ({
      ...prev,
      [name]: name === 'targetAmount' || name === 'currentAmount' ? parseFloat(value) || 0 : value
    }));
  };

  const calculateProgress = (current, target) => {
    if (!target || target === 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Format the data to match backend requirements
      const goalData = {
        ...newGoal,
        targetAmount: parseFloat(newGoal.targetAmount) || 0,
        currentAmount: parseFloat(newGoal.currentAmount) || 0,
        progress: calculateProgress(parseFloat(newGoal.currentAmount) || 0, parseFloat(newGoal.targetAmount) || 0)
      };
  
      // Validate data before sending
      if (!goalData.name || !goalData.targetAmount || !goalData.targetDate || !goalData.category) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }
  
      if (editingId) {
        await axios.put(
          `${API_URL}/financial-goals/${editingId}`,
          goalData,
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `${API_URL}/financial-goals`,
          goalData,
          { withCredentials: true }
        );
      }
      
      await fetchGoals();
      setNewGoal({
        name: '',
        targetAmount: '',
        targetDate: '',
        currentAmount: 0,
        notes: '',
        category: 'Savings'
      });
      setShowForm(false);
      setEditingId(null);
    } catch (error) {
      console.error('Error saving goal:', error);
      setError(error.response?.data?.message || 'Error saving goal. Please check all fields and try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const updateGoalAmount = async (id, amount) => {
    setLoading(true);
    setError(null);
    try {
      const goal = financialGoals.find(g => g.id === id || g._id === id);
      if (!goal) {
        setLoading(false);
        return;
      }
      
      const parsedAmount = parseFloat(amount) || 0;
      const updatedGoal = {
        ...goal,
        currentAmount: parsedAmount,
        progress: calculateProgress(parsedAmount, goal.targetAmount)
      };
      
      await axios.put(
        `${API_URL}/financial-goals/${id}`,
        updatedGoal,
        { withCredentials: true }
      );
      
      await fetchGoals();
    } catch (error) {
      console.error('Error updating goal amount:', error);
      setError('Failed to update goal amount. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteGoal = async (id) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      setLoading(true);
      setError(null);
      try {
        await axios.delete(
          `${API_URL}/financial-goals/${id}`,
          { withCredentials: true }
        );
        await fetchGoals(); // Refresh goals list
      } catch (error) {
        console.error('Error deleting goal:', error);
        setError('Failed to delete goal. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const editGoal = (goal) => {
    setNewGoal({
      name: goal.name,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate ? goal.targetDate.split('T')[0] : '',
      currentAmount: goal.currentAmount,
      notes: goal.notes || '',
      category: goal.category
    });
    setEditingId(goal.id || goal._id);
    setShowForm(true);
  };

  const calculateRemainingDays = (targetDate) => {
    const today = new Date();
    const target = new Date(targetDate);
    const timeDiff = target.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const getSortedGoals = () => {
    // Make sure financialGoals is an array before processing
    if (!Array.isArray(financialGoals)) {
      return [];
    }
    
    let filteredGoals = [...financialGoals];
    
    // Apply filtering
    if (filter !== 'all') {
      filteredGoals = filteredGoals.filter(goal => goal.category === filter);
    }
    
    // Apply sorting
    filteredGoals.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        comparison = new Date(a.targetDate) - new Date(b.targetDate);
      } else if (sortBy === 'amount') {
        comparison = a.targetAmount - b.targetAmount;
      } else if (sortBy === 'progress') {
        comparison = a.progress - b.progress;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return filteredGoals;
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const getGoalStatusClass = (goal) => {
    const daysRemaining = calculateRemainingDays(goal.targetDate);
    if (goal.progress >= 100) return 'completed';
    if (daysRemaining < 0) return 'overdue';
    if (daysRemaining < 30 && goal.progress < 80) return 'at-risk';
    return '';
  };

  return (
    <div className="financial-goals">
      <div className="goals-header">
        <h2>Financial Goals</h2>
        <button 
          className="add-goal-button"
          onClick={() => {
            setEditingId(null);
            setNewGoal({
              name: '',
              targetAmount: '',
              targetDate: '',
              currentAmount: 0,
              notes: '',
              category: 'Savings'
            });
            setShowForm(!showForm);
          }}
          disabled={loading}
        >
          {showForm ? 'Cancel' : <><Plus size={18} /> Add Goal</>}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="goals-form">
          <div className="form-group">
            <label>Goal Name</label>
            <input 
              type="text"
              name="name"
              placeholder="E.g., New Car, Emergency Fund"
              value={newGoal.name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Target Amount</label>
              <div className="input-with-icon">
                <DollarSign size={16} className="input-icon" />
                <input 
                  type="number"
                  name="targetAmount"
                  placeholder="5000"
                  value={newGoal.targetAmount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Current Amount</label>
              <div className="input-with-icon">
                <DollarSign size={16} className="input-icon" />
                <input 
                  type="number"
                  name="currentAmount"
                  placeholder="0"
                  value={newGoal.currentAmount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Target Date</label>
              <div className="input-with-icon">
                <Calendar size={16} className="input-icon" />
                <input 
                  type="date"
                  name="targetDate"
                  value={newGoal.targetDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Category</label>
              <select
                name="category"
                value={newGoal.category}
                onChange={handleInputChange}
              >
                <option value="Savings">Savings</option>
                <option value="Checking">Checking</option>
                <option value="Investment">Investment</option>
                <option value="Debt Payoff">Debt Payoff</option>
                <option value="Large Purchase">Large Purchase</option>
                <option value="Emergency Fund">Emergency Fund</option>
                <option value="Retirement">Retirement</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Notes (Optional)</label>
            <textarea
              name="notes"
              placeholder="Additional details about your goal"
              value={newGoal.notes}
              onChange={handleInputChange}
              rows="3"
            />
          </div>
          
          <button type="submit" className="submit-button">
            {editingId ? 'Update Goal' : 'Add Goal'}
          </button>
        </form>
      )}

      <div className="goals-controls">
        <div className="filter-controls">
          <label>Filter by:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="Savings">Savings</option>
            <option value="Checking">Checking</option>
            <option value="Investment">Investment</option>
            <option value="Debt Payoff">Debt Payoff</option>
            <option value="Large Purchase">Large Purchase</option>
            <option value="Emergency Fund">Emergency Fund</option>
            <option value="Retirement">Retirement</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div className="sort-controls">
          <label>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Target Date</option>
            <option value="amount">Target Amount</option>
            <option value="progress">Progress</option>
          </select>
          <button 
            className="sort-direction-button"
            onClick={toggleSortDirection}
            aria-label={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
          >
            {sortDirection === 'asc' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      <div className="goals-summary">
        <div className="summary-item" key="total-goals">
          <span className="summary-label">Total Goals:</span>
          <span className="summary-value">{Array.isArray(financialGoals) ? financialGoals.length : 0}</span>
        </div>
        
        <div className="summary-item" key="total-amount">
          <span className="summary-label">Total Amount:</span>
          <span className="summary-value">
            ${Array.isArray(financialGoals) 
              ? financialGoals.reduce((sum, goal) => sum + (goal.targetAmount || 0), 0).toFixed(2)
              : "0.00"}
          </span>
        </div>
        
        <div className="summary-item" key="total-saved">
          <span className="summary-label">Total Saved:</span>
          <span className="summary-value">
            ${Array.isArray(financialGoals)
              ? financialGoals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0).toFixed(2)
              : "0.00"}
          </span>
        </div>
      </div>

      <div className="goals-list">
        {getSortedGoals().length === 0 ? (
          <div className="no-goals-message">
            No goals found. Click "Add Goal" to create one!
          </div>
        ) : (
          getSortedGoals().map((goal) => (
            <div 
              key={goal.id || goal._id} 
              className={`goal-card ${getGoalStatusClass(goal)}`}
            >
              <div className="goal-header">
                <h3>{goal.name}</h3>
                <div className="goal-badge">{goal.category}</div>
              </div>
              
              <div className="goal-amount">
                <span className="current-amount">${goal.currentAmount.toFixed(2)}</span>
                <span className="target-amount"> / ${goal.targetAmount.toFixed(2)}</span>
              </div>
              
              <div className="goal-progress-container">
                <div 
                  className="goal-progress-bar" 
                  style={{ width: `${goal.progress || 0}%` }}
                ></div>
              </div>
              
              <div className="goal-progress-text">
                <span>{goal.progress || 0}% complete</span>
              </div>
              
              <div className="goal-details">
                <div className="goal-timeline">
                  <Calendar size={16} />
                  <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                  <span className="days-remaining">
                    {calculateRemainingDays(goal.targetDate)} days remaining
                  </span>
                </div>
                
                {goal.notes && (
                  <div className="goal-notes">
                    <p>{goal.notes}</p>
                  </div>
                )}
                
                <div className="amount-update">
                  <label>Current Amount:</label>
                  <div className="amount-input-wrapper">
                    <input 
                      type="number"
                      value={goal.currentAmount}
                      onChange={(e) => updateGoalAmount(goal.id || goal._id, e.target.value)}
                      step="0.01"
                      min="0"
                      max={goal.targetAmount}
                    />
                    <TrendingUp size={16} className="input-icon" />
                  </div>
                </div>
              </div>
              
              <div className="goal-actions">
                <button 
                  className="edit-goal-button"
                  onClick={() => editGoal(goal)}
                  aria-label="Edit goal"
                >
                  <Edit size={18} />
                </button>
                <button 
                  className="delete-goal-button"
                  onClick={() => deleteGoal(goal.id || goal._id)}
                  aria-label="Delete goal"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FinancialGoals;