import { useState, useEffect } from "react";
import { getActivityStats } from "../services/api";
import "./QuickStats.css";

const QuickStats = () => {
  const [stats, setStats] = useState({
    current_streak: 0,
    daily_study_time: 0,
    total_study_time: 0
  });
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;
      try {
        const data = await getActivityStats(token);
        if (data && !data.detail) {
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch activity stats", err);
      } finally {
        setLoading(setLoading(false));
      }
    };

    fetchStats();
    // Refresh stats every 2 minutes to show updated study time
    const interval = setInterval(fetchStats, 120000);
    return () => clearInterval(interval);
  }, [token]);

  if (loading) return <div className="qs-loading">Loading stats...</div>;

  return (
    <div className="qs-container">
      <div className="qs-header">
        <span className="qs-header-icon">📈</span>
        <h3 className="qs-title">Quick Stats</h3>
      </div>

      <div className="qs-streak-card">
        <div className="qs-streak-icon">🔥</div>
        <div className="qs-streak-info">
          <span className="qs-label">STREAK</span>
          <span className="qs-value">{stats.current_streak} Days</span>
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
