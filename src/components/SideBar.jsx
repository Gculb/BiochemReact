import React, { useEffect } from "react";
import { NavLink } from "react-router-dom";
import navButtons from "../data/navButtons.json";
import categoriesData from "../data/categories.json";
import "./SideBar.css";

const SideBar = ({ collapsed, setCollapsed }) => {
  
useEffect(() => {
  if (window.innerWidth < 900) setCollapsed(true);
    }, []);

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

      {navButtons.map((group) => (
        <nav key={group.label} className="sidebar-group">
          {!collapsed && <h3 className="group-label">{group.label}</h3>}

          <ul className="group-list">
            {group.ids.map((id) => {
              const category = categoriesData.categories.find((c) => c.id === id);
              if (!category) return null;

              const to = id === "home" ? "/" : `/${id}`;

              return (
                <li key={id}>
                  <NavLink to={to} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} >
                    <span
                      className="nav-icon"
                      style={{ color: category.color }}
                    >
                      <i className={`fa-solid ${category.icon}`} />
                    </span>

                    {!collapsed && (
                      <span className="nav-text">{category.title}</span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      ))}
    </aside>
  );
};

export default SideBar;
