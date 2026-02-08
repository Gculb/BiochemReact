import React from 'react';
import { useParams } from 'react-router-dom';
import PracticeProblems from "../components/PracticeProblems";
import CriticalConcepts from "../components/CriticalConcepts";
import TopicCard from "../components/TopicCard";
import categoriesData from "../data/categories.json";
import topicCardsData from "../data/topicCards.json";


const CategoryPage = () => {
  const { categoryId } = useParams();
  const category = categoriesData.categories.find((c) => c.id === categoryId);
  const topicSection = topicCardsData.topicSections.find((s) => s.sectionId === categoryId);
  
  if (!category) return (
    <div style={{ padding: 40, color: '#ff6b6b', fontSize: '1.2rem' }}>
      Category not found.
    </div>
  );

  return (
    <div style={{ padding: '40px', maxWidth: '1000px' }}>
      {/* Header Section */}
      <header style={{ borderBottom: `4px solid ${category.color}`, marginBottom: '20px' }}>
        <h1 style={{ color: category.color, fontSize: '2.5rem', marginBottom: '10px' }}>
          {category.title}
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#555', fontStyle: 'italic' }}>
          {category.description}
        </p>
      </header>

      {/* Critical Concepts Section */}
      <CriticalConcepts categoryId={categoryId} categoryColor={category.color} />

      {/* Content */}
      {category.id === "problems" ? (
        <PracticeProblems />
      ) : (
        <section>
          <h2 style={{ color: '#333', marginBottom: '20px', fontSize: '1.5rem' }}>
            Topics & Learning Objectives
          </h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {topicSection && topicSection.cards.map((topic) => (
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