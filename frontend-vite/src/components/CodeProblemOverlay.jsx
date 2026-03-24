import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import "./CodeProblemOverlay.css";

const CodeProblemOverlay = ({ problem, onSubmit, submitting }) => {
    const [code, setCode] = useState(problem.initial_code || "");
    const [output, setOutput] = useState([
        { type: "system", text: "Ready for execution." }
    ]);

    const runCode = () => {
        const newOutput = [];
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
                        Coding Challenge: JavaScript
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
                                <span>main.js</span>
                                <span>JavaScript</span>
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
                    <button className="run-btn-overlay" onClick={runCode}>
                        Run Code
                    </button>
                    <button 
                        className="submit-btn-overlay" 
                        onClick={() => onSubmit(code)}
                        disabled={submitting}
                    >
                        {submitting ? "Evaluating..." : "Submit Solution"}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default CodeProblemOverlay;
