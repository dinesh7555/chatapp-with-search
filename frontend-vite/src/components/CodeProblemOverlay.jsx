import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { runCode as apiRunCode } from "../services/api";
import "./CodeProblemOverlay.css";

const CodeProblemOverlay = ({ problem, onSubmit, submitting }) => {
    const [code, setCode] = useState(problem.initial_code || "");
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState([
        { type: "system", text: "Ready for execution." }
    ]);
    
    const subjectId = problem.subject_id || "javascript";
    const token = localStorage.getItem("token");

    const runCode = async () => {
        setIsRunning(true);
        const newOutput = [];

        if (subjectId === "javascript") {
            const originalConsoleLog = console.log;
            const originalConsoleError = console.error;

            console.log = (...args) => {
                newOutput.push({
                    type: "log",
                    text: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(" ")
                });
            };

            console.error = (...args) => {
                newOutput.push({
                    type: "error",
                    text: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(" ")
                });
            };

            try {
                // eslint-disable-next-line no-eval
                eval(code);
                setOutput([{ type: "system", text: `--- Ran at ${new Date().toLocaleTimeString()} ---` }, ...newOutput]);
            } catch (err) {
                setOutput([{ type: "error", text: `Runtime Error: ${err.message}` }]);
            } finally {
                console.log = originalConsoleLog;
                console.error = originalConsoleError;
                setIsRunning(false);
            }
        } else if (subjectId === "java") {
            try {
                const response = await apiRunCode({
                    code: code,
                    language: "java",
                    stdin: ""
                }, token);

                if (response.error) {
                    setOutput([{ type: "error", text: `Error: ${response.error}` }]);
                } else {
                    if (response.output) {
                        newOutput.push({ type: "log", text: response.output });
                    }
                    if (response.error && response.error.trim() !== "") {
                        newOutput.push({ type: "error", text: response.error });
                    }
                    setOutput([
                        { type: "system", text: `--- Ran (Backend) at ${new Date().toLocaleTimeString()} ---` },
                        ...newOutput
                    ]);
                }
            } catch (err) {
                setOutput([{ type: "error", text: `Connection Error: ${err.message}` }]);
            } finally {
                setIsRunning(false);
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const newValue = code.substring(0, start) + "    " + code.substring(end);
            setCode(newValue);
            setTimeout(() => {
                e.target.selectionStart = e.target.selectionEnd = start + 4;
            }, 0);
        }
    };

    return (
        <div className="code-problem-overlay">
            <div className="code-problem-card">
                <header className="code-problem-header">
                    <h3>
                        <span className="icon">⚡</span>
                        Coding Challenge: {subjectId === "java" ? "Java" : "JavaScript"}
                    </h3>
                </header>

                <div className="code-problem-body">
                    <div className="problem-statement-panel">
                        <h4>Problem Statement</h4>
                        <div className="markdown-problem-body">
                            <ReactMarkdown>{problem.problem_statement}</ReactMarkdown>
                        </div>
                    </div>

                    <div className="editor-workspace">
                        <div className="editor-main">
                            <div className="editor-label">
                                <span>{subjectId === "java" ? "Main.java" : "main.js"}</span>
                                <span>{subjectId === "java" ? "Java" : "JavaScript"}</span>
                            </div>
                            <textarea
                                className="code-textarea-overlay"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                onKeyDown={handleKeyDown}
                                spellCheck="false"
                            />
                        </div>

                        <div className="output-panel-overlay">
                            <div className="output-header">
                                <span>Console Output</span>
                                <button className="clear-btn-overlay" onClick={() => setOutput([])}>Clear</button>
                            </div>
                            <div className="output-content-overlay">
                                {output.map((line, i) => (
                                    <div key={i} className={`output-line ${line.type}`}>
                                        {line.text}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="code-problem-footer">
                    <button className="run-btn-overlay" onClick={runCode} disabled={isRunning}>
                        {isRunning ? "Running..." : "Run Code"}
                    </button>
                    <button 
                        className="submit-btn-overlay" 
                        onClick={() => onSubmit(code)}
                        disabled={submitting || isRunning}
                    >
                        {submitting ? "Evaluating..." : "Submit Solution"}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default CodeProblemOverlay;
