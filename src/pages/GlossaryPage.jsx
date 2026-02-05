import React, { useState, useMemo } from "react";
import glossaryData from "../data/glossary.json";
import "./GlossaryPage.css";

const GlossaryPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = ["all", ...new Set(glossaryData.terms.map(term => term.category))];
    return cats.sort((a, b) => a === "all" ? -1 : b === "all" ? 1 : a.localeCompare(b));
  }, []);

  // Filter and search terms
  const filteredTerms = useMemo(() => {
    return glossaryData.terms
      .filter(term => {
        const matchesSearch = term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             term.definition.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "all" || term.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [searchTerm, selectedCategory]);

  return (
    <div className="glossary-page">
      <div className="glossary-container">
        {/* Hero Section */}
        <section className="glossary-hero">
          <div className="hero-content">
            <h1>Biochemistry Glossary</h1>
            <p className="hero-subtitle">
              {glossaryData.terms.length} essential terms and definitions covering biochemistry, molecular biology, and biochemical processes
            </p>
          </div>
        </section>

        {/* Search & Filter Section */}
        <section className="glossary-controls">
          <div className="search-box">
            <i className="fa-solid fa-search"></i>
            <input
              type="text"
              placeholder="Search terms, definitions, examples..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                className="clear-search"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            )}
          </div>

          <div className="category-filters">
            <label>Filter by Category:</label>
            <div className="filter-buttons">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`filter-btn ${selectedCategory === category ? "active" : ""}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === "all" ? "All Categories" : category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Results Count */}
        <section className="glossary-stats">
          <p>
            Showing <strong>{filteredTerms.length}</strong> of <strong>{glossaryData.terms.length}</strong> terms
            {searchTerm && <span> matching "<strong>{searchTerm}</strong>"</span>}
            {selectedCategory !== "all" && <span> in <strong>{selectedCategory}</strong></span>}
          </p>
        </section>

        {/* Terms List */}
        <section className="glossary-terms">
          {filteredTerms.length > 0 ? (
            <div className="terms-grid">
              {filteredTerms.map((term, idx) => (
                <TermCard key={idx} term={term} searchTerm={searchTerm} />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <i className="fa-solid fa-search"></i>
              <h3>No terms found</h3>
              <p>
                Try different search keywords or select "All Categories" to expand your results.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const TermCard = ({ term, searchTerm }) => {
  const [expanded, setExpanded] = useState(false);

  // Highlight search term in text
  const highlightText = (text) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, idx) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={idx}>{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="term-card">
      <div className="term-header" onClick={() => setExpanded(!expanded)}>
        <h3 className="term-title">{highlightText(term.term)}</h3>
        <div className="term-meta">
          <span className="term-category">{term.category}</span>
          <i className={`fa-solid fa-chevron-down ${expanded ? "expanded" : ""}`}></i>
        </div>
      </div>

      {expanded && (
        <div className="term-content">
          <div className="term-definition">
            <h4>Definition</h4>
            <p>{highlightText(term.definition)}</p>
          </div>

          {term.example && (
            <div className="term-example">
              <h4>Example</h4>
              <p>{highlightText(term.example)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlossaryPage;
