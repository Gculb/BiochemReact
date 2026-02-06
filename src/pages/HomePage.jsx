import heroMolecule from "../images/hero_molecule.jpg";
import React from "react";
import { useNavigate } from "react-router-dom";
import FeatureCard from "../components/FeatureCard";


const HomePage = () => {
  const navigate = useNavigate();

  return (
    <main
      className="content"
      style={{
        padding: "48px 40px",
        maxWidth: 1100,
        margin: "0 auto"
      }}
    >
      <section className="section active">

        {/* HERO */}
        <div
          className="home-hero"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
            flexWrap: "wrap",
            padding: 36,
            background:
              "linear-gradient(135deg, #eef4ff 0%, #f8fbff 100%)",
            borderRadius: 16,
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            marginBottom: 32
          }}
        >
          {/* LEFT */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <h1
              style={{
                fontSize: "2.2rem",
                fontWeight: 700,
                marginBottom: 12
              }}
            >
              Explore Biochemistry in 3D
            </h1>

            <p
              style={{
                fontSize: "1.05rem",
                color: "#444",
                marginBottom: 24,
                maxWidth: 520
              }}
            >
              Visualize molecules in real time, rotate structures, and explore
              biochemical interactions through an interactive 3D viewer and
              virtual labs.
            </p>

            {/* CTA GROUP */}
            <div
              style={{
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
                alignItems: "center"
              }}
            >
              {/* PRIMARY CTA */}
              <button
                onClick={() => navigate("/viewer")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 22px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "#fff",
                  background:
                    "linear-gradient(135deg, #667eea, #5a67d8)",
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                  boxShadow: "0 8px 20px rgba(102,126,234,0.35)"
                }}
              >
                🧬 Open 3D Molecular Viewer
              </button>

              {/* SECONDARY */}
              <button
                onClick={() => navigate("/lab")}
                style={{
                  padding: "12px 18px",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  background: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: 8,
                  cursor: "pointer"
                }}
              >
                Try Virtual Lab
              </button>

              <button
                onClick={() => navigate("/resources")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#5a67d8",
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                Browse Resources →
              </button>
            </div>

            <p
              style={{
                marginTop: 14,
                fontSize: "0.85rem",
                color: "#666"
              }}
            >
              No setup required • Interactive rotation • Save views
            </p>
          </div>

          {/* RIGHT */}
          <div style={{ flex: "0 0 240px", textAlign: "center" }}>
            <img
              src={heroMolecule}
              alt="3D molecule illustration"
              style={{
                maxWidth: 220,
                borderRadius: 12,
                boxShadow: "0 6px 16px rgba(0,0,0,0.15)"
              }}
            />
          </div>
        </div>

        {/* FEATURE CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
            gap: 18
          }}
        >
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

      </section>
    </main>
  );
};

export default HomePage;
