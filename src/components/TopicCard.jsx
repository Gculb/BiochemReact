import React, { useState } from "react";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import "./TopicCard.css";

// Utility function to parse text and render math expressions
const renderWithMath = (text) => {
  if (!text) return text;

  const blockMathRegex = /\$\$(.*?)\$\$/g;
  const inlineMathRegex = /\$(.*?)\$/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;

  // First pass: extract block math
  const blockMatches = [];
  while ((match = blockMathRegex.exec(text)) !== null) {
    blockMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      content: match[1],
      type: "block"
    });
  }

  // Second pass: extract inline math (avoiding block math)
  const inlineMatches = [];
  blockMathRegex.lastIndex = 0;
  while ((match = inlineMathRegex.exec(text)) !== null) {
    const isInsideBlock = blockMatches.some(
      b => match.index >= b.start && match.index < b.end
    );
    if (!isInsideBlock) {
      inlineMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
        type: "inline"
      });
    }
  }

  const allMatches = [...blockMatches, ...inlineMatches].sort((a, b) => a.start - b.start);

  allMatches.forEach((m, idx) => {
    if (m.start > lastIndex) {
      parts.push(text.substring(lastIndex, m.start));
    }
    if (m.type === "block") {
      parts.push(<BlockMath key={`math-${idx}`}>{m.content}</BlockMath>);
    } else {
      parts.push(<InlineMath key={`math-${idx}`}>{m.content}</InlineMath>);
    }
    lastIndex = m.end;
  });

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
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
          {topic.details && (
            <div className="topic-card__details">
              <p>{renderWithMath(topic.details)}</p>
            </div>
          )}
        </div>
      )}
    </article>
  );
};

export default TopicCard;
