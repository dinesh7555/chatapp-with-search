import { useState, useEffect, useRef } from "react";
import "./SkillProficiency.css";

/* ── Subject mastery scores — replace with real API values ── */
const MASTERY_DATA = {
    operating_systems:   { mastery: 35 },
    computer_networks:   { mastery: 60 },
    data_structures:    { mastery: 20 },
    database_management: { mastery: 10 },
};

const SUBJECTS = ["operating_systems", "computer_networks", "data_structures", "database_management"];

const SUBJECT_ICONS = {
    operating_systems:   "💻",
    computer_networks:   "🌐",
    data_structures:    "🌲",
    database_management: "🗄️",
};

/* ── Animated counter ── */
const CountUp = ({ target, duration = 900 }) => {
    const [val, setVal] = useState(0);
    const raf = useRef(null);
    useEffect(() => {
        setVal(0);
        const start = performance.now();
        const tick = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(Math.round(target * eased));
            if (p < 1) raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf.current);
    }, [target]);
    return <>{val}</>;
};

/* ── Circular ring — accent colour throughout ── */
const MasteryRing = ({ mastery, size = 80, stroke = 8 }) => {
    const [animated, setAnimated] = useState(false);
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const dash = animated ? (mastery / 100) * circ : 0;

    useEffect(() => {
        setAnimated(false);
        const t = setTimeout(() => setAnimated(true), 60);
        return () => clearTimeout(t);
    }, [mastery]);

    return (
        <div className="sp-ring-wrap" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={size / 2} cy={size / 2} r={r}
                    fill="none" stroke="rgba(160,130,90,0.18)" strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={r}
                    fill="none" stroke="var(--accent, #c47c2b)" strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ}`}
                    style={{ transition: "stroke-dasharray 0.9s cubic-bezier(0.16,1,0.3,1)" }}
                />
            </svg>
            {/* Percentage — one tight inline unit, perfectly centred */}
            <div className="sp-ring-inner">
                <span className="sp-ring-text">
                    <span className="sp-ring-num">
                        <CountUp key={mastery} target={mastery} />
                    </span>
                    <span className="sp-ring-pct">%</span>
                </span>
            </div>
        </div>
    );
};

/* ── Main Component ── */
const SkillProficiency = () => {
    const [selected, setSelected] = useState("operating_systems");
    const [open, setOpen] = useState(false);
    const dropRef = useRef(null);

    const { mastery } = MASTERY_DATA[selected];

    const statusLabel =
        mastery >= 70 ? "🏆 Advanced" :
        mastery >= 45 ? "📈 Intermediate" :
        mastery >= 25 ? "📘 Developing" : "🌱 Beginner";

    const statusNote =
        mastery >= 70 ? "Excellent work!" :
        mastery >= 45 ? "Keep it up!" :
        mastery >= 25 ? "Making progress" : "Just getting started";

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <section className="skill-proficiency-block">

            {/* ── Header row: title + dropdown ── */}
            <div className="sp-header">
                <div>
                    <h2 className="sp-title">Skill Proficiency</h2>
                    <span className="sp-subtitle">Select a subject to view your mastery score</span>
                </div>

                {/* Subject dropdown */}
                <div className="sp-selector" ref={dropRef}>
                    <button className="sp-selector-btn" onClick={() => setOpen(v => !v)}>
                        <span className="sp-sel-icon">{SUBJECT_ICONS[selected]}</span>
                        <span className="sp-sel-name">
                            {selected.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                        <span className={`sp-sel-caret ${open ? "open" : ""}`}>▾</span>
                    </button>

                    {open && (
                        <ul className="sp-dropdown">
                            {SUBJECTS.map((s) => (
                                <li
                                    key={s}
                                    className={`sp-dropdown-item ${s === selected ? "active" : ""}`}
                                    onClick={() => { setSelected(s); setOpen(false); }}
                                >
                                    <span>{SUBJECT_ICONS[s]}</span>
                                    <span>{s.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                                    {s === selected && <span className="sp-check">✓</span>}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* ── Mastery card ── */}
            <div className="sp-card" key={selected}>

                {/* Ring + subject name */}
                <div className="sp-card-top">
                    <MasteryRing key={selected} mastery={mastery} size={82} stroke={9} />
                    <div className="sp-card-meta">
                        <div className="sp-card-subject">
                            {SUBJECT_ICONS[selected]}&nbsp;
                            {selected.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </div>
                        <div className="sp-card-desc">Overall Mastery Score</div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="sp-bar-section">
                    <div className="sp-bar-labels">
                        <span>0%</span>
                        <span className="sp-bar-current">
                            <CountUp key={`bar-${mastery}`} target={mastery} />%
                        </span>
                        <span>100%</span>
                    </div>
                    <div className="sp-bar-track">
                        <div className="sp-bar-fill" style={{ width: `${mastery}%` }} />
                    </div>
                </div>

                {/* Badge */}
                <div className="sp-badge-row">
                    <span className="sp-badge">{statusLabel}</span>
                    <span className="sp-status-note">{statusNote}</span>
                </div>

            </div>
        </section>
    );
};

export default SkillProficiency;