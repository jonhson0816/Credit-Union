import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CareerPage.css';

const CareerPage = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    departments: [],
    locations: [],
    employmentTypes: [],
    experienceLevels: []
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Filter states
  const [filters, setFilters] = useState({
    department: '',
    location: '',
    employmentType: '',
    experienceLevel: '',
    search: ''
  });

  // Application form state
  const [applicationData, setApplicationData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    resumeUrl: '',
    coverLetter: '',
    yearsOfExperience: 0,
    education: {
      degree: '',
      institution: '',
      graduationYear: new Date().getFullYear()
    },
    skills: '',
    veteranStatus: 'Prefer not to say'
  });

  // Fetch jobs and filter options on mount
  useEffect(() => {
    fetchJobs();
    fetchFilterOptions();
  }, []);

  // Apply filters when filter state changes
  useEffect(() => {
    applyFilters();
  }, [filters, jobs]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://credit-unionapi.onrender.com/api/careers/jobs');
      setJobs(response.data.data);
      setFilteredJobs(response.data.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setMessage({ type: 'error', text: 'Failed to load job listings' });
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await axios.get('https://credit-unionapi.onrender.com/api/careers/filter-options');
      setFilterOptions(response.data.data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    if (filters.department) {
      filtered = filtered.filter(job => job.department === filters.department);
    }
    if (filters.location) {
      filtered = filtered.filter(job => 
        job.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    if (filters.employmentType) {
      filtered = filtered.filter(job => job.employmentType === filters.employmentType);
    }
    if (filters.experienceLevel) {
      filtered = filtered.filter(job => job.experienceLevel === filters.experienceLevel);
    }
    if (filters.search) {
      filtered = filtered.filter(job =>
        job.jobTitle.toLowerCase().includes(filters.search.toLowerCase()) ||
        job.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      department: '',
      location: '',
      employmentType: '',
      experienceLevel: '',
      search: ''
    });
  };

  const handleJobClick = (job) => {
    setSelectedJob(job);
    setShowApplicationForm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplyClick = () => {
    setShowApplicationForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplicationChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setApplicationData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setApplicationData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // In production, upload to cloud storage (AWS S3, Cloudinary, etc.)
    // For now, we'll use a placeholder URL
    const placeholderUrl = `https://placeholder.com/resumes/${file.name}`;
    setApplicationData(prev => ({ ...prev, resumeUrl: placeholderUrl }));
    setMessage({ type: 'success', text: 'Resume uploaded successfully!' });
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const skillsArray = applicationData.skills.split(',').map(s => s.trim()).filter(s => s);
      
      const submitData = {
        ...applicationData,
        skills: skillsArray,
        yearsOfExperience: Number(applicationData.yearsOfExperience),
        education: {
          ...applicationData.education,
          graduationYear: Number(applicationData.education.graduationYear)
        }
      };

      await axios.post(
        `https://credit-unionapi.onrender.com/api/careers/jobs/${selectedJob._id}/apply`,
        submitData
        );

      setMessage({ 
        type: 'success', 
        text: 'Application submitted successfully! We will review your application and contact you soon.' 
      });
      
      // Reset form
      setTimeout(() => {
        setShowApplicationForm(false);
        setSelectedJob(null);
        setApplicationData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: { street: '', city: '', state: '', zipCode: '' },
          resumeUrl: '',
          coverLetter: '',
          yearsOfExperience: 0,
          education: { degree: '', institution: '', graduationYear: new Date().getFullYear() },
          skills: '',
          veteranStatus: 'Prefer not to say'
        });
      }, 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to submit application. Please try again.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatSalary = (min, max) => {
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="career-page">
      {/* Hero Section */}
      <section className="career-hero">
        <div className="hero-content">
          <h1>Join Our Mission-Driven Team</h1>
          <p>At Navy Federal Credit Union, we serve those who serve our country. Build your career with purpose.</p>
          <div className="hero-stats">
            <div className="stat">
              <h3>{filteredJobs.length}+</h3>
              <p>Open Positions</p>
            </div>
            <div className="stat">
              <h3>12M+</h3>
              <p>Members Served</p>
            </div>
            <div className="stat">
              <h3>Top 10</h3>
              <p>Best Place to Work</p>
            </div>
          </div>
        </div>
      </section>

      {/* Message Display */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="career-container">
        {/* Job Detail or Application Form View */}
        {(selectedJob && !showApplicationForm) && (
          <section className="job-detail">
            <button className="back-button" onClick={() => setSelectedJob(null)}>
              ← Back to All Jobs
            </button>
            
            <div className="job-detail-header">
              <div>
                <h2>{selectedJob.jobTitle}</h2>
                <div className="job-meta">
                  <span className="badge">{selectedJob.department}</span>
                  <span className="badge">{selectedJob.location}</span>
                  <span className="badge">{selectedJob.employmentType}</span>
                  <span className="badge">{selectedJob.experienceLevel}</span>
                </div>
              </div>
              <button className="apply-button" onClick={handleApplyClick}>
                Apply Now
              </button>
            </div>

            <div className="job-detail-content">
              <div className="detail-section">
                <h3>Salary Range</h3>
                <p className="salary">{formatSalary(selectedJob.salary.min, selectedJob.salary.max)}</p>
              </div>

              <div className="detail-section">
                <h3>Job Description</h3>
                <p>{selectedJob.description}</p>
              </div>

              <div className="detail-section">
                <h3>Responsibilities</h3>
                <ul>
                  {selectedJob.responsibilities.map((resp, index) => (
                    <li key={index}>{resp}</li>
                  ))}
                </ul>
              </div>

              <div className="detail-section">
                <h3>Qualifications</h3>
                <ul>
                  {selectedJob.qualifications.map((qual, index) => (
                    <li key={index}>{qual}</li>
                  ))}
                </ul>
              </div>

              {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                <div className="detail-section">
                  <h3>Benefits</h3>
                  <ul>
                    {selectedJob.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="detail-section">
                <p className="posted-date">Posted: {formatDate(selectedJob.postedDate)}</p>
                <p className="deadline">Application Deadline: {formatDate(selectedJob.applicationDeadline)}</p>
              </div>

              <button className="apply-button-bottom" onClick={handleApplyClick}>
                Apply for this Position
              </button>
            </div>
          </section>
        )}

        {/* Application Form */}
        {showApplicationForm && selectedJob && (
          <section className="application-form-section">
            <button className="back-button" onClick={() => setShowApplicationForm(false)}>
              ← Back to Job Details
            </button>

            <h2>Apply for {selectedJob.jobTitle}</h2>
            <p className="form-subtitle">Please fill out all required fields to submit your application.</p>

            <form onSubmit={handleSubmitApplication} className="application-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={applicationData.firstName}
                    onChange={handleApplicationChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={applicationData.lastName}
                    onChange={handleApplicationChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={applicationData.email}
                    onChange={handleApplicationChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={applicationData.phone}
                    onChange={handleApplicationChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Street Address</label>
                <input
                  type="text"
                  name="address.street"
                  value={applicationData.address.street}
                  onChange={handleApplicationChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="address.city"
                    value={applicationData.address.city}
                    onChange={handleApplicationChange}
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="address.state"
                    value={applicationData.address.state}
                    onChange={handleApplicationChange}
                  />
                </div>
                <div className="form-group">
                  <label>Zip Code</label>
                  <input
                    type="text"
                    name="address.zipCode"
                    value={applicationData.address.zipCode}
                    onChange={handleApplicationChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Years of Experience *</label>
                <input
                  type="number"
                  name="yearsOfExperience"
                  value={applicationData.yearsOfExperience}
                  onChange={handleApplicationChange}
                  min="0"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Degree *</label>
                  <input
                    type="text"
                    name="education.degree"
                    value={applicationData.education.degree}
                    onChange={handleApplicationChange}
                    placeholder="e.g., Bachelor's in Computer Science"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Institution *</label>
                  <input
                    type="text"
                    name="education.institution"
                    value={applicationData.education.institution}
                    onChange={handleApplicationChange}
                    placeholder="e.g., University Name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Graduation Year *</label>
                  <input
                    type="number"
                    name="education.graduationYear"
                    value={applicationData.education.graduationYear}
                    onChange={handleApplicationChange}
                    min="1950"
                    max={new Date().getFullYear() + 10}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Skills (comma-separated)</label>
                <input
                  type="text"
                  name="skills"
                  value={applicationData.skills}
                  onChange={handleApplicationChange}
                  placeholder="e.g., JavaScript, React, Node.js, MongoDB"
                />
              </div>

              <div className="form-group">
                <label>Upload Resume *</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  required={!applicationData.resumeUrl}
                />
                {applicationData.resumeUrl && (
                  <p className="file-uploaded">✓ Resume uploaded</p>
                )}
              </div>

              <div className="form-group">
                <label>Cover Letter (Optional)</label>
                <textarea
                  name="coverLetter"
                  value={applicationData.coverLetter}
                  onChange={handleApplicationChange}
                  rows="6"
                  maxLength="2000"
                  placeholder="Tell us why you're interested in this position..."
                ></textarea>
                <small>{applicationData.coverLetter.length}/2000 characters</small>
              </div>

              <div className="form-group">
                <label>Veteran Status</label>
                <select
                  name="veteranStatus"
                  value={applicationData.veteranStatus}
                  onChange={handleApplicationChange}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowApplicationForm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Job Listings View */}
        {!selectedJob && (
          <>
            {/* Search and Filters */}
            <section className="filters-section">
              <h2>Find Your Perfect Role</h2>
              
              <div className="search-bar">
                <input
                  type="text"
                  name="search"
                  placeholder="Search by job title or keyword..."
                  value={filters.search}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="filters">
                <select name="department" value={filters.department} onChange={handleFilterChange}>
                  <option value="">All Departments</option>
                  {filterOptions.departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                <select name="location" value={filters.location} onChange={handleFilterChange}>
                  <option value="">All Locations</option>
                  {filterOptions.locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>

                <select name="employmentType" value={filters.employmentType} onChange={handleFilterChange}>
                  <option value="">All Employment Types</option>
                  {filterOptions.employmentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                <select name="experienceLevel" value={filters.experienceLevel} onChange={handleFilterChange}>
                  <option value="">All Experience Levels</option>
                  {filterOptions.experienceLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>

                <button className="clear-filters" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>

              <p className="results-count">{filteredJobs.length} positions found</p>
            </section>

            {/* Job Listings */}
            <section className="jobs-section">
              {loading ? (
                <div className="loading">Loading opportunities...</div>
              ) : filteredJobs.length === 0 ? (
                <div className="no-jobs">
                  <h3>No positions found</h3>
                  <p>Try adjusting your filters or check back later for new opportunities.</p>
                </div>
              ) : (
                <div className="jobs-grid">
                  {filteredJobs.map(job => (
                    <div key={job._id} className="job-card" onClick={() => handleJobClick(job)}>
                      <h3>{job.jobTitle}</h3>
                      <p className="job-department">{job.department}</p>
                      <div className="job-info">
                        <span>📍 {job.location}</span>
                        <span>💼 {job.employmentType}</span>
                        <span>📊 {job.experienceLevel}</span>
                      </div>
                      <p className="job-salary">{formatSalary(job.salary.min, job.salary.max)}</p>
                      <p className="job-description">
                        {job.description.substring(0, 150)}...
                      </p>
                      <button className="view-details">View Details →</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Why Join Us Section */}
      {!selectedJob && !showApplicationForm && (
        <section className="why-join">
          <h2>Why Join Navy Federal?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">💰</div>
              <h3>Competitive Compensation</h3>
              <p>Industry-leading salaries and comprehensive benefits packages</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">📈</div>
              <h3>Career Growth</h3>
              <p>Professional development programs and clear advancement paths</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🏥</div>
              <h3>Health & Wellness</h3>
              <p>Premium healthcare, dental, vision, and wellness programs</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🎯</div>
              <h3>Mission-Driven</h3>
              <p>Serve those who serve our country with purpose and pride</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">⚖️</div>
              <h3>Work-Life Balance</h3>
              <p>Flexible schedules, remote options, and generous PTO</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🤝</div>
              <h3>Inclusive Culture</h3>
              <p>Diverse, supportive environment where everyone belongs</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default CareerPage;