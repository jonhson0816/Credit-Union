import React, { useState, useRef, useEffect } from 'react';
import './ProfilePage.css';
import { useNavyFederal } from '../../Context/NavyFederalContext';
import axios from 'axios';

// Add API URL configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const ProfilePage = () => {
  const { updateProfile: contextUpdateProfile } = useNavyFederal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get token from localStorage instead of context
  const getToken = () => localStorage.getItem('token');
  
  // Initialize with default profile or load from localStorage
  const [profile, setProfile] = useState(() => {
    const savedProfile = localStorage.getItem('userProfile');
    return savedProfile ? JSON.parse(savedProfile) : {
      firstName: '',
      lastName: '',
      militaryBranch: '',
      rank: '',
      email: '',
      phoneNumber: '',
      profileImage: '',
      memberSince: '',
      id: '',
      _id: ''
    };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({ ...profile });
  const fileInputRef = useRef(null);

  // Fetch profile from API on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      const token = getToken();
      if (!token) return;
      
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success && response.data.profile) {
          const fetchedProfile = response.data.profile;
          setProfile(fetchedProfile);
          localStorage.setItem('userProfile', JSON.stringify(fetchedProfile));
          
          // Dispatch event for Navbar to update
          const event = new CustomEvent('profileUpdated', { detail: fetchedProfile });
          window.dispatchEvent(event);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        // Don't set error if it's just a 401, the user might not be logged in yet
        if (err.response?.status !== 401 && err.response?.status !== 404) {
          setError('Failed to load profile. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);

  // Save profile to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
    
    // Dispatch a custom event to notify Navbar about profile updates
    const event = new CustomEvent('profileUpdated', { detail: profile });
    window.dispatchEvent(event);
  }, [profile]);

  const handleImageUpload = async (event) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      
      const token = getToken();
      if (!token) {
        setError('Please log in to upload images');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('profileImage', file);
      
      const response = await axios.post(`${API_URL}/profile/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        // Update local state
        const imageUrl = response.data.profileImage;
        const newProfile = { ...profile, profileImage: imageUrl };
        setProfile(newProfile);
        
        // Also update editedProfile if in edit mode
        if (isEditing) {
          setEditedProfile(prev => ({ ...prev, profileImage: imageUrl }));
        }
        
        // Save to localStorage immediately
        localStorage.setItem('userProfile', JSON.stringify(newProfile));
        
        // Dispatch event for Navbar to update
        const event = new CustomEvent('profileUpdated', { detail: newProfile });
        window.dispatchEvent(event);
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to upload image. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleEditToggle = async () => {
    if (isEditing) {
      try {
        const token = getToken();
        if (!token) {
          setError('Please log in to edit your profile');
          return;
        }
        
        setLoading(true);
        setError(null);
        
        // Save changes to API
        const response = await axios.put(`${API_URL}/profile`, editedProfile, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          // Update local state
          const updatedProfile = response.data.profile;
          setProfile(updatedProfile);
          
          // Also update localStorage immediately  
          localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
          
          // Dispatch event for Navbar to update
          const event = new CustomEvent('profileUpdated', { detail: updatedProfile });
          window.dispatchEvent(event);
          
          // If using context API, update it as well
          if (contextUpdateProfile) {
            try {
              contextUpdateProfile(updatedProfile);
            } catch (error) {
              console.error("Failed to update profile in context", error);
            }
          }
        }
      } catch (err) {
        console.error('Error updating profile:', err);
        if (err.response?.status === 401) {
          setError('Session expired. Please log in again.');
        } else {
          setError('Failed to update profile. Please try again.');
        }
      } finally {
        setLoading(false);
        setIsEditing(false);
      }
    } else {
      // Enter edit mode
      setEditedProfile({ ...profile });
      setIsEditing(true);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNestedInputChange = (e) => {
    const { name, value } = e.target;
    const [parent, child] = name.split('.');
    setEditedProfile(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [child]: value
      }
    }));
  };

  return (
    <div className="pro003-profile-container">
      {loading && <div className="pro003-loading">Loading...</div>}
      {error && <div className="pro003-error">{error}</div>}
      
      <div className="pro003-profile-header">
        <div 
          className="pro003-profile-image-wrapper" 
          onClick={handleImageClick}
        >
          {profile.profileImage ? (
            <img 
              src={profile.profileImage.startsWith('/uploads') 
                ? `http://localhost:3000${profile.profileImage}` 
                : profile.profileImage} 
              alt="Profile" 
              className="pro003-profile-image"
            />
          ) : (
            <div className="pro003-profile-image-placeholder">
              {profile.firstName?.[0]}{profile.lastName?.[0]}
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/jpeg,image/png,image/gif"
            style={{ display: 'none' }}
          />
          <div className="pro003-profile-image-overlay">
            <span>Change Photo</span>
          </div>
        </div>
        <div className="pro003-profile-header-info">
          <h1>{profile.firstName} {profile.lastName}</h1>
          <p>{profile.militaryBranch} | {profile.rank}</p>
        </div>
        <button 
          className={`pro003-edit-toggle-btn ${isEditing ? 'pro003-save-mode' : 'pro003-edit-mode'}`}
          onClick={handleEditToggle}
          disabled={loading}
        >
          {isEditing ? 'Save Profile' : 'Edit Profile'}
        </button>
      </div>

      <div className="pro003-profile-details">
        <div className="pro003-profile-section">
          <h2>Personal Information</h2>
          <div className="pro003-profile-grid">
            <div className="pro003-profile-field">
              <label>First Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="firstName"
                  value={editedProfile.firstName}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{profile.firstName}</p>
              )}
            </div>
            <div className="pro003-profile-field">
              <label>Last Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="lastName"
                  value={editedProfile.lastName}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{profile.lastName}</p>
              )}
            </div>
            <div className="pro003-profile-field">
              <label>Military Branch</label>
              {isEditing ? (
                <input
                  type="text"
                  name="militaryBranch"
                  value={editedProfile.militaryBranch}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{profile.militaryBranch}</p>
              )}
            </div>
            <div className="pro003-profile-field">
              <label>Rank</label>
              {isEditing ? (
                <input
                  type="text"
                  name="rank"
                  value={editedProfile.rank}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{profile.rank}</p>
              )}
            </div>
          </div>
        </div>

        <div className="pro003-profile-section">
          <h2>Contact Information</h2>
          <div className="pro003-profile-grid">
            <div className="pro003-profile-field">
              <label>Email</label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={editedProfile.email}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{profile.email}</p>
              )}
            </div>
            <div className="pro003-profile-field">
              <label>Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phoneNumber"
                  value={editedProfile.phoneNumber || ''}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{profile.phoneNumber || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        <div className="pro003-profile-section">
          <h2>Membership Details</h2>
          <div className="pro003-profile-grid">
            <div className="pro003-profile-field">
              <label>Member Since</label>
              <p>{profile.memberSince ? new Date(profile.memberSince).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div className="pro003-profile-field">
              <label>Member ID</label>
              <p>{profile.id || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;