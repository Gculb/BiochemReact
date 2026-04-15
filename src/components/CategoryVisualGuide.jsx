import React from "react";
import { buildCategoryIllustration } from "../data/categoryVisuals";
import "./CategoryVisualGuide.css";

const CategoryVisualGuide = ({ category, topics = [] }) => {
  const featuredTopics = topics.slice(0, 3);

  if (!featuredTopics.length) {
    return null;
  }

  return (
    <section className="category-visual-guide" aria-labelledby="visual-guide-title">
      <div className="category-visual-guide__intro">
        <div>
          <p className="category-visual-guide__eyebrow">Visual Guide</p>
          <h2 id="visual-guide-title">Topic snapshots for this section</h2>
        </div>
        <p className="category-visual-guide__description">
          Quick visual anchors make the page easier to scan before diving into the full notes below.
        </p>
      </div>

      <div className="category-visual-guide__grid">
        {featuredTopics.map((topic) => (
          <article className="category-visual-guide__card" key={topic.id}>
            <img
              className="category-visual-guide__image"
              src={buildCategoryIllustration({
                category,
                topics: [topic.title],
                size: "tile",
                subtitle: topic.summary || topic.title,
              })}
              alt={`${topic.title} visual summary`}
              loading="lazy"
            />
            <div className="category-visual-guide__copy">
              <h3>{topic.title}</h3>
              <p>{topic.summary || "A highlighted concept from this category."}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default CategoryVisualGuide;

