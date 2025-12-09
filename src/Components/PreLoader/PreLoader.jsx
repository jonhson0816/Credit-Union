import React, { useEffect, useState } from 'react';

const PreLoader = ({ minimumTime = 3000 }) => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  
  useEffect(() => {
    let interval;
    let startTime = Date.now();
    const duration = minimumTime * 0.85;
    
    interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const calculatedProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(calculatedProgress);
      
      if (calculatedProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => {
            setLoading(false);
          }, 500);
        }, 300);
      }
    }, 30);
    
    return () => clearInterval(interval);
  }, [minimumTime]);
  
  if (!loading) return null;
  
  // Calculate circle circumference for progress animation
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #001f3f 0%, #003057 50%, #004080 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.5s ease-out',
      overflow: 'hidden'
    }}>
      {/* Animated Background Grid */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        animation: 'gridMove 20s linear infinite',
        opacity: 0.5
      }} />
      
      {/* Glowing Orbs */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '15%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(0,123,255,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite',
        filter: 'blur(40px)'
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '20%',
        width: '250px',
        height: '250px',
        background: 'radial-gradient(circle, rgba(0,200,255,0.12) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 10s ease-in-out infinite reverse',
        filter: 'blur(40px)'
      }} />
      
      {/* Main Content Container */}
      <div style={{
        position: 'relative',
        animation: 'scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        {/* Circular Progress Container */}
        <div style={{
          position: 'relative',
          width: '240px',
          height: '240px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* SVG Circle Progress */}
          <svg 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transform: 'rotate(-90deg)',
              filter: 'drop-shadow(0 0 20px rgba(0, 200, 255, 0.5))'
            }}
            width="240" 
            height="240"
          >
            {/* Background Circle */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="3"
              fill="none"
            />
            
            {/* Progress Circle */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              stroke="url(#progressGradient)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{
                transition: 'stroke-dashoffset 0.3s ease-out'
              }}
            />
            
            {/* Gradient Definition */}
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#00d4ff', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#0099ff', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#0066ff', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Rotating Glow Effect */}
          <div style={{
            position: 'absolute',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0, 200, 255, 0.2) 180deg, transparent 360deg)',
            animation: 'rotate 3s linear infinite',
            filter: 'blur(15px)'
          }} />
          
          {/* Logo Container with Pulse Effect */}
          <div style={{
            position: 'relative',
            width: '140px',
            height: '140px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '50%',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(0, 123, 255, 0.1)',
            animation: 'logoPulse 2s ease-in-out infinite',
            zIndex: 2
          }}>
            <img 
              src="/Images/nafyfee.jpeg" 
              alt="Navy Federal Credit Union" 
              style={{
                width: '110px',
                height: 'auto',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          </div>
          
          {/* Percentage Display */}
          <div style={{
            position: 'absolute',
            bottom: '-50px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#00d4ff',
            fontSize: '24px',
            fontWeight: '600',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
            animation: 'fadeInUp 0.8s ease-out 0.3s both'
          }}>
            {Math.round(progress)}%
          </div>
        </div>
        
        {/* Loading Text */}
        <div style={{
          marginTop: '80px',
          textAlign: 'center',
          animation: 'fadeInUp 0.8s ease-out 0.5s both'
        }}>
          <div style={{
            color: '#FFFFFF',
            fontSize: '18px',
            fontWeight: '300',
            letterSpacing: '4px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            marginBottom: '12px'
          }}>
            LOADING
          </div>
          
          {/* Animated Dots */}
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#00d4ff',
                  animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                  boxShadow: '0 0 10px rgba(0, 212, 255, 0.8)'
                }}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Bottom Tagline */}
      <div style={{
        position: 'absolute',
        bottom: '60px',
        textAlign: 'center',
        animation: 'fadeIn 1s ease-out 1s both'
      }}>
        <div style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '14px',
          fontWeight: '400',
          letterSpacing: '2px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          marginBottom: '8px'
        }}>
          NAVY FEDERAL CREDIT UNION
        </div>
        <div style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '12px',
          fontWeight: '300',
          letterSpacing: '1px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          Our Members Are The Mission
        </div>
      </div>
      
      <style>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes logoPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(0, 123, 255, 0.1);
          }
          50% {
            transform: scale(1.03);
            box-shadow: 0 15px 50px rgba(0, 212, 255, 0.4), inset 0 0 30px rgba(0, 123, 255, 0.2);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes dotPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.5);
            opacity: 1;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(30px, 30px);
          }
        }
        
        @keyframes gridMove {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }
      `}</style>
    </div>
  );
};

export default PreLoader;