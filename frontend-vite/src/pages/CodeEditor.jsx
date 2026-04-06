import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { runCode as apiRunCode } from "../services/api";
import "./CodeEditor.css";

const CodeEditor = () => {
    const { subjectId, topic } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const getInitialCode = () => {
        if (subjectId === "java") {
            return `public class Main {
    public static void main(String[] args) {
        System.out.println("Welcome to Java Playground!");
        System.out.println("Topic: ${topic}");
        
        int result = 0;
        for (int i = 1; i <= 10; i++) {
            result += i;
        }
        System.out.println("Sum of 1 to 10 is: " + result);
    }
}`;
        }
        return `// Welcome to the Coding Playground!
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

solution();`;
    };

    const [code, setCode] = useState(getInitialCode());
    const [isRunning, setIsRunning] = useState(false);
    const [terminalHeight, setTerminalHeight] = useState(250); // Initial height in px
    const isResizing = useRef(false);

    const [output, setOutput] = useState([
        { type: "system", text: "Welcome to the coding environment." },
        { type: "system", text: "Console output will appear here." }
    ]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing.current) return;
            const container = document.querySelector(".editor-workspace");
            if (!container) return;
            const containerRect = container.getBoundingClientRect();
            const newHeight = containerRect.bottom - e.clientY;
            if (newHeight > 60 && newHeight < containerRect.height - 100) {
                setTerminalHeight(newHeight);
            }
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = "default";
            document.body.style.userSelect = "auto";
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    const handleResizerMouseDown = (e) => {
        isResizing.current = true;
        document.body.style.cursor = "row-resize";
        document.body.style.userSelect = "none";
    };

    const runCode = async () => {
        if (setIsRunning) setIsRunning(true);
        const newOutput = [];

        if (subjectId === "javascript") {
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
                    setOutput(prev => [...prev, { type: "error", text: `Error: ${response.error}` }]);
                } else {
                    if (response.output) {
                        newOutput.push({ type: "log", text: response.output });
                    }
                    if (response.error && response.error.trim() !== "") {
                        newOutput.push({ type: "error", text: response.error });
                    }
                    setOutput(prev => [
                        ...prev,
                        { type: "system", text: `--- Execution Finished (Backend) at ${new Date().toLocaleTimeString()} ---` },
                        ...newOutput
                    ]);
                }
            } catch (err) {
                setOutput(prev => [...prev, { type: "error", text: `Connection Error: ${err.message}` }]);
            } finally {
                setIsRunning(false);
            }
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
        <div className="code-editor-page">
            <div className="editor-workspace-container">
                <div className="editor-panel-header">
                    <div className="eph-left">
                        <button className="eph-back-btn" onClick={() => navigate(`/topic-view/${subjectId}/${topic}`)}>
                            <span className="eph-back-icon">‹</span> Notes
                        </button>
                        <div className="eph-info">
                            <span className="eph-subject-pill">{subjectId?.toUpperCase()}</span>
                            <span className="eph-topic-name">{topic}</span>
                        </div>
                    </div>

                    <div className="eph-right">
                        <span className="eph-lang-badge">{subjectId === "java" ? "Java" : "JavaScript"}</span>
                        <button className="eph-run-btn" onClick={runCode} disabled={isRunning}>
                            <svg className="eph-play-icon" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" fill="currentColor" />
                            </svg>
                            {isRunning ? "Running..." : "Run"}
                        </button>
                    </div>
                </div>

                <div className="editor-workspace">
                    <div className="editor-panel">
                        <div className="panel-label">
                            <span>EDITOR</span>
                            <span className="language-badge">{subjectId === "java" ? "Java" : "JavaScript"}</span>
                        </div>
                        <textarea
                            className="code-textarea"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            onKeyDown={handleKeyDown}
                            spellCheck="false"
                        />
                    </div>

                    <div className="resizer-h" onMouseDown={handleResizerMouseDown} />

                    <div className="output-panel" style={{ height: `${terminalHeight}px` }}>
                        <div className="panel-label">
                            <span>CONSOLE OUTPUT</span>
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
