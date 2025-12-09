import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ATMLocator.css';

const ATMLocator = () => {
  const [searchType, setSearchType] = useState('nearby');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationType, setLocationType] = useState('all');
  const [radius, setRadius] = useState(25);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  // Available service filters
  const availableServices = [
    { value: 'atm', label: 'ATM' },
    { value: 'drive-thru-atm', label: 'Drive-Thru ATM' },
    { value: 'deposit-atm', label: 'Deposit ATM' },
    { value: 'full-service-branch', label: 'Full Service Branch' },
    { value: 'notary-service', label: 'Notary Service' },
    { value: 'safe-deposit-boxes', label: 'Safe Deposit Boxes' },
    { value: 'financial-advisors', label: 'Financial Advisors' },
    { value: '24-hour-access', label: '24 Hour Access' },
    { value: 'handicap-accessible', label: 'Handicap Accessible' }
  ];

  // Get user's current location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
    fetchStats();
    fetchFavorites();
  }, []);

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/atm-locator/stats`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Fetch user favorites
  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/atm-locator/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setFavorites(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    }
  };

  // Search by current location
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
        type: locationType !== 'all' ? locationType : undefined,
        services: services.length > 0 ? services.join(',') : undefined
      };

      const response = await axios.get(`${API_BASE_URL}/atm-locator/search/nearby`, { params });
      
      if (response.data.success) {
        setLocations(response.data.data);
        if (response.data.data.length === 0) {
          setError('No locations found within the specified radius');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search locations');
    } finally {
      setLoading(false);
    }
  };

  // Search by address
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
        type: locationType !== 'all' ? locationType : undefined,
        services: services.length > 0 ? services.join(',') : undefined
      };

      const response = await axios.get(`${API_BASE_URL}/atm-locator/search/address`, { params });
      
      if (response.data.success) {
        setLocations(response.data.data);
        if (response.data.data.length === 0) {
          setError('No locations found matching your search');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search locations');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchType === 'nearby') {
      searchNearby();
    } else {
      searchByAddress();
    }
  };

  // View location details
  const viewLocationDetails = async (locationId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${API_BASE_URL}/atm-locator/locations/${locationId}`, { headers });
      
      if (response.data.success) {
        setSelectedLocation(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch location details');
    } finally {
      setLoading(false);
    }
  };

  // Add to favorites
  const addToFavorites = async (locationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to add favorites');
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/atm-locator/favorites`,
        { locationId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        fetchFavorites();
        if (selectedLocation && selectedLocation._id === locationId) {
          setSelectedLocation({ ...selectedLocation, isFavorite: true });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add favorite');
    }
  };

  // Remove from favorites
  const removeFromFavorites = async (locationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.delete(
        `${API_BASE_URL}/atm-locator/favorites/${locationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        fetchFavorites();
        if (selectedLocation && selectedLocation._id === locationId) {
          setSelectedLocation({ ...selectedLocation, isFavorite: false });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove favorite');
    }
  };

  // Check if location is favorited
  const isFavorited = (locationId) => {
    return favorites.some(fav => fav.locationId._id === locationId);
  };

  // Get directions link
  const getDirectionsLink = (location) => {
    const address = `${location.address.street}, ${location.address.city}, ${location.address.state} ${location.address.zipCode}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  };

  // Format hours
  const formatHours = (hours, day) => {
    if (!hours || !hours[day] || !hours[day].open) {
      return 'Closed';
    }
    return `${hours[day].open} - ${hours[day].close}`;
  };

  // Get current day
  const getCurrentDay = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  };

  return (
    <div className="atm-locator-container">
      {/* Header */}
      <header className="atm-locator-header">
        <div className="header-content">
          <h1>ATM & Branch Locator</h1>
          <p>Find Navy Federal Credit Union locations near you</p>
        </div>

        {stats && (
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-value">{stats.totalLocations}</span>
              <span className="stat-label">Total Locations</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.atmCount}</span>
              <span className="stat-label">ATMs</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.branchCount}</span>
              <span className="stat-label">Branches</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.stateCount}</span>
              <span className="stat-label">States</span>
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

            <div className="search-controls">
              <div className="control-group">
                <label>Location Type</label>
                <select
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value)}
                  className="control-select"
                >
                  <option value="all">All Locations</option>
                  <option value="atm">ATMs Only</option>
                  <option value="branch">Branches Only</option>
                  <option value="both">ATM & Branch</option>
                </select>
              </div>

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
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {showFilters && (
              <div className="filters-panel">
                <h3>Service Filters</h3>
                <div className="service-filters">
                  {availableServices.map((service) => (
                    <label key={service.value} className="service-checkbox">
                      <input
                        type="checkbox"
                        checked={services.includes(service.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setServices([...services, service.value]);
                          } else {
                            setServices(services.filter(s => s !== service.value));
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
          {/* Location List */}
          <div className="location-list">
            {loading && locations.length === 0 ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Searching for locations...</p>
              </div>
            ) : locations.length > 0 ? (
              <>
                <div className="results-header">
                  <h2>{locations.length} Location{locations.length !== 1 ? 's' : ''} Found</h2>
                </div>
                {locations.map((location) => (
                  <div
                    key={location._id}
                    className={`location-card ${selectedLocation?._id === location._id ? 'selected' : ''}`}
                    onClick={() => viewLocationDetails(location._id)}
                  >
                    <div className="location-header">
                      <div className="location-title">
                        <h3>{location.name}</h3>
                        <span className={`location-type-badge ${location.locationType}`}>
                          {location.locationType === 'both' ? 'ATM & Branch' : location.locationType.toUpperCase()}
                        </span>
                      </div>
                      <button
                        className={`favorite-btn ${isFavorited(location._id) ? 'favorited' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isFavorited(location._id)) {
                            removeFromFavorites(location._id);
                          } else {
                            addToFavorites(location._id);
                          }
                        }}
                      >
                        {isFavorited(location._id) ? '★' : '☆'}
                      </button>
                    </div>

                    <div className="location-details">
                      <p className="location-address">
                        <span className="icon">📍</span>
                        {location.address.street}, {location.address.city}, {location.address.state} {location.address.zipCode}
                      </p>

                      {location.distance && (
                        <p className="location-distance">
                          <span className="icon">🗺️</span> {location.distance} miles away
                        </p>
                      )}

                      {location.phone && (
                        <p className="location-phone">
                          <span className="icon">📞</span> {location.phone}
                        </p>
                      )}

                      {location.ratings && location.ratings.count > 0 && (
                        <div className="location-rating">
                          <span className="rating-stars">{'★'.repeat(Math.round(location.ratings.average))}</span>
                          <span className="rating-text">{location.ratings.average.toFixed(1)} ({location.ratings.count} reviews)</span>
                        </div>
                      )}
                    </div>

                    <div className="location-actions">
                      <a
                        href={getDirectionsLink(location)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-btn directions-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Get Directions
                      </a>
                      <button className="action-btn details-btn">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="empty-state">
                <span className="icon">🔍</span>
                <h3>No locations found</h3>
                <p>Try adjusting your search criteria or increasing the search radius</p>
              </div>
            )}
          </div>

          {/* Location Details Panel */}
          {selectedLocation && (
            <div className="location-details-panel">
              <div className="details-header">
                <button
                  className="close-btn"
                  onClick={() => setSelectedLocation(null)}
                >
                  ✕
                </button>
                <h2>{selectedLocation.name}</h2>
                <span className={`location-type-badge ${selectedLocation.locationType}`}>
                  {selectedLocation.locationType === 'both' ? 'ATM & Branch' : selectedLocation.locationType.toUpperCase()}
                </span>
              </div>

              <div className="details-content">
                <section className="details-section">
                  <h3>Address</h3>
                  <p>{selectedLocation.address.street}</p>
                  <p>{selectedLocation.address.city}, {selectedLocation.address.state} {selectedLocation.address.zipCode}</p>
                  {selectedLocation.phone && <p className="phone-number">📞 {selectedLocation.phone}</p>}
                </section>

                {selectedLocation.hours && (
                  <section className="details-section">
                    <h3>Hours of Operation</h3>
                    <div className="hours-list">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                        <div key={day} className={`hours-row ${day === getCurrentDay() ? 'current-day' : ''}`}>
                          <span className="day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                          <span className="day-hours">{formatHours(selectedLocation.hours, day)}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {selectedLocation.services && selectedLocation.services.length > 0 && (
                  <section className="details-section">
                    <h3>Services Available</h3>
                    <div className="services-grid">
                      {selectedLocation.services.map((service) => (
                        <span key={service} className="service-tag">
                          {service.replace(/-/g, ' ').toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {selectedLocation.atmDetails && (
                  <section className="details-section">
                    <h3>ATM Features</h3>
                    <div className="features-list">
                      {selectedLocation.atmDetails.cashWithdrawal && <span className="feature-item">✓ Cash Withdrawal</span>}
                      {selectedLocation.atmDetails.depositEnabled && <span className="feature-item">✓ Deposits</span>}
                      {selectedLocation.atmDetails.checkDeposit && <span className="feature-item">✓ Check Deposit</span>}
                      {selectedLocation.atmDetails.driveThru && <span className="feature-item">✓ Drive-Thru</span>}
                      {selectedLocation.atmDetails.surchargeFreeCoop && <span className="feature-item">✓ Surcharge Free</span>}
                    </div>
                  </section>
                )}

                {selectedLocation.accessibility && (
                  <section className="details-section">
                    <h3>Accessibility</h3>
                    <div className="features-list">
                      {selectedLocation.accessibility.wheelchairAccessible && <span className="feature-item">✓ Wheelchair Accessible</span>}
                      {selectedLocation.accessibility.parkingAvailable && <span className="feature-item">✓ Parking Available</span>}
                      {selectedLocation.accessibility.publicTransportNearby && <span className="feature-item">✓ Public Transport Nearby</span>}
                    </div>
                  </section>
                )}

                {selectedLocation.militaryBase && selectedLocation.militaryBase.onBase && (
                  <section className="details-section military-section">
                    <h3>Military Base Location</h3>
                    <p><strong>Base:</strong> {selectedLocation.militaryBase.baseName}</p>
                    <p><strong>Access:</strong> {selectedLocation.militaryBase.accessRequirements}</p>
                  </section>
                )}

                <section className="details-actions">
                  <a
                    href={getDirectionsLink(selectedLocation)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-btn primary-btn"
                  >
                    Get Directions
                  </a>
                  {selectedLocation.isFavorite ? (
                    <button
                      className="action-btn secondary-btn"
                      onClick={() => removeFromFavorites(selectedLocation._id)}
                    >
                      Remove from Favorites
                    </button>
                  ) : (
                    <button
                      className="action-btn secondary-btn"
                      onClick={() => addToFavorites(selectedLocation._id)}
                    >
                      Add to Favorites
                    </button>
                  )}
                </section>

                {selectedLocation.reviews && selectedLocation.reviews.length > 0 && (
                  <section className="details-section reviews-section">
                    <h3>Recent Reviews</h3>
                    <div className="reviews-list">
                      {selectedLocation.reviews.map((review) => (
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
    </div>
  );
};

export default ATMLocator;