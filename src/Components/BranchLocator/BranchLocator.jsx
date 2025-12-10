import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BranchLocator.css';

const BranchLocator = () => {
  const [searchType, setSearchType] = useState('nearby');
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState(25);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [stats, setStats] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    appointmentDate: '',
    appointmentTime: '',
    serviceType: '',
    notes: ''
  });
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://credit-unionapi.onrender.com';

  // Branch-specific services
  const branchServices = [
    { value: 'full-service-branch', label: 'Full Service Branch' },
    { value: 'financial-advisors', label: 'Financial Advisors' },
    { value: 'notary-service', label: 'Notary Service' },
    { value: 'safe-deposit-boxes', label: 'Safe Deposit Boxes' },
    { value: 'coin-machine', label: 'Coin Machine' },
    { value: 'drive-thru-atm', label: 'Drive-Thru ATM' },
    { value: 'handicap-accessible', label: 'Handicap Accessible' },
    { value: 'video-teller', label: 'Video Teller' }
  ];

  const appointmentServices = [
    'Account Opening',
    'Loan Consultation',
    'Financial Planning',
    'Mortgage Consultation',
    'Investment Advice',
    'Notary Service',
    'Safe Deposit Box Access',
    'General Banking'
  ];

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => console.error('Error getting location:', error)
      );
    }
    fetchStats();
    fetchStates();
  }, []);

  // Fetch states when user selects browse by state
  useEffect(() => {
    if (searchType === 'state') {
      fetchStates();
    }
  }, [searchType]);

  // Fetch cities when state is selected
  useEffect(() => {
    if (selectedState) {
      fetchCitiesByState(selectedState);
    }
  }, [selectedState]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/branch-locator/stats`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchStates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/branch-locator/states`);
      if (response.data.success) {
        setStates(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching states:', err);
    }
  };

  const fetchCitiesByState = async (state) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/branch-locator/states/${state}/cities`);
      if (response.data.success) {
        setCities(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching cities:', err);
    }
  };

  const searchNearby = async () => {
    if (!userLocation) {
      setError('Location access is required for nearby search');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radius,
        services: selectedServices.length > 0 ? selectedServices.join(',') : undefined
      };

      const response = await axios.get(`${API_BASE_URL}/branch-locator/search/nearby`, { params });
      
      if (response.data.success) {
        setBranches(response.data.data);
        if (response.data.data.length === 0) {
          setError('No branches found within the specified radius');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search branches');
    } finally {
      setLoading(false);
    }
  };

  const searchByAddress = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        query: searchQuery,
        services: selectedServices.length > 0 ? selectedServices.join(',') : undefined
      };

      const response = await axios.get(`${API_BASE_URL}/branch-locator/search/address`, { params });
      
      if (response.data.success) {
        setBranches(response.data.data);
        if (response.data.data.length === 0) {
          setError('No branches found matching your search');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search branches');
    } finally {
      setLoading(false);
    }
  };

  const searchByState = async () => {
    if (!selectedState) {
      setError('Please select a state');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let url;
      if (selectedCity) {
        url = `${API_BASE_URL}/branch-locator/states/${selectedState}/cities/${selectedCity}/branches`;
      } else {
        url = `${API_BASE_URL}/branch-locator/states/${selectedState}/branches`;
      }

      const response = await axios.get(url);
      
      if (response.data.success) {
        setBranches(response.data.data);
        if (response.data.data.length === 0) {
          setError('No branches found in this location');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search branches');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchType === 'nearby') {
      searchNearby();
    } else if (searchType === 'state') {
      searchByState();
    } else {
      searchByAddress();
    }
  };

  const viewBranchDetails = async (branchId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${API_BASE_URL}/branch-locator/branches/${branchId}`, { headers });
      
      if (response.data.success) {
        setSelectedBranch(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch branch details');
    } finally {
      setLoading(false);
    }
  };

  const openAppointmentModal = (branch) => {
    setSelectedBranch(branch);
    setShowAppointmentModal(true);
  };

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to schedule an appointment');
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/branch-locator/appointments`,
        {
          branchId: selectedBranch._id,
          ...appointmentData
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('Appointment scheduled successfully!');
        setShowAppointmentModal(false);
        setAppointmentData({
          appointmentDate: '',
          appointmentTime: '',
          serviceType: '',
          notes: ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule appointment');
    }
  };

  const getDirectionsLink = (branch) => {
    const address = `${branch.address.street}, ${branch.address.city}, ${branch.address.state} ${branch.address.zipCode}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  };

  const formatHours = (hours, day) => {
    if (!hours || !hours[day] || !hours[day].open) {
      return 'Closed';
    }
    return `${hours[day].open} - ${hours[day].close}`;
  };

  const getCurrentDay = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  };

  const getTodaysHours = (branch) => {
    const today = getCurrentDay();
    return formatHours(branch.hours, today);
  };

  return (
    <div className="branch-locator-container">
      {/* Header */}
      <header className="branch-locator-header">
        <div className="header-content">
          <h1>Branch Locator</h1>
          <p>Find Navy Federal Credit Union branches near you</p>
        </div>

        {stats && (
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-value">{stats.totalBranches}</span>
              <span className="stat-label">Total Branches</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.stateCount}</span>
              <span className="stat-label">States</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.branchesWithFinancialAdvisors}</span>
              <span className="stat-label">Financial Advisors</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.militaryBaseBranches}</span>
              <span className="stat-label">Military Base</span>
            </div>
          </div>
        )}
      </header>

      {/* Search Section */}
      <section className="search-section">
        <div className="search-container">
          <div className="search-type-tabs">
            <button
              className={`tab-button ${searchType === 'nearby' ? 'active' : ''}`}
              onClick={() => setSearchType('nearby')}
            >
              <span className="icon">📍</span> Search Nearby
            </button>
            <button
              className={`tab-button ${searchType === 'address' ? 'active' : ''}`}
              onClick={() => setSearchType('address')}
            >
              <span className="icon">🔍</span> Search by Address
            </button>
            <button
              className={`tab-button ${searchType === 'state' ? 'active' : ''}`}
              onClick={() => setSearchType('state')}
            >
              <span className="icon">🗺️</span> Browse by State
            </button>
          </div>

          <form onSubmit={handleSearch} className="search-form">
            {searchType === 'address' && (
              <div className="search-input-group">
                <input
                  type="text"
                  placeholder="Enter city, state, or ZIP code"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            )}

            {searchType === 'state' && (
              <div className="state-city-selectors">
                <div className="control-group">
                  <label>Select State</label>
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value);
                      setSelectedCity('');
                    }}
                    className="control-select"
                  >
                    <option value="">Choose a state...</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                {selectedState && cities.length > 0 && (
                  <div className="control-group">
                    <label>Select City (Optional)</label>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="control-select"
                    >
                      <option value="">All cities</option>
                      {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="search-controls">
              {searchType === 'nearby' && (
                <div className="control-group">
                  <label>Search Radius</label>
                  <select
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="control-select"
                  >
                    <option value="5">5 miles</option>
                    <option value="10">10 miles</option>
                    <option value="25">25 miles</option>
                    <option value="50">50 miles</option>
                    <option value="100">100 miles</option>
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="filter-toggle-btn"
              >
                <span className="icon">⚙️</span> {showFilters ? 'Hide' : 'Show'} Filters
              </button>

              <button type="submit" className="search-btn" disabled={loading}>
                {loading ? 'Searching...' : 'Search Branches'}
              </button>
            </div>

            {showFilters && (
              <div className="filters-panel">
                <h3>Service Filters</h3>
                <div className="service-filters">
                  {branchServices.map((service) => (
                    <label key={service.value} className="service-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedServices([...selectedServices, service.value]);
                          } else {
                            setSelectedServices(selectedServices.filter(s => s !== service.value));
                          }
                        }}
                      />
                      <span>{service.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </form>

          {error && (
            <div className="error-message">
              <span className="icon">⚠️</span> {error}
            </div>
          )}
        </div>
      </section>

      {/* Results Section */}
      <section className="results-section">
        <div className="results-container">
          {/* Branch List */}
          <div className="branch-list">
            {loading && branches.length === 0 ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Searching for branches...</p>
              </div>
            ) : branches.length > 0 ? (
              <>
                <div className="results-header">
                  <h2>{branches.length} Branch{branches.length !== 1 ? 'es' : ''} Found</h2>
                </div>
                {branches.map((branch) => (
                  <div
                    key={branch._id}
                    className={`branch-card ${selectedBranch?._id === branch._id ? 'selected' : ''}`}
                  >
                    <div className="branch-header">
                      <div className="branch-title">
                        <h3>{branch.name}</h3>
                        {branch.militaryBase?.onBase && (
                          <span className="military-badge">🎖️ Military Base</span>
                        )}
                      </div>
                    </div>

                    <div className="branch-details">
                      <p className="branch-address">
                        <span className="icon">📍</span>
                        {branch.address.street}, {branch.address.city}, {branch.address.state} {branch.address.zipCode}
                      </p>

                      {branch.distance && (
                        <p className="branch-distance">
                          <span className="icon">🗺️</span> {branch.distance} miles away
                        </p>
                      )}

                      {branch.phone && (
                        <p className="branch-phone">
                          <span className="icon">📞</span> {branch.phone}
                        </p>
                      )}

                      <p className="branch-hours">
                        <span className="icon">🕐</span> Today: {getTodaysHours(branch)}
                      </p>

                      {branch.ratings && branch.ratings.count > 0 && (
                        <div className="branch-rating">
                          <span className="rating-stars">{'★'.repeat(Math.round(branch.ratings.average))}</span>
                          <span className="rating-text">{branch.ratings.average.toFixed(1)} ({branch.ratings.count} reviews)</span>
                        </div>
                      )}

                      {branch.branchDetails?.specialServices && branch.branchDetails.specialServices.length > 0 && (
                        <div className="special-services">
                          <span className="icon">✨</span>
                          <span>{branch.branchDetails.specialServices.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    <div className="branch-actions">
                      <a
                        href={getDirectionsLink(branch)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-btn directions-btn"
                      >
                        Get Directions
                      </a>
                      <button
                        className="action-btn details-btn"
                        onClick={() => viewBranchDetails(branch._id)}
                      >
                        View Details
                      </button>
                      <button
                        className="action-btn appointment-btn"
                        onClick={() => openAppointmentModal(branch)}
                      >
                        Schedule Appointment
                      </button>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="empty-state">
                <span className="icon">🏦</span>
                <h3>No branches found</h3>
                <p>Try adjusting your search criteria or increasing the search radius</p>
              </div>
            )}
          </div>

          {/* Branch Details Panel */}
          {selectedBranch && !showAppointmentModal && (
            <div className="branch-details-panel">
              <div className="details-header">
                <button
                  className="close-btn"
                  onClick={() => setSelectedBranch(null)}
                >
                  ✕
                </button>
                <h2>{selectedBranch.name}</h2>
                {selectedBranch.militaryBase?.onBase && (
                  <span className="military-badge large">🎖️ Military Base Location</span>
                )}
              </div>

              <div className="details-content">
                <section className="details-section">
                  <h3>Address & Contact</h3>
                  <p>{selectedBranch.address.street}</p>
                  <p>{selectedBranch.address.city}, {selectedBranch.address.state} {selectedBranch.address.zipCode}</p>
                  {selectedBranch.phone && <p className="phone-number">📞 {selectedBranch.phone}</p>}
                </section>

                {selectedBranch.hours && (
                  <section className="details-section">
                    <h3>Hours of Operation</h3>
                    <div className="hours-list">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                        <div key={day} className={`hours-row ${day === getCurrentDay() ? 'current-day' : ''}`}>
                          <span className="day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                          <span className="day-hours">{formatHours(selectedBranch.hours, day)}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {selectedBranch.branchDetails && (
                  <section className="details-section">
                    <h3>Branch Information</h3>
                    {selectedBranch.branchDetails.manager && (
                      <p><strong>Branch Manager:</strong> {selectedBranch.branchDetails.manager}</p>
                    )}
                    {selectedBranch.branchDetails.languagesSpoken && selectedBranch.branchDetails.languagesSpoken.length > 0 && (
                      <p><strong>Languages:</strong> {selectedBranch.branchDetails.languagesSpoken.join(', ')}</p>
                    )}
                    {selectedBranch.branchDetails.appointmentRequired && (
                      <p className="appointment-required">⚠️ Appointment Required</p>
                    )}
                  </section>
                )}

                {selectedBranch.branchDetails?.specialServices && selectedBranch.branchDetails.specialServices.length > 0 && (
                  <section className="details-section">
                    <h3>Special Services</h3>
                    <div className="services-grid">
                      {selectedBranch.branchDetails.specialServices.map((service, index) => (
                        <span key={index} className="service-tag">{service}</span>
                      ))}
                    </div>
                  </section>
                )}

                {selectedBranch.services && selectedBranch.services.length > 0 && (
                  <section className="details-section">
                    <h3>Available Services</h3>
                    <div className="services-grid">
                      {selectedBranch.services.map((service) => (
                        <span key={service} className="service-tag">
                          {service.replace(/-/g, ' ').toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {selectedBranch.accessibility && (
                  <section className="details-section">
                    <h3>Accessibility</h3>
                    <div className="features-list">
                      {selectedBranch.accessibility.wheelchairAccessible && <span className="feature-item">✓ Wheelchair Accessible</span>}
                      {selectedBranch.accessibility.parkingAvailable && <span className="feature-item">✓ Parking Available</span>}
                      {selectedBranch.accessibility.publicTransportNearby && <span className="feature-item">✓ Public Transport Nearby</span>}
                    </div>
                  </section>
                )}

                {selectedBranch.amenities && selectedBranch.amenities.length > 0 && (
                  <section className="details-section">
                    <h3>Amenities</h3>
                    <div className="amenities-grid">
                      {selectedBranch.amenities.map((amenity) => (
                        <span key={amenity} className="amenity-tag">
                          {amenity.replace(/-/g, ' ').toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {selectedBranch.militaryBase && selectedBranch.militaryBase.onBase && (
                  <section className="details-section military-section">
                    <h3>Military Base Access</h3>
                    <p><strong>Base:</strong> {selectedBranch.militaryBase.baseName}</p>
                    <p><strong>Access Requirements:</strong> {selectedBranch.militaryBase.accessRequirements}</p>
                  </section>
                )}

                <section className="details-actions">
                  <a
                    href={getDirectionsLink(selectedBranch)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-btn primary-btn"
                  >
                    Get Directions
                  </a>
                  <button
                    className="action-btn secondary-btn"
                    onClick={() => openAppointmentModal(selectedBranch)}
                  >
                    Schedule Appointment
                  </button>
                </section>

                {selectedBranch.reviews && selectedBranch.reviews.length > 0 && (
                  <section className="details-section reviews-section">
                    <h3>Recent Reviews</h3>
                    <div className="reviews-list">
                      {selectedBranch.reviews.map((review) => (
                        <div key={review._id} className="review-card">
                          <div className="review-header">
                            <span className="review-author">
                              {review.userId?.firstName} {review.userId?.lastName}
                            </span>
                            <span className="review-rating">{'★'.repeat(review.rating)}</span>
                          </div>
                          {review.comment && <p className="review-comment">{review.comment}</p>}
                          <span className="review-date">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Appointment Modal */}
      {showAppointmentModal && selectedBranch && (
        <div className="modal-overlay" onClick={() => setShowAppointmentModal(false)}>
          <div className="appointment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Schedule Appointment</h2>
              <button className="close-btn" onClick={() => setShowAppointmentModal(false)}>✕</button>
            </div>

            <div className="modal-content">
              <div className="branch-info-summary">
                <h3>{selectedBranch.name}</h3>
                <p>{selectedBranch.address.city}, {selectedBranch.address.state}</p>
              </div>

              <form onSubmit={handleAppointmentSubmit} className="appointment-form">
                <div className="form-group">
                  <label>Appointment Date *</label>
                  <input
                    type="date"
                    value={appointmentData.appointmentDate}
                    onChange={(e) => setAppointmentData({...appointmentData, appointmentDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Appointment Time *</label>
                  <select
                    value={appointmentData.appointmentTime}
                    onChange={(e) => setAppointmentData({...appointmentData, appointmentTime: e.target.value})}
                    required
                    className="form-select"
                  >
                    <option value="">Select a time...</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Service Type *</label>
                  <select
                    value={appointmentData.serviceType}
                    onChange={(e) => setAppointmentData({...appointmentData, serviceType: e.target.value})}
                    required
                    className="form-select"
                  >
                    <option value="">Select a service...</option>
                    {appointmentServices.map(service => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Additional Notes</label>
                  <textarea
                    value={appointmentData.notes}
                    onChange={(e) => setAppointmentData({...appointmentData, notes: e.target.value})}
                    placeholder="Any specific requests or information..."
                    rows="4"
                    className="form-textarea"
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowAppointmentModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    Schedule Appointment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchLocator;