import React, { useState, useMemo } from "react";
import problems from "../data/problems.json";
import imageRegistry from "../data/imageRegistry";
import multipleChoiceProblems from "../data/multipleChoiceProblems.json"
import "./PracticeProblems.css"


const PracticeProblems = () => {
  const [visible, setVisible] = useState({});
  const [count, setCount] = useState(5);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isShuffled, setIsShuffled] = useState(false);
  const [completed, setCompleted] = useState(() => {
    const saved = localStorage.getItem("completedProblems");
    return saved ? JSON.parse(saved) : {};
  });
const selectChoice = (problemId, choiceLabel, correctChoice) => {
  setSelectedAnswers((prev) => ({
    ...prev,
    [problemId]: choiceLabel,
  }));

  
  if (choiceLabel === correctChoice && !completed[problemId]) {
    toggleCompleted(problemId);
  }
};

const allProblems = useMemo(() => {
  return [...problems, ...multipleChoiceProblems];
}, []);
  const toggle = (id, field) => {
    setVisible((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: !prev[id]?.[field]
      }
    }));
  };

  const toggleCompleted = (id) => {
    setCompleted((prev) => {
      const updated = {
        ...prev,
        [id]: !prev[id],
      };
      localStorage.setItem(
        "completedProblems",
        JSON.stringify(updated)
      );
      return updated;
    });
  };
    const resetCompletion = () => {
    localStorage.removeItem("completedProblems");
    setCompleted({});
  };


const categories = useMemo(() => {
  const cats = ["all", ...new Set(allProblems.map((p) => p.category))];
  return cats.sort((a, b) => (a === "all" ? -1 : b === "all" ? 1 : a.localeCompare(b)));
}, []);

// Filtered problems
const filteredProblems = useMemo(() => {
  return allProblems.filter(
    (p) => selectedCategory === "all" || p.category === selectedCategory
  );
}, [selectedCategory, allProblems]);

  const displayProblems = useMemo(() => {
    if (!isShuffled) return filteredProblems;
    
    // Fisher-Yates shuffle
    const arr = [...filteredProblems];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [filteredProblems, isShuffled]);

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

      <p style={{ color: "#666" }}>
        Completed {filteredProblems.filter((p) => completed[p.id]).length} / {filteredProblems.length} problems
      </p>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          className="resetButton"
          onClick={resetCompletion}
        >
          <i className="fa-solid fa-rotate-left" />
          Reset Completion
        </button>
        <button
          className="shuffleButton"
          onClick={() => setIsShuffled(!isShuffled)}
        >
          <i className="fa-solid fa-shuffle" />
          Shuffle
        </button>
      </div>
      {displayProblems.slice(0, count).map((p) => (
        <div
              key={p.id}
              className={`problem-card ${completed[p.id] ? "completed" : ""}`}
            >
          <h3>{p.title}</h3>
          <div className="problem-meta">

            <span className="badge category">{p.category}</span>
            <span className={`badge difficulty ${p.difficulty.toLowerCase()}`}>
              {p.difficulty}
            </span>
          </div>

          <p>{p.question}</p>
            {p.image && (
              <div className="problem-image">
                <img
                  src={imageRegistry[p.image]}
                  alt={`${p.title} diagram`}
                />
              </div>
            )}


      {p.type === "multiple_choice" && (
        <div className="choices">
          {p.choices.map((c) => {
            const selected = selectedAnswers[p.id] === c.label;
            const isCorrect = c.label === p.correct_choice;

            return (
              <button
                key={c.label}
                className={`choiceButton
                  ${selected && isCorrect ? "correct" : ""}
                  ${selected && !isCorrect ? "incorrect" : ""}
                `}
                onClick={() => selectChoice(p.id, c.label, p.correct_choice)}
              >
                <strong>{c.label}.</strong> {c.text}
              </button>
            );
          })}
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
              <button
              type="button"
              className={`completeButton ${completed[p.id] ? "done" : ""}`}
              onClick={() => toggleCompleted(p.id)}
            >
              <span>
                <i className={`fa-solid ${completed[p.id] ? "fa-check-circle" : "fa-circle"}`} />
                {completed[p.id] ? "Completed" : "Mark as Complete"}
              </span>
            </button>
          {visible[p.id]?.solution && (
            <div className="solution">
              {p.type === "multiple_choice" ? (
                <>
                  <strong>Correct Answer:</strong> {p.correct_choice}
                  <br />
                  <strong>Explanation:</strong> {p.solution}
                </>
              ) : (
                <>
                  <strong>Answer:</strong> {p.answer}
                  <br />
                  <strong>Explanation:</strong> {p.solution}
                </>
              )}
            </div>
          )}

        </div>
      ))}
    </div>
  );
};

export default PracticeProblems;
 