import React, { useState, useEffect } from 'react';
import PreLoader from '../../Components/PreLoader/PreLoader';

// Higher Order Component for adding preloader to any page component
const withPreLoader = (WrappedComponent, navigationTime = 1000, refreshTime = 300) => {
    // Create a static flag to track if this is the first load of the application
    const isFirstLoadKey = 'app_first_load';
    
    return (props) => {
      const [loading, setLoading] = useState(true);
      
      useEffect(() => {
        // Check if this is a navigation or a refresh/first load
        const isFirstLoad = sessionStorage.getItem(isFirstLoadKey) !== 'loaded';
        
        // If it's the first load of the session, mark it as loaded for future reference
        if (isFirstLoad) {
          sessionStorage.setItem(isFirstLoadKey, 'loaded');
        }
        
        // Determine which timeout to use
        const timeoutDuration = isFirstLoad ? refreshTime : navigationTime;
        
        const timer = setTimeout(() => {
          setLoading(false);
        }, timeoutDuration);
  
        return () => {
          clearTimeout(timer);
        };
      }, []);
  
      if (loading) {
        return <PreLoader minimumTime={0} />;
      }
  
      return <WrappedComponent {...props} />;
    };
  };
  
  export default withPreLoader;