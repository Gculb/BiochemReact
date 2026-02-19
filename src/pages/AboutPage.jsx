import React from "react";
import "./AboutPage.css";
import { Link } from "react-router-dom";
const AboutPage = () => {
  return (
    <div className="about-page">
      <div className="about-container">
        {/* Hero Section */}
        <section className="about-hero">
          <div className="hero-content">
            <h1>About BiochemReact</h1>
            <p className="hero-subtitle">
              Interactive biochemistry education platform combining 3D visualization with kinetics simulations
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="about-section">
          <div className="section-content">
            <h2>Our Mission</h2>
            <p>
              BiochemReact exists to make biochemistry education more engaging and accessible. 
              Rather than learning from static diagrams and equations, students can interact with 
              real 3D molecular structures, run virtual enzyme kinetics experiments, and explore 
              biochemical concepts through hands-on simulation.
            </p>
            <p>
              We believe that understanding biochemistry requires both rigorous theory and intuitive 
              visualization. By combining interactive tools with fundamental concepts, we help students 
              build deeper understanding of the molecular world.
            </p>
          </div>
        </section>

        {/* Features Section */}

        <section className="about-section features-section">
          <h2>Explore Our Tools</h2>
          <p className="section-subtitle">Choose your learning style</p>
          <div className="features-grid">
            <div className="feature-card" onClick={() => navigate("/viewer")}>
              <div className="feature-icon">🔬</div>
              <h3>3D Molecular Viewer</h3>
              <p>
                Interactive three.js-powered visualization of glucose, ATP, amino acids, 
                DNA base pairs, and more. Rotate, zoom, and save your favorite views.
              </p>
            </div>

            <div className="feature-card" onClick={() => navigate("/lab")}>
              <div className="feature-icon" >⚗️</div>
              <h3>Kinetics Lab</h3>
              <p>
                Simulate Michaelis-Menten enzyme kinetics. Generate synthetic data, add noise, 
                and practice parameter fitting to real biochemical reactions.
              </p>
            </div>

            <div className="feature-card" onClick={() => navigate("/resources")}>
              <div className="feature-icon">📚</div>
              <h3>Comprehensive Topics</h3>
              <p>
                27+ categories covering everything from general chemistry to molecular biology, 
                complete with learning objectives and key concepts.
              </p>
            </div>

            <div className="feature-card" onClick={() => navigate("/lab")}>
              <div className="feature-icon">📊</div>
              <h3>Data & Analysis</h3>
              <p>
                Learn biochemical data analysis with real examples of enzyme kinetics, 
                statistical methods, and experimental design.
              </p>
            </div>

            <div className="feature-card" onClick={() => navigate("/problems")}>
              <div className="feature-icon">🎯</div>
              <h3>Practice Problems</h3>
              <p>
                Sharpen your skills with curated problems and questions across all major 
                biochemistry topics and difficulty levels.
              </p>
            </div>

            <div className="feature-card" onClick={() => navigate("/degree")}>
              <div className="feature-icon">🗺️</div>
              <h3>Degree Roadmap</h3>
              <p>
                A suggested four-year curriculum guide for biochemistry majors, 
                with year-by-year recommendations.
              </p>
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="about-section tech-section">
          <h2>Built With Modern Technology</h2>
          <div className="tech-columns">
            <div className="tech-column">
              <h3>Frontend Framework</h3>
              <ul>
                <li><strong>React 19.2</strong> - Component-based UI</li>
                <li><strong>React Router 7</strong> - Client-side routing</li>
                <li><strong>React Hooks</strong> - State management</li>
              </ul>
            </div>

            <div className="tech-column">
              <h3>3D & Visualization</h3>
              <ul>
                <li><strong>Three.js</strong> - WebGL 3D graphics</li>
                <li><strong>Chart.js</strong> - Data visualization</li>
                <li><strong>KaTeX / react-katex</strong> - Mathematical equations</li>
              </ul>
            </div>

            <div className="tech-column">
              <h3>Tools & Services</h3>
              <ul>
                <li><strong>EmailJS</strong> - Client-side email</li>
                <li><strong>localStorage</strong> - View persistence</li>
                <li><strong>FontAwesome</strong> - Icons</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Creator Section */}
        <section className="about-section creator-section">
          <h2>About the Creator</h2>
          <div className="creator-content">
            <div className="creator-text">
              <p>
                BiochemReact was created by <strong>Grant Culbertson</strong>, a biochemistry Grad 
                passionate about making complex scientific concepts accessible through interactive learning tools.
              </p>
              <p>
                With a background in chemistry and molecular biology, Grant understands the challenges 
                students face when learning biochemistry. This platform represents a commitment to 
                improving STEM education through technology.
              </p>
              <p>
                The project started as a personal learning tool and evolved into a comprehensive 
                educational platform designed to help thousands of students understand biochemistry 
                more deeply and intuitively.
              </p>

              <div className="creator-links">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="creator-link">
                  <i className="fa-brands fa-github"></i> GitHub
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="creator-link">
                  <i className="fa-brands fa-linkedin"></i> LinkedIn
                </a>
                <a href="mailto:grant.culbertson@example.com" className="creator-link">
                  <i className="fa-solid fa-envelope"></i> Email
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Goals Section */}
        <section className="about-section goals-section">
          <h2>Future Goals</h2>
          <div className="goals-list">
            <div className="goal-item">
              <h4>Expand Molecule Library</h4>
              <p>Add hundreds more molecules including complex proteins, drug candidates, and metabolic intermediates</p>
            </div>

            <div className="goal-item">
              <h4>Advanced Lab Simulations</h4>
              <p>Create virtual labs for PCR, chromatography, gel electrophoresis, and spectroscopy</p>
            </div>

            <div className="goal-item">
              <h4>AI-Powered Tutoring</h4>
              <p>Implement intelligent tutoring system to provide personalized learning recommendations</p>
            </div>

            <div className="goal-item">
              <h4>Mobile Applications</h4>
              <p>Develop native iOS and Android apps for learning on the go</p>
            </div>

            <div className="goal-item">
              <h4>Community Features</h4>
              <p>Enable students to share discoveries, discuss problems, and collaborate on learning</p>
            </div>

            <div className="goal-item">
              <h4>University Partnerships</h4>
              <p>Work with universities to integrate BiochemReact into official curricula</p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="about-cta">
          <h2>Ready to Learn?</h2>
          <p>Explore 3D molecules, run virtual labs, and master biochemistry concepts</p>
          <div className="cta-buttons">
            <Link to="/#/viewer" className="cta-btn primary">
              Launch 3D Viewer
            </Link>
            <Link to="/#/lab" className="cta-btn secondary">
              Try Virtual Lab
            </Link>
            <Link to="/#/contact" className="cta-btn secondary">
              Get in Touch
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
