import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CategoryPage from './components/CategoryPage';
import categoriesData from './data/categories.json';

const AppRouter = () => {
  return (
    <Routes>
      {/* 3. The Home Page Route */}
      <Route path="/" element={<div style={{ padding: '40px' }}><h1>Welcome to Biochem Guide</h1><p>Select a subject from the sidebar to begin.</p></div>} />

      {/* 4. Dynamic routes for all categories in your JSON */}
      {categoriesData.categories.map((cat) => (
        <Route 
          key={cat.id} 
          path={`/${cat.id}`} 
          element={<CategoryPage category={cat} />} 
        />
      ))}

      {/* Optional: 404 catch-all */}
      <Route path="*" element={<div style={{ padding: '40px' }}>Section not found.</div>} />
    </Routes>
  );
};

export default AppRouter;