import React, { useState, useMemo } from "react";
import problems from "../data/problems.json";
import "./PracticeProblems.css"

const PracticeProblems = () => {
  const [visible, setVisible] = useState({});
  const [count, setCount] = useState(5);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const toggle = (id, field) => {
    setVisible((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: !prev[id]?.[field]
      }
    }));
  };

  const categories = useMemo(() => {
    const cats = ["all", ...new Set(problems.map((p) => p.category))];
    return cats.sort((a, b) => (a === "all" ? -1 : b === "all" ? 1 : a.localeCompare(b)));
  }, []);

  const filteredProblems = useMemo(() => {
    return problems.filter((p) =>
      selectedCategory === "all" || p.category === selectedCategory
    );
  }, [selectedCategory]);

  const shuffled = useMemo(() => [...filteredProblems].sort(() => Math.random() - 0.5), [filteredProblems]); 
  return (
    <div className="page">
      <div className="filter-section">
        <div className="filter-group">
          <label>Subject/Category:</label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Problems to practice:</label>
          <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={filteredProblems.length}>All</option>
          </select>
        </div>
      </div>

      <p style={{ marginBottom: "1rem", color: "#666" }}>
  Showing {Math.min(count, filteredProblems.length)} of {filteredProblems.length} problems
          </p>

      {shuffled.slice(0, count).map((p) => (
        <div key={p.id} className="problem-card">
          <h3>{p.title}</h3>
          <div className="problem-meta">
            <span className="badge category">{p.category}</span>
            <span className={`badge difficulty ${p.difficulty.toLowerCase()}`}>
              {p.difficulty}
            </span>
          </div>

          <p>{p.question}</p>
          {p.image_url && (
          <div className="problem-image">
            <img
              src={process.env.PUBLIC_URL + "/" + p.image_url}
              alt={`${p.title} diagram`}
            />
          </div>
        )}
          {/* Hint button */}
          <button
            className="hintButton"
            onClick={() => toggle(p.id, "hint")}
          >
            
            <span>
              {visible[p.id]?.hint ? "Hide Hint" : "Reveal Hint"}
              <i className={`fa-solid ${visible[p.id]?.hint ? "fa-eye-slash" : "fa-lightbulb"}`} />
            </span>
          </button>

          {visible[p.id]?.hint && (
            <div className="hint">
              <strong>Hint:</strong> {p.hint}
            </div>
          )}

          {/* Solution button */}
          <button
            className="solutionButton"
            onClick={() => toggle(p.id, "solution")}
          >

            <span>
              {visible[p.id]?.solution ? "Hide Solution" : "Reveal Solution"}
              <i className={`fa-solid ${visible[p.id]?.solution ? "fa-eye-slash" : "fa-circle-check"}`} />
            </span>
          </button>


          {visible[p.id]?.solution && (
            <div className="solution">
              <strong>Answer:</strong> {p.answer}
              <br />
              <strong>Explanation:</strong> {p.solution}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PracticeProblems;
 