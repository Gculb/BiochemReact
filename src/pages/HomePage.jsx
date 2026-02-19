import heroMolecule from "../images/hero_molecule.jpg";

import { useNavigate } from "react-router-dom";

import "./HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <main className="content home-page">
      <section className="section active">

        {/* HERO */}
        <div className="home-hero">
          {/* LEFT */}
          <div className="hero-left">
            <div className="hero-badge">Welcome to Biochem Guide</div>
            <h1 className="hero-title">
              Master Biochemistry with Interactive Learning
            </h1>

            <p className="hero-description">
              Visualize molecules in 3D, run virtual experiments, solve practice problems, 
              and follow a curated learning path—all in one place.
            </p>

            {/* CTA GROUP */}
            <div className="hero-cta-group">
              <button
                className="cta-primary"
                onClick={() => navigate("/viewer")}
              >
                🧬 Open 3D Molecular Viewer
              </button>

              <button
                className="cta-secondary"
                onClick={() => navigate("/lab")}
              >
                Try Virtual Lab
              </button>

              <button
                className="cta-link"
                onClick={() => navigate("/resources")}
              >
                Browse Resources →
              </button>
            </div>

            <p className="hero-subtext">
              No setup required • Interactive rotation • Save views
            </p>
          </div>

          {/* RIGHT */}
          <div className="hero-right">
            <img
              src={heroMolecule}
              alt="3D molecule illustration"
              className="hero-image"
            />
          </div>
        </div>

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

        {/* GETTING STARTED GUIDE */}
        <section className="getting-started-section">
          <h2>Getting Started</h2>
          <p className="section-subtitle">Pick a learning path that fits your needs</p>
          <div className="getting-started-grid">
            <div className="path-card visual-learner">
              <div className="path-number">1</div>
              <h3>Visual Learner?</h3>
              <p className="path-description">Start with the 3D Molecular Viewer to explore molecular structures in detail</p>
              <button className="path-button" onClick={() => navigate("/viewer")}>
                Explore Molecules →
              </button>
            </div>

            <div className="path-card hands-on">
              <div className="path-number">2</div>
              <h3>Hands-On Learner?</h3>
              <p className="path-description">Try the Kinetics Lab to simulate enzyme reactions and analyze data</p>
              <button className="path-button" onClick={() => navigate("/lab")}>
                Run Simulations →
              </button>
            </div>

            <div className="path-card structured">
              <div className="path-number">3</div>
              <h3>Want Structure?</h3>
              <p className="path-description">Follow the Degree Roadmap for a semester-by-semester learning guide</p>
              <button className="path-button" onClick={() => navigate("/degree")}>
                View Roadmap →
              </button>
            </div>
          </div>
        </section>

        {/* INFO ACTIONS */}
        <div className="info-actions">
          <button
            className="info-link"
            onClick={() => navigate("/about")}
          >
            About This Project
          </button>

          <span className="info-separator">•</span>

          <button
            className="info-link"
            onClick={() => navigate("/contact")}
          >
            Contact
          </button>
        </div>
  


      </section>
    </main>
  );
};

export default HomePage;
