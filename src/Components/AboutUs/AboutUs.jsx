import React from 'react';
import { Building2, Users, Target, Award, TrendingUp, Heart } from 'lucide-react';
import './AboutUs.css';

const AboutUs = () => {
  return (
    <div className="about-container">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <h1 className="about-hero-title">Serving Those Who Serve</h1>
          <p className="about-hero-subtitle">
            For over 90 years, Navy Federal Credit Union has been dedicated to serving the financial needs of the military community and their families.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-mission-section">
        <div className="about-section-header">
          <Target className="about-section-icon" />
          <h2>Our Mission</h2>
        </div>
        <p className="about-mission-text">
          Navy Federal Credit Union is committed to being the most preferred and trusted financial institution serving the military and their families. We exist to serve, not to profit, and we measure our success by the financial security and well-being of our members.
        </p>
      </section>

      {/* Values Section */}
      <section className="about-values-section">
        <h2 className="about-section-title">Our Core Values</h2>
        <div className="about-values-grid">
          <div className="about-value-card">
            <Users className="about-value-icon" />
            <h3>Service</h3>
            <p>We serve the military community with dedication and honor, putting members first in everything we do.</p>
          </div>
          <div className="about-value-card">
            <Award className="about-value-icon" />
            <h3>Integrity</h3>
            <p>We conduct business with the highest ethical standards, earning trust through transparency and honesty.</p>
          </div>
          <div className="about-value-card">
            <TrendingUp className="about-value-icon" />
            <h3>Excellence</h3>
            <p>We strive for excellence in all aspects of our service, continuously improving to meet member needs.</p>
          </div>
          <div className="about-value-card">
            <Heart className="about-value-icon" />
            <h3>Community</h3>
            <p>We build strong relationships and give back to the military communities we proudly serve.</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="about-stats-section">
        <h2 className="about-stats-title">By the Numbers</h2>
        <div className="about-stats-grid">
          <div className="about-stat-item">
            <div className="about-stat-number">13M+</div>
            <div className="about-stat-label">Members Worldwide</div>
          </div>
          <div className="about-stat-item">
            <div className="about-stat-number">$165B+</div>
            <div className="about-stat-label">Assets Under Management</div>
          </div>
          <div className="about-stat-item">
            <div className="about-stat-number">350+</div>
            <div className="about-stat-label">Branch Locations</div>
          </div>
          <div className="about-stat-item">
            <div className="about-stat-number">24,000+</div>
            <div className="about-stat-label">Employees</div>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="about-history-section">
        <div className="about-section-header">
          <Building2 className="about-section-icon" />
          <h2>Our History</h2>
        </div>
        <p className="about-history-text">
          Founded in 1933 with just seven members and $49 in assets, Navy Federal Credit Union has grown to become the world's largest credit union. From our humble beginnings serving Navy Department employees, we've expanded our field of membership to include all branches of the armed forces, Department of Defense civilians, and their families. Today, we continue our mission of service with the same dedication and commitment that our founders envisioned over 90 years ago.
        </p>
      </section>

      {/* Member Benefits Section */}
      <section className="about-benefits-section">
        <h2 className="about-section-title">Why Choose Navy Federal?</h2>
        <div className="about-benefits-grid">
          <div className="about-benefit-item">
            <div className="about-benefit-number">1</div>
            <h3>Member-Owned</h3>
            <p>As a not-for-profit credit union, we return earnings to members through better rates and lower fees.</p>
          </div>
          <div className="about-benefit-item">
            <div className="about-benefit-number">2</div>
            <h3>Dedicated Support</h3>
            <p>Our team understands the unique financial needs of military members and their families.</p>
          </div>
          <div className="about-benefit-item">
            <div className="about-benefit-number">3</div>
            <h3>Global Reach</h3>
            <p>Access your accounts worldwide with branches near military installations and robust digital banking.</p>
          </div>
          <div className="about-benefit-item">
            <div className="about-benefit-number">4</div>
            <h3>Financial Education</h3>
            <p>Free resources and counseling to help you achieve your financial goals at every life stage.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;