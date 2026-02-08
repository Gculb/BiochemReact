import React, { useState } from "react";
import { InlineMath, BlockMath } from "react-katex";
import "./TopicCard.css";

const stripKatexDelimiters = (latex) =>
  latex
    .replace(/^\\\[/, "")
    .replace(/\\\]$/, "")
    .trim();
 
const renderWithMath = (text) => {
  if (!text) return null;

  // FULL block LaTeX (your metabolic pathways)
  if (text.trim().startsWith("\\begin{")) {
    return <BlockMath math={text} />;
  }

  const blockMathRegex = /\$\$(.*?)\$\$/gs;
  const inlineMathRegex = /\$(.*?)\$/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = blockMathRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <BlockMath key={match.index} math={match[1]} />
    );
    lastIndex = match.index + match[0].length;
  }

  const remaining = text.substring(lastIndex);
  let inlineLast = 0;

  while ((match = inlineMathRegex.exec(remaining)) !== null) {
    if (match.index > inlineLast) {
      parts.push(remaining.substring(inlineLast, match.index));
    }
    parts.push(
      <InlineMath key={`inline-${match.index}`} math={match[1]} />
    );
    inlineLast = match.index + match[0].length;
  }

  if (inlineLast < remaining.length) {
    parts.push(remaining.substring(inlineLast));
  }

  return parts;
};


const TopicCard = ({ topic, categoryColor }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <article
      className={`topic-card ${isExpanded ? "topic-card--expanded" : ""}`}
      onClick={toggleExpand}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleExpand();
        }
      }}
    >
      <header
        className="topic-card__header"
        style={{ borderLeftColor: topic.important ? categoryColor : "#ddd" }}
      >
        <h3 className="topic-card__title" style={{ color: topic.important ? categoryColor : "#2c3e50" }}>
          <span className="topic-card__text">
            {topic.title}
            {topic.important && <span className="topic-card__badge">⭐</span>}
          </span>
          <span className="topic-card__toggle" aria-hidden="true">
            {isExpanded ? "▼" : "▶"}
          </span>
        </h3>
      </header>

      {isExpanded && (
        <div className="topic-card__content">
          {topic.summary && (
            <p className="topic-card__summary">{renderWithMath(topic.summary)}</p>
          )}
          <div className="topic-card__details">
            {topic.render === "katex" ? (
              <BlockMath math={stripKatexDelimiters(topic.details)} />
            ) : (
              renderWithMath(topic.details)
            )}
          </div>
        </div>
      )}
    </article>
  );
};

export default TopicCard;
