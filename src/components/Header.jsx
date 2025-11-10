import React, { useState, useEffect, useRef } from "react";
import logo from "../assets/DoubletickLogo.png";
import testFilterLogo from "../assets/test_Filter.svg";
import testSearchLogo from "../assets/test_Search.svg";

// Number formatter for displaying total count with commas
const formatter = new Intl.NumberFormat("en-US");

// GitHub icon SVG component
const GitHubIcon = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ display: "block" }}
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

export function Header({ searchTerm, onSearchChange, totalCount }) {
  // State for filter dropdown visibility
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterRef]);

  return (
    <>
      {/* Top header with logo and GitHub link */}
      <div className="header">
        <img src={logo} width={200} alt="Logo" />
        <a
          href="https://github.com/JayTandia"
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
          aria-label="GitHub repository"
        >
          Check out my GitHub (Jay Tandia)
          <GitHubIcon size={24} />
        </a>
      </div>

      {/* Section header with title, count badge, and controls */}
      <div className="section-header">
        <div className="section-title">
          <h1>All Customers</h1>
          {/* Display formatted total count or loading indicator */}
          <span className="badge">
            {totalCount > 0 ? formatter.format(totalCount) : "..."}
          </span>
        </div>

        {/* Search and filter controls */}
        <div className="controls">
          {/* Search input with icon */}
          <div className="search-box">
            <img src={testSearchLogo} alt="Search" className="search-icon" />
            <input
              type="text"
              placeholder="Search Customers"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Filter button with dropdown */}
          <div style={{ position: "relative" }} ref={filterRef}>
            <button
              className="filter-btn"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <img src={testFilterLogo} alt="Filter" className="filter-icon" />
              Add Filters
            </button>
            {/* Filter dropdown menu */}
            <div
              className={
                isFilterOpen ? "filter-dropdown show" : "filter-dropdown"
              }
            >
              <div className="filter-item"> Filter 1</div>
              <div className="filter-item"> Filter 2</div>
              <div className="filter-item"> Filter 3</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
