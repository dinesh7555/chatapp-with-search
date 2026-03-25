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

      <div className="qs-mini-stats">
        <div className="qs-mini-stat">
          <span className="qs-mini-value">4/6</span>
          <span className="qs-mini-label">Lessons</span>
        </div>
        <div className="qs-mini-divider"></div>
        <div className="qs-mini-stat">
          <span className="qs-mini-value">2/3</span>
          <span className="qs-mini-label">Quizzes</span>
        </div>
        <div className="qs-mini-divider"></div>
        <div className="qs-mini-stat">
          <span className="qs-mini-value">3/5</span>
          <span className="qs-mini-label">Labs</span>
        </div>
      </div>

      <div className="qs-milestone-card">
        <span className="qs-milestone-label">Next Milestone</span>
        <h4 className="qs-milestone-title">"Neural Net Ninja" Badge</h4>
        <span className="qs-milestone-subtitle">2 more units to go!</span>
        <div className="qs-milestone-dots">
          <span className="qs-dot filled"></span>
          <span className="qs-dot filled"></span>
          <span className="qs-dot empty"></span>
        </div>
      </div>
    </div>
  );
};

export default QuickStats;
