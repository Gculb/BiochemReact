import React from "react";
import criticalConceptsData from "../data/criticalConcepts.json";
import "./CriticalConcepts.css";

const CriticalConcepts = ({ categoryId, categoryColor = "#667eea" }) => {
  // Find the critical concepts section for this category
  const section = criticalConceptsData.criticalReview.find(
    (item) => item.sectionId === categoryId
  );

  if (!section || !section.items || section.items.length === 0) {
    return null; // Don't render if no critical concepts found
  }

  return (
    <section 
      className="critical-concepts" 
      style={{ "--gradient-color": categoryColor }}
    >
      <div className="critical-concepts__container">
        <h3 className="critical-concepts__title">
          <span className="critical-concepts__icon">⚡</span>
          Critical Concepts to Master
        </h3>

        <div className="critical-concepts__grid">
          {section.items.slice(0, 6).map((concept) => (
            <article 
              key={concept.id} 
              className="critical-concepts__card"
              role="region"
              aria-labelledby={`concept-${concept.id}`}
            >
              <h4 
                className="critical-concepts__card-title"
                id={`concept-${concept.id}`}
              >
                {concept.title}
              </h4>
              <p className="critical-concepts__card-description">
                {concept.description}
              </p>
              {concept.keyPoints && concept.keyPoints.length > 0 && (
                <ul className="critical-concepts__key-points">
                  {concept.keyPoints.slice(0, 3).map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CriticalConcepts;
