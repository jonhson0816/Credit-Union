import React, { useState } from 'react';
import { Heart, Users, GraduationCap, Home, DollarSign, Briefcase, Award, Target, HandHeart, Star, TrendingUp, CheckCircle } from 'lucide-react';
import './CommunitySupport.css';

const CommunitySupport = () => {
  const [activeTab, setActiveTab] = useState('programs');

  const programs = [
    {
      id: 1,
      icon: GraduationCap,
      title: 'Education & Scholarships',
      description: 'Empowering military families through educational opportunities and financial support.',
      amount: '$5M+',
      beneficiaries: '10,000+ Students',
      details: [
        'Annual scholarship programs for military children',
        'College preparation workshops and resources',
        'STEM education initiatives for underserved communities',
        'Financial literacy programs in schools'
      ],
      color: '#10B981'
    },
    {
      id: 2,
      icon: Home,
      title: 'Housing Assistance',
      description: 'Supporting military families in achieving homeownership and housing stability.',
      amount: '$15M+',
      beneficiaries: '5,000+ Families',
      details: [
        'First-time homebuyer education programs',
        'Down payment assistance grants',
        'Foreclosure prevention counseling',
        'Housing transition support for veterans'
      ],
      color: '#3B82F6'
    },
    {
      id: 3,
      icon: Briefcase,
      title: 'Career Development',
      description: 'Preparing service members and veterans for successful civilian careers.',
      amount: '$3M+',
      beneficiaries: '8,000+ Veterans',
      details: [
        'Job training and placement programs',
        'Resume building and interview workshops',
        'Professional certification funding',
        'Entrepreneurship support for veteran-owned businesses'
      ],
      color: '#8B5CF6'
    },
    {
      id: 4,
      icon: Heart,
      title: 'Financial Wellness',
      description: 'Providing free financial counseling and resources to military families.',
      amount: 'Free Services',
      beneficiaries: '25,000+ Members',
      details: [
        'One-on-one financial counseling sessions',
        'Debt management and budgeting support',
        'Credit repair assistance programs',
        'Retirement planning guidance'
      ],
      color: '#EF4444'
    },
    {
      id: 5,
      icon: Users,
      title: 'Family Support Services',
      description: 'Strengthening military families through community programs and resources.',
      amount: '$2M+',
      beneficiaries: '15,000+ Families',
      details: [
        'Deployment support groups and resources',
        'Childcare assistance programs',
        'Mental health and wellness initiatives',
        'Emergency financial assistance fund'
      ],
      color: '#F59E0B'
    },
    {
      id: 6,
      icon: HandHeart,
      title: 'Community Partnerships',
      description: 'Collaborating with organizations to maximize our impact in military communities.',
      amount: '$8M+',
      beneficiaries: '50+ Organizations',
      details: [
        'Partnerships with veteran service organizations',
        'Support for military spouse employment programs',
        'Funding for local community centers',
        'Disaster relief and emergency assistance'
      ],
      color: '#EC4899'
    }
  ];

  const impactStats = [
    { number: '$50M+', label: 'Invested Annually', icon: DollarSign },
    { number: '100K+', label: 'Lives Impacted', icon: Users },
    { number: '500+', label: 'Community Partners', icon: HandHeart },
    { number: '25 Years', label: 'Of Giving Back', icon: Award }
  ];

  const initiatives = [
    {
      year: '2025',
      title: 'Military Spouse Career Advancement',
      description: 'Launch of comprehensive career development platform for military spouses',
      status: 'Active'
    },
    {
      year: '2025',
      title: 'Veteran Mental Health Support',
      description: 'Partnership with leading mental health organizations to provide free counseling',
      status: 'Active'
    },
    {
      year: '2024',
      title: 'Financial Literacy Campaign',
      description: 'Reached over 50,000 military families with free financial education',
      status: 'Completed'
    },
    {
      year: '2024',
      title: 'Disaster Relief Fund',
      description: 'Emergency assistance for military families affected by natural disasters',
      status: 'Ongoing'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Navy Spouse',
      text: 'The scholarship program made it possible for my daughter to attend college. Navy Federal\'s support has been life-changing for our family.',
      image: '👩‍💼'
    },
    {
      name: 'Michael Rodriguez',
      role: 'Army Veteran',
      text: 'The career development program helped me transition successfully into civilian life. I now have a thriving career thanks to their support.',
      image: '👨‍💻'
    },
    {
      name: 'Emily Chen',
      role: 'Marine Family',
      text: 'During a difficult deployment, the family support services provided resources and community that got us through. Forever grateful.',
      image: '👨‍👩‍👧'
    }
  ];

  return (
    <div className="community-container">
      {/* Hero Section */}
      <section className="community-hero">
        <div className="community-hero-content">
          <div className="community-hero-badge">
            <Heart className="community-badge-icon" />
            <span>Making a Difference</span>
          </div>
          <h1 className="community-hero-title">Supporting Those Who Serve</h1>
          <p className="community-hero-subtitle">
            For over two decades, Navy Federal has been dedicated to giving back to the military community 
            through programs, partnerships, and initiatives that make a lasting impact.
          </p>
          <div className="community-hero-stats">
            <div className="community-hero-stat">
              <div className="community-stat-number">$50M+</div>
              <div className="community-stat-label">Annual Investment</div>
            </div>
            <div className="community-hero-stat">
              <div className="community-stat-number">100K+</div>
              <div className="community-stat-label">Lives Impacted</div>
            </div>
            <div className="community-hero-stat">
              <div className="community-stat-number">500+</div>
              <div className="community-stat-label">Partners</div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Statistics */}
      <section className="community-impact">
        <div className="community-impact-container">
          <h2 className="community-section-title">Our Impact</h2>
          <p className="community-section-subtitle">
            Together, we're building stronger communities and brighter futures for military families.
          </p>
          <div className="community-impact-grid">
            {impactStats.map((stat, index) => (
              <div key={index} className="community-impact-card">
                <stat.icon className="community-impact-icon" />
                <div className="community-impact-number">{stat.number}</div>
                <div className="community-impact-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="community-programs">
        <div className="community-programs-container">
          <div className="community-programs-header">
            <h2 className="community-section-title">Our Programs</h2>
            <p className="community-section-subtitle">
              Comprehensive support addressing the unique needs of military families across every stage of service.
            </p>
          </div>
          
          <div className="community-programs-grid">
            {programs.map((program) => (
              <div key={program.id} className="community-program-card">
                <div className="community-program-header">
                  <div className="community-program-icon-wrapper" style={{ backgroundColor: `${program.color}20` }}>
                    <program.icon className="community-program-icon" style={{ color: program.color }} />
                  </div>
                  <div className="community-program-badge">
                    <span className="community-badge-amount">{program.amount}</span>
                    <span className="community-badge-divider">•</span>
                    <span className="community-badge-beneficiaries">{program.beneficiaries}</span>
                  </div>
                </div>
                <h3 className="community-program-title">{program.title}</h3>
                <p className="community-program-description">{program.description}</p>
                <ul className="community-program-details">
                  {program.details.map((detail, index) => (
                    <li key={index} className="community-program-detail">
                      <CheckCircle size={18} className="community-check-icon" />
                      {detail}
                    </li>
                  ))}
                </ul>
                <button className="community-program-btn">Learn More</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Current Initiatives */}
      <section className="community-initiatives">
        <div className="community-initiatives-container">
          <h2 className="community-section-title">Current Initiatives</h2>
          <p className="community-section-subtitle">
            Ongoing programs and recent accomplishments in our commitment to the military community.
          </p>
          <div className="community-timeline">
            {initiatives.map((initiative, index) => (
              <div key={index} className="community-timeline-item">
                <div className="community-timeline-marker">
                  <div className="community-timeline-dot"></div>
                  {index < initiatives.length - 1 && <div className="community-timeline-line"></div>}
                </div>
                <div className="community-timeline-content">
                  <div className="community-timeline-header">
                    <span className="community-timeline-year">{initiative.year}</span>
                    <span className={`community-timeline-status ${initiative.status.toLowerCase()}`}>
                      {initiative.status}
                    </span>
                  </div>
                  <h3 className="community-timeline-title">{initiative.title}</h3>
                  <p className="community-timeline-description">{initiative.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="community-testimonials">
        <div className="community-testimonials-container">
          <h2 className="community-section-title">Stories of Impact</h2>
          <p className="community-section-subtitle">
            Hear from military families whose lives have been touched by our programs.
          </p>
          <div className="community-testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="community-testimonial-card">
                <div className="community-testimonial-stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="community-star-icon" fill="#FFB81C" color="#FFB81C" />
                  ))}
                </div>
                <p className="community-testimonial-text">"{testimonial.text}"</p>
                <div className="community-testimonial-author">
                  <div className="community-author-image">{testimonial.image}</div>
                  <div className="community-author-info">
                    <div className="community-author-name">{testimonial.name}</div>
                    <div className="community-author-role">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership CTA */}
      <section className="community-partnership">
        <div className="community-partnership-container">
          <div className="community-partnership-content">
            <Target className="community-partnership-icon" />
            <h2 className="community-partnership-title">Partner With Us</h2>
            <p className="community-partnership-text">
              Join us in our mission to support military families. Whether you're a nonprofit organization, 
              corporate partner, or community leader, together we can make a greater impact.
            </p>
            <div className="community-partnership-benefits">
              <div className="community-benefit-item">
                <TrendingUp className="community-benefit-icon" />
                <span>Amplify Your Impact</span>
              </div>
              <div className="community-benefit-item">
                <Users className="community-benefit-icon" />
                <span>Reach Military Communities</span>
              </div>
              <div className="community-benefit-item">
                <Award className="community-benefit-icon" />
                <span>Proven Track Record</span>
              </div>
            </div>
            <button className="community-partnership-btn">Explore Partnership Opportunities</button>
          </div>
        </div>
      </section>

      {/* Get Involved Section */}
      <section className="community-involved">
        <div className="community-involved-container">
          <h2 className="community-section-title">Get Involved</h2>
          <p className="community-section-subtitle">
            There are many ways to support our mission and make a difference in military families' lives.
          </p>
          <div className="community-involved-grid">
            <div className="community-involved-card">
              <div className="community-involved-icon">💰</div>
              <h3>Donate</h3>
              <p>Make a direct contribution to programs supporting military families in need.</p>
              <button className="community-involved-btn">Donate Now</button>
            </div>
            <div className="community-involved-card">
              <div className="community-involved-icon">🤝</div>
              <h3>Volunteer</h3>
              <p>Share your time and skills to mentor and support service members and veterans.</p>
              <button className="community-involved-btn">Learn More</button>
            </div>
            <div className="community-involved-card">
              <div className="community-involved-icon">📢</div>
              <h3>Spread the Word</h3>
              <p>Help us reach more military families by sharing information about our programs.</p>
              <button className="community-involved-btn">Share</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CommunitySupport;