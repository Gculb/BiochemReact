import heroMolecule from "../images/hero_molecule.jpg";
import periodicTable from "../images/periodic_table.png"
import React from "react";
import { useNavigate } from "react-router-dom";
import FeatureCard from "../components/FeatureCard";
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
            <h1 className="hero-title">
              Explore Biochemistry in 3D
            </h1>

            <p className="hero-description">
              Visualize molecules in real time, rotate structures, and explore
              biochemical interactions through an interactive 3D viewer and
              virtual labs.
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

        {/* FEATURE CARDS */}
        <div className="feature-grid">
          <FeatureCard
            color="#667eea"
            title="3D Molecular Viewer"
            text="Load molecules, rotate structures, and inspect atomic details."
          />

          <FeatureCard
            color="#2ecc71"
            title="Virtual Lab"
            text="Run enzyme kinetics experiments and estimate Km and Vmax."
          />

          <FeatureCard
            color="#f39c12"
            title="Practice Problems"
            text="Concept checks aligned with each biochemistry topic."
          />
        </div>

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
