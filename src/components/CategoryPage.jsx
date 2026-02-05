import React from 'react';

const CategoryPage = ({ category }) => {
  if (!category) return <div>Category not found.</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '800px' }}>
      {/* Header Section */}
      <header style={{ borderBottom: `4px solid ${category.color}`, marginBottom: '20px' }}>
        <h1 style={{ color: category.color, fontSize: '2.5rem', marginBottom: '10px' }}>
          {category.title}
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#555', fontStyle: 'italic' }}>
          {category.description}
        </p>
      </header>

      {/* Topics List */}
      <section>
        <h2 style={{ color: '#333' }}>Topics & Key Concepts</h2>
        <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
          {category.topics.map((topic) => (
            <div 
              key={topic.id} 
              style={{ 
                padding: '15px', 
                borderRadius: '8px', 
                background: '#f9f9f9',
                borderLeft: topic.important ? `5px solid ${category.color}` : '1px solid #ddd',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <h3 style={{ margin: '0 0 5px 0', color: topic.important ? category.color : '#2c3e50' }}>
                {topic.title} {topic.important && '⭐'}
              </h3>
              {topic.summary && <p style={{ margin: 0, fontSize: '0.95rem' }}>{topic.summary}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CategoryPage; 