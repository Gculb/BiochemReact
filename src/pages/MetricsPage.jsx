import React from "react";
import categoriesData from "../data/categories.json";
import topicCardsData from "../data/topicCards.json";
import problemsData from "../data/problems.json";
import "./MetricsPage.css";

const MetricsPage = () => {
  const categories = categoriesData.categories.filter((category) => category.id !== "home");
  const topicCards = topicCardsData.topicSections.flatMap((section) => section.cards || []);
  const importantTopics = topicCards.filter((topic) => topic.important);
  const practiceProblems = Array.isArray(problemsData) ? problemsData : problemsData.problems || [];
  const learningTools = categories.filter((category) =>
    ["viewer", "protein-viewer", "lab", "problems", "resources", "glossary"].includes(category.id)
  );

  const metrics = [
    {
      label: "Learning Categories",
      value: categories.length,
      icon: "fa-layer-group",
      detail: "Course and support pages available from the guide."
    },
    {
      label: "Topic Cards",
      value: topicCards.length,
      icon: "fa-list-check",
      detail: "Expandable concept notes across the curriculum."
    },
    {
      label: "High-Yield Concepts",
      value: importantTopics.length,
      icon: "fa-star",
      detail: "Topics marked as priority review targets."
    },
    {
      label: "Practice Problems",
      value: practiceProblems.length,
      icon: "fa-pen-to-square",
      detail: "Worked prompts for calculation and reasoning practice."
    }
  ];

  const coverageGroups = [
    {
      label: "Chemistry",
      ids: ["genchem", "genchemlab", "ochem", "ochem-lab", "analytical", "inorganic", "physical"],
      color: "#ff8a65"
    },
    {
      label: "Biology",
      ids: ["genbio", "molbio", "microbio", "genetics", "bioinformatics", "cell-biology", "cell-physiology", "immunology", "neurobiology"],
      color: "#4fd3a6"
    },
    {
      label: "Biochemistry",
      ids: ["biochem1", "biochem2", "biochem-lab", "metabolic-cycles"],
      color: "#ff9fad"
    },
    {
      label: "Quantitative",
      ids: ["calculus", "stats", "physics"],
      color: "#7ec8f8"
    }
  ];

  const totalCoverageIds = coverageGroups.reduce((sum, group) => sum + group.ids.length, 0);
  const legacyLatencyMs = 1479;
  const currentLatencyMs = 916;
  const latencyImprovement = Math.round(((legacyLatencyMs - currentLatencyMs) / legacyLatencyMs) * 100);
  const comparisonRows = [
    {
      label: "Navigation Model",
      legacy: "Single long GitHub Pages document",
      current: "Routed React pages with focused sections"
    },
    {
      label: "Protein Tools",
      legacy: "Small molecule viewer only",
      current: "RCSB-backed protein viewer with metadata, sequence, active sites, and AlphaFold mode"
    },
    {
      label: "Bioinformatics",
      legacy: "Referenced as a roadmap topic",
      current: "Dedicated category plus runnable GC-content coding practice"
    },
    {
      label: "Practice Depth",
      legacy: "Practice problem section",
      current: `${practiceProblems.length} structured practice prompts plus interactive coding and lab tools`
    },
    {
      label: "Curriculum Scope",
      legacy: "Core chemistry, biology, biochemistry, and support pages",
      current: `${categories.length} learning/support pages across chemistry, biology, biochemistry, quantitative work, tools, and metrics`
    }
  ];
  const featureWins = [
    "Metrics dashboard",
    "RCSB protein fetching",
    "AlphaFold structure loading",
    "Bioinformatics Python practice runner",
    "Expanded biology modules",
    "MCAT prep section",
    "Metabolic cycles section",
    "Critical concepts blocks",
    "Richer practice bank",
    "Cleaner routed sidebar navigation"
  ];

  return (
    <div className="metrics-page">
      <div className="metrics-page__container">
        <header className="metrics-page__hero">
          <div>
            <p className="metrics-page__eyebrow">Site Metrics</p>
            <h1>Biochem Guide Metrics</h1>
            <p>
              A compact dashboard for tracking learning coverage, priority concepts, practice depth,
              and the interactive tools built into the site.
            </p>
          </div>
          <div className="metrics-page__pulse" aria-hidden="true">
            <span>{Math.round((importantTopics.length / Math.max(topicCards.length, 1)) * 100)}%</span>
            <small>high-yield density</small>
          </div>
        </header>

        <section className="metrics-page__grid" aria-label="Summary metrics">
          {metrics.map((metric) => (
            <article className="metrics-card" key={metric.label}>
              <div className="metrics-card__icon">
                <i className={`fa-solid ${metric.icon}`} />
              </div>
              <div>
                <p className="metrics-card__label">{metric.label}</p>
                <strong>{metric.value}</strong>
                <p>{metric.detail}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="metrics-panel metrics-upgrade">
          <div className="metrics-panel__header">
            <div>
              <p className="metrics-page__eyebrow">Upgrade Showcase</p>
              <h2>Current Site vs Legacy Site</h2>
            </div>
            <a href="https://gculb.github.io/Biochemical/" target="_blank" rel="noopener noreferrer">
              View legacy site
            </a>
          </div>

          <div className="latency-comparison" aria-label="Latency comparison">
            <article>
              <span>Legacy GitHub Pages</span>
              <strong>{legacyLatencyMs} ms</strong>
              <small>Average cache-busted browser navigation</small>
            </article>
            <article className="latency-comparison__winner">
              <span>Current React App</span>
              <strong>{currentLatencyMs} ms</strong>
              <small>{latencyImprovement}% faster in local benchmark</small>
            </article>
          </div>

          <div className="comparison-table" role="table" aria-label="Feature comparison">
            {comparisonRows.map((row) => (
              <div className="comparison-row" role="row" key={row.label}>
                <div role="cell">
                  <strong>{row.label}</strong>
                </div>
                <div role="cell">
                  <span>Before</span>
                  <p>{row.legacy}</p>
                </div>
                <div role="cell">
                  <span>Now</span>
                  <p>{row.current}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="feature-wins">
            {featureWins.map((feature) => (
              <span key={feature}>
                <i className="fa-solid fa-check" aria-hidden="true" />
                {feature}
              </span>
            ))}
          </div>

          <p className="benchmark-note">
            Benchmark note: latency values are from three cache-busted in-app browser navigations during this session.
            The current app was measured locally on localhost, while the legacy site was measured from GitHub Pages, so
            the numbers are directional rather than a production CDN-to-CDN audit.
          </p>
        </section>

        <section className="metrics-panel">
          <div className="metrics-panel__header">
            <div>
              <p className="metrics-page__eyebrow">Coverage Map</p>
              <h2>Curriculum Balance</h2>
            </div>
            <span>{totalCoverageIds} mapped course areas</span>
          </div>
          <div className="coverage-list">
            {coverageGroups.map((group) => {
              const percentage = Math.round((group.ids.length / totalCoverageIds) * 100);

              return (
                <div className="coverage-row" key={group.label}>
                  <div className="coverage-row__label">
                    <span>{group.label}</span>
                    <strong>{group.ids.length} areas</strong>
                  </div>
                  <div className="coverage-row__track">
                    <span style={{ width: `${percentage}%`, background: group.color }} />
                  </div>
                  <small>{percentage}%</small>
                </div>
              );
            })}
          </div>
        </section>

        <section className="metrics-page__columns">
          <article className="metrics-panel">
            <div className="metrics-panel__header">
              <div>
                <p className="metrics-page__eyebrow">Tooling</p>
                <h2>Interactive Pages</h2>
              </div>
            </div>
            <div className="tool-list">
              {learningTools.map((tool) => (
                <div className="tool-list__item" key={tool.id}>
                  <span style={{ color: tool.color }}>
                    <i className={`fa-solid ${tool.icon}`} />
                  </span>
                  <div>
                    <strong>{tool.title}</strong>
                    <p>{tool.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="metrics-panel">
            <div className="metrics-panel__header">
              <div>
                <p className="metrics-page__eyebrow">Study Signal</p>
                <h2>Highest Priority Sections</h2>
              </div>
            </div>
            <div className="priority-list">
              {importantTopics.slice(0, 8).map((topic) => (
                <span key={`${topic.id}-${topic.title}`}>{topic.title}</span>
              ))}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
};

export default MetricsPage;
