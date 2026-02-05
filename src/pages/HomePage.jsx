import React from "react";
import { useNavigate } from "react-router-dom";
import FeatureCard from "../components/FeatureCard"; 


const HomePage = () => {
  const navigate = useNavigate();

  return (
    <main className="content" style={{ padding: 40, maxWidth: 1000 }}>
      <section className="section active">

        {/* HERO */}
        <div
          className="home-hero"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
            padding: 28,
            background: "linear-gradient(135deg,#f7fbff,#eef6ff)",
            borderRadius: 12,
            marginBottom: 18
          }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <h2 style={{ fontSize: "1.8rem", margin: "0 0 8px" }}>
              Welcome to the Interactive Biochemistry Guide
            </h2>

            <p style={{ color: "#444", marginBottom: 16 }}>
              Explore 3D molecules, run virtual labs, and practice core concepts
              with interactive modules. Start by opening the 3D viewer or
              launching a virtual lab.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                className="cta"
                onClick={() => navigate("/viewer")}
              >
                Launch 3D Viewer
              </button>

              <button
                className="cta-outline"
                onClick={() => navigate("/lab")}
              >
                Try Virtual Lab
              </button>

              <button
                className="cta-link"
                onClick={() => navigate("/resources")}
              >
                Resources
              </button>
            </div>
          </div>

          <div style={{ flex: "0 0 220px", textAlign: "center" }}>
            <img
              src="/images/hero_molecule.jpg"
              alt="Molecule illustration"
              style={{ maxWidth: 200, borderRadius: 8 }}
            />
            <p style={{ fontSize: "0.9rem", color: "#666", marginTop: 10 }}>
              Tip: Every molecule is interactive. A full 3D molecular builder
              lives on a separate page — more features coming soon.
            </p>
          </div>
        </div>

        {/* FEATURE CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 12
          }}
        >
          <FeatureCard
            color="#667eea"
            title="Quick-start"
            text="Open the 3D viewer to load example molecules and save views."
          />

          <FeatureCard
            color="#2ecc71"
            title="Virtual Lab"
            text="Run enzyme kinetics experiments and fit Km & Vmax."
          />

          <FeatureCard
            color="#f39c12"
            title="Practice Problems"
            text="Problems aligned to each course module."
          />
        </div>

      </section>
    </main>
  );
};

export default HomePage;
 