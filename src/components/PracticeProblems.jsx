import React, { useState } from "react";
import problems from "../data/problems.json";
import "./PracticeProblems.css"

const PracticeProblems = () => {
  const [visible, setVisible] = useState({});

  const toggle = (id, field) => {
    setVisible((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: !prev[id]?.[field]
      }
    }));
  };

  return (
    <div className="page">
      <h1>Practice Problems</h1>

      {problems.map((p) => (
        <div key={p.id} className="problem-card">
          <h3>{p.title}</h3>

          <p><strong>Category:</strong> {p.category}</p>
          <p><strong>Difficulty:</strong> {p.difficulty}</p>

          <p>{p.question}</p>

          {/* Hint button */}
          <button className = "hintButton"  onClick={() => toggle(p.id, "hint")}>
            {visible[p.id]?.hint ? "Hide Hint" : "Reveal Hint"}
          </button>

          {visible[p.id]?.hint && (
            <div className="hint">
              <strong>Hint:</strong> {p.hint}
            </div>
          )}

          {/* Solution button */}
          <button className = "solutionButton"  onClick={() => toggle(p.id, "solution")}>
            {visible[p.id]?.solution ? "Hide Solution" : "Reveal Solution"}
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
 