import React from "react";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
} from "recharts";
import "./CompetencyRadar.css";

const data = [
    { subject: "Programming", score: 85, fullMark: 100 },
    { subject: "DSA", score: 90, fullMark: 100 },
    { subject: "System Design", score: 45, fullMark: 100 },
    { subject: "ML", score: 70, fullMark: 100 },
    { subject: "Math", score: 80, fullMark: 100 },
];

const CompetencyRadar = () => {
    return (
        <div className="cr-card">
            <h3 className="cr-title">Engineering Competencies</h3>

            <div className="cr-chart-container">
                <ResponsiveContainer width="100%" height={260}>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                        <PolarGrid stroke="var(--border-strong)" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: "var(--ink-soft)", fontSize: 11, fontWeight: 600 }}
                        />
                        <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={false}
                            axisLine={false}
                        />
                        <Radar
                            name="Student"
                            dataKey="score"
                            stroke="var(--accent)"
                            strokeWidth={2}
                            fill="var(--accent)"
                            fillOpacity={0.15}
                        />
                        {/* Dot markers on data points */}
                        <Radar
                            dataKey="score"
                            fill="var(--surface)"
                            stroke="var(--accent)"
                            strokeWidth={2}
                            activeDot={{ r: 4 }}
                            dot={{ r: 3, fill: "var(--surface)", strokeWidth: 2 }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className="cr-insight">
                <div className="cr-insight-icon">💡</div>
                <div className="cr-insight-text">
                    <span className="cr-insight-label">AI Insight</span>
                    <p>
                        Your System Design score is below branch avg. Try the HLD module.
                    </p>
                </div>
            </div>

            <button className="cr-improve-btn">Improve Skills →</button>
        </div>
    );
};

export default CompetencyRadar;
