import React from 'react';
import { useParams } from 'react-router-dom';
import PracticeProblems from "../components/PracticeProblems";
import CriticalConcepts from "../components/CriticalConcepts";
import TopicCard from "../components/TopicCard";
import categoriesData from "../data/categories.json";
import topicCardsData from "../data/topicCards.json";
import periodicTable from "../images/periodic_table.png";

const categoryImages = {
  "periodic_table.png": periodicTable
};


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

      {/* Category Image */}
      {category.image && (
        <div style={{ marginBottom: "30px", textAlign: "center" }}>
          <img
            src={categoryImages[category.image]}
            alt={category.title}
            style={{
              width: "100%",
              maxWidth: "900px",
              height: "auto",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}
          />
          <p>Image sourced from https://en.wikipedia.org/wiki/Periodic_table#/media/File:Colour_18-col_PT_with_labels.png</p>
        </div>
      )}

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