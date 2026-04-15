import React from 'react';
import { useParams } from 'react-router-dom';
import PracticeProblems from "../components/PracticeProblems";
import CriticalConcepts from "../components/CriticalConcepts";
import TopicCard from "../components/TopicCard";
import CategoryVisualGuide from "../components/CategoryVisualGuide";
import categoriesData from "../data/categories.json";
import topicCardsData from "../data/topicCards.json";
import { buildCategoryIllustration } from "../data/categoryVisuals";
import periodicTable from "../images/periodic_table.png";
import "./CategoryPage.css";

const categoryImages = {
  "periodic_table.png": periodicTable
};


const CategoryPage = () => {
  const { categoryId } = useParams();
  const category = categoriesData.categories.find((c) => c.id === categoryId);
  const topicSection = topicCardsData.topicSections.find((s) => s.sectionId === categoryId);
  
  if (!category) return <div className="category-page__status">Category not found.</div>;

  const topicCards = topicSection?.cards || category?.topics || [];
  const featuredTopics = topicCards
    .filter((topic) => topic.important)
    .concat(topicCards.filter((topic) => !topic.important))
    .slice(0, 3);
  const heroImage = category?.image
    ? categoryImages[category.image]
    : buildCategoryIllustration({
        category,
        topics: featuredTopics.map((topic) => topic.title),
        size: "hero",
      });
  return (
    <div className="category-page">
      <header className="category-page__hero">
        <div className="category-page__hero-copy" style={{ borderTop: `4px solid ${category.color}` }}>
          <p className="category-page__eyebrow">Category Overview</p>
          <h1 className="category-page__title">{category.title}</h1>
          <p className="category-page__description">{category.description}</p>
          <div className="category-page__stats">
            <span className="category-page__stat">{topicCards.length} topics on this page</span>
            {featuredTopics[0] && (
              <span className="category-page__stat">Start with {featuredTopics[0].title}</span>
            )}
          </div>
        </div>

        <div className="category-page__hero-media">
          <img
            src={heroImage}
            alt={`${category.title} topic overview`}
            className="category-page__hero-image"
          />
        </div>
      </header>
      
      {/* Critical Concepts Section */}
      <CriticalConcepts categoryId={categoryId} categoryColor={category.color} />

      <CategoryVisualGuide category={category} topics={featuredTopics} />

      {category.image && (
        <p className="category-page__source">
          Image source:{" "}
          <a
            href="https://en.wikipedia.org/wiki/Periodic_table#/media/File:Colour_18-col_PT_with_labels.png"
            target="_blank"
            rel="noopener noreferrer"
          >
            Wikipedia periodic table graphic
          </a>
        </p>
      )}

      {/* Content */}
      {category.id === "problems" ? (
        <PracticeProblems />
      ) : (
        <section className="category-page__content">
          <h2 className="category-page__section-title">Topics & Learning Objectives</h2>
          <div className="category-page__topic-grid">
            {topicCards.map((topic) => (
              <TopicCard 
                key={topic.id} 
                topic={topic} 
                categoryColor={category.color}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
export default CategoryPage; 
