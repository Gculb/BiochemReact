import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import navButtons from "../data/navButtons.json";
import categoriesData from "../data/categories.json";
import "./SideBar.css";

const SideBar = ({ collapsed, setCollapsed }) => {
  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedCollapsableGroups, setExpandedCollapsableGroups] = useState({});

  useEffect(() => {
    const onResize = () => setCollapsed(window.innerWidth < 900);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [setCollapsed]);

  const toggleGroup = (groupKey) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const toggleCollapsableGroup = (groupLabel) => {
    setExpandedCollapsableGroups((prev) => ({
      ...prev,
      [groupLabel]: !prev[groupLabel],
    }));
  };

  const renderNavItem = (id) => {
    const category = categoriesData.categories.find((c) => c.id === id);
    if (!category) return null;

    const to = id === "home" ? "/" : `/${id}`;

    return (
      <li key={id}>
        <NavLink
          to={to}
          data-tooltip={category.title}
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <span className="nav-icon" style={{ color: category.color }}>
            <i className={`fa-solid ${category.icon}`} />
          </span>
          {!collapsed && (
            <span className="nav-text">{category.title}</span>
          )}
        </NavLink>
      </li>
    );
  };

  const renderNestedItem = (item, parentKey) => {
   
    if (typeof item === "string") {
      return renderNavItem(item);
    }

    if (item.id) {
      return renderNavItem(item.id);
    }

    if (item.parentLabel && item.ids) {
      const groupKey = `${parentKey}-${item.parentLabel}`;
      const isExpanded = expandedGroups[groupKey] !== false;

      return (
        <li key={groupKey} className="nested-group">
          <button
            className="nested-group-toggle"
            onClick={() => toggleGroup(groupKey)}
            aria-expanded={isExpanded}
          >
            <span className="toggle-icon">
              <i className={`fa-solid ${isExpanded ? "fa-chevron-down" : "fa-chevron-right"}`} />
            </span>
            {!collapsed && <span className="nested-label">{item.parentLabel}</span>}
          </button>

          {isExpanded && (
            <ul className="nested-items">
              {item.ids.map((childId) => renderNavItem(childId))}
            </ul>
          )}
        </li>
      );
    }

    return null;
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        {!collapsed && <h2 className="sidebar-title">Biochem Guide</h2>}

        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle sidebar"
        >
          <i className={`fa-solid ${collapsed ? "fa-chevron-right" : "fa-chevron-left"}`} />
        </button>
      </div>

      {navButtons.map((group) => {
        const isCollapsableGroupExpanded = expandedCollapsableGroups[group.label] !== false;

        return (
          <nav key={group.label} className="sidebar-group">
            {group.collapsable ? (
              <button
                className="collapsable-group-header"
                onClick={() => toggleCollapsableGroup(group.label)}
                aria-expanded={isCollapsableGroupExpanded}
              >
                <span className="collapsable-toggle-icon">
                  <i className={`fa-solid ${isCollapsableGroupExpanded ? "fa-chevron-down" : "fa-chevron-right"}`} />
                </span>
                {!collapsed && <h3 className="group-label">{group.label}</h3>}
              </button>
            ) : (
              !collapsed && <h3 className="group-label">{group.label}</h3>
            )}

            {isCollapsableGroupExpanded && (
              <ul className="group-list">
                {/* Handle both simple ids and nested children */}
                {group.ids &&
                  group.ids.map((item) =>
                    typeof item === "string" ? renderNavItem(item) : renderNestedItem(item, group.label)
                  )}

                {/* Handle nested children structure */}
                {group.children &&
                  group.children.map((item) => renderNestedItem(item, group.label))}
              </ul>
            )}
          </nav>
        );
      })}
    </aside>
  );
};

export default SideBar;
