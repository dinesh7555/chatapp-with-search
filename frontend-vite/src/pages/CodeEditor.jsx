import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./CodeEditor.css";

const CodeEditor = () => {
    const { subjectId, topic } = useParams();
    const navigate = useNavigate();

    const [code, setCode] = useState(`// Welcome to the Coding Playground!
// Topic: ${topic}
// Subject: ${subjectId}

function solution() {
    console.log("Starting execution...");
    let result = 0;
    for (let i = 1; i <= 10; i++) {
        result += i;
    }
    console.log("Sum of 1 to 10 is:", result);
    return "Done!";
}

solution();`);

    const [output, setOutput] = useState([
        { type: "system", text: "Welcome to the coding environment." },
        { type: "system", text: "Console output will appear here." }
    ]);

    const runCode = () => {
        const newOutput = [];
        const originalConsoleLog = console.log;
        const originalConsoleError = console.error;

        // Redirect console.log
        console.log = (...args) => {
            newOutput.push({
                type: "log",
                text: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(" ")
            });
            originalConsoleLog.apply(console, args);
        };

        // Redirect console.error
        console.error = (...args) => {
            newOutput.push({
                type: "error",
                text: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(" ")
            });
            originalConsoleError.apply(console, args);
        };

        try {
            // eslint-disable-next-line no-eval
            eval(code);
            setOutput(prev => [...prev, { type: "system", text: `--- Execution Finished at ${new Date().toLocaleTimeString()} ---` }, ...newOutput]);
        } catch (err) {
            setOutput(prev => [...prev, { type: "error", text: `Runtime Error: ${err.message}` }]);
        } finally {
            // Restore console
            console.log = originalConsoleLog;
            console.error = originalConsoleError;
        }
    };

    const clearOutput = () => {
        setOutput([{ type: "system", text: "Console cleared." }]);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const newValue = code.substring(0, start) + "    " + code.substring(end);
            setCode(newValue);
            // Re-set cursor position after state update
            setTimeout(() => {
                e.target.selectionStart = e.target.selectionEnd = start + 4;
            }, 0);
        }
    };

    return (
        <div className="code-editor-layout">
            <div className="code-editor-main">
                <header className="code-editor-header">
                    <div className="header-left">
                        <button className="back-link" onClick={() => navigate(`/topic-view/${subjectId}/${topic}`)}>
                            <span className="back-icon">‹</span> Back to Notes
                        </button>
                        <div className="topic-info">
                            <span className="subject-label">{subjectId?.toUpperCase()}</span>
                            <h1>Coding: {topic}</h1>
                        </div>
                    </div>

                    <div className="header-actions">
                        <button className="run-btn" onClick={runCode}>
                            <svg className="play-icon" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            Run Code
                        </button>
                    </div>
                </header>

                <div className="editor-workspace">
                    <div className="editor-panel">
                        <div className="panel-label">
                            <span>Editor</span>
                            <span className="language-badge">JavaScript</span>
                        </div>
                        <textarea
                            className="code-textarea"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            onKeyDown={handleKeyDown}
                            spellCheck="false"
                        />
                    </div>

                    <div className="output-panel">
                        <div className="panel-label">
                            <span>Console Output</span>
                            <button className="clear-btn" onClick={clearOutput}>Clear</button>
                        </div>
                        <div className="output-content">
                            {output.map((line, i) => (
                                <div key={i} className={`output-line ${line.type}`}>
                                    {line.text}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeEditor;
