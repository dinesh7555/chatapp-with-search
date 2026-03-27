import React from "react";
import "./QuickStats.css";

const QuickStats = () => {
  return (
    <div className="qs-container">
      <div className="qs-header">
        <span className="qs-header-icon">📈</span>
        <h3 className="qs-title">Quick Stats</h3>
      </div>

      <div className="qs-streak-card">
        <div className="qs-streak-icon">🔥</div>
        <div className="qs-streak-info">
          <span className="qs-label">TODAY'S STREAK</span>
          <span className="qs-value">7 Days</span>
        </div>
      </div>

      <div className="qs-rank-card">
        <div className="qs-rank-info">
          <span className="qs-label">CLASS RANK</span>
          <span className="qs-value">
            <span className="qs-highlight">#12</span> / 63
          </span>
        </div>
        <div className="qs-rank-icon">🏆</div>
      </div>

    </div>
  );
};

export default QuickStats;
