
import React from "react";

const FeatureCard = ({ title, text, color }) => (
  <div
    style={{
      background: "white",
      padding: 14,
      borderRadius: 10,
      borderLeft: `4px solid ${color}`,
    }}
  >
    <strong>{title}</strong>
    <p style={{ margin: "6px 0", color: "#555" }}>{text}</p>
  </div>
);

export default FeatureCard;

