import React, { useMemo, useState } from "react";
import "./Mindmap.css";

const Mindmap = ({ data, onTopicClick }) => {
    const { root } = data;
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [hasMoved, setHasMoved] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

    const positionedNodes = useMemo(() => {
        if (!root) return { nodes: [], connections: [] };
        
        const nodes = [];
        const connections = [];
        const width = 1000;
        const height = 800;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Root Node
        nodes.push({
            id: root.id,
            text: root.text,
            x: centerX,
            y: centerY,
            type: "root"
        });

        const topics = root.children || [];
        const topicCount = topics.length;
        
        // Radii
        const topicRadius = 220;
        const subtopicRadius = 380;

        topics.forEach((topic, tIdx) => {
            const topicAngle = (tIdx / topicCount) * 2 * Math.PI - Math.PI / 2;
            const tx = centerX + topicRadius * Math.cos(topicAngle);
            const ty = centerY + topicRadius * Math.sin(topicAngle);

            nodes.push({
                id: topic.id,
                text: topic.text,
                x: tx,
                y: ty,
                type: "topic",
                parentId: root.id
            });

            connections.push({
                x1: centerX,
                y1: centerY,
                x2: tx,
                y2: ty,
                type: "main"
            });

            const subtopics = topic.children || [];
            const subCount = subtopics.length;
            const availableSpread = (2 * Math.PI / topicCount) * 0.8; 
            
            subtopics.forEach((sub, sIdx) => {
                let subAngle;
                if (subCount === 1) {
                    subAngle = topicAngle;
                } else {
                    subAngle = topicAngle - (availableSpread / 2) + (sIdx * (availableSpread / (subCount - 1)));
                }

                const sx = centerX + subtopicRadius * Math.cos(subAngle);
                const sy = centerY + subtopicRadius * Math.sin(subAngle);

                nodes.push({
                    id: sub.id,
                    text: sub.text,
                    description: sub.description,
                    x: sx,
                    y: sy,
                    type: "subtopic",
                    parentId: topic.id
                });

                connections.push({
                    x1: tx,
                    y1: ty,
                    x2: sx,
                    y2: sy,
                    type: "sub"
                });
            });
        });

        return { nodes, connections, width, height };
    }, [data, root]);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.4));
    const handleReset = () => {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
    };

    const handleMouseDown = (e) => {
        if (e.button !== 0) return;
        
        // Prevent drag start if clicking on a node
        if (e.target.closest('.mindmap-node')) {
            return;
        }

        setIsDragging(true);
        setHasMoved(false);
        setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        
        const dx = e.clientX - lastMousePos.x;
        const dy = e.clientY - lastMousePos.y;
        
        // Threshold of 3 pixels to differentiate click from drag
        if (!hasMoved && Math.sqrt(dx*dx + dy*dy) > 3) {
            setHasMoved(true);
        }

        if (hasMoved) {
            setOffset(prev => ({
                x: prev.x + dx,
                y: prev.y + dy
            }));
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleNodeClick = (e, node) => {
        // Drag is prevented via handleMouseDown and stopPropagation
        if (node.type === "topic") {
            onTopicClick(node.text);
        }
    };

    return (
        <div 
            className="mindmap-viewport"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
            <div className="zoom-controls">
                <button onClick={handleZoomIn} title="Zoom In">+</button>
                <button onClick={handleReset} title="Reset View">⟲</button>
                <button onClick={handleZoomOut} title="Zoom Out">-</button>
            </div>

            <svg 
                viewBox={`0 0 ${positionedNodes.width} ${positionedNodes.height}`} 
                className="mindmap-svg"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    
                    <linearGradient id="rootGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>

                    <radialGradient id="meshGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="rgba(79, 70, 229, 0.05)" />
                        <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                    </radialGradient>
                </defs>

                <g transform={`translate(${offset.x}, ${offset.y}) scale(${zoom})`} transform-origin="center">
                    <circle cx={positionedNodes.width/2} cy={positionedNodes.height/2} r="450" fill="url(#meshGradient)" />

                    {positionedNodes.connections.map((conn, i) => (
                        <path
                            key={`conn-${i}`}
                            d={`M ${conn.x1} ${conn.y1} Q ${(conn.x1 + conn.x2) / 2} ${(conn.y1 + conn.y2) / 2 - 20}, ${conn.x2} ${conn.y2}`}
                            className={`mindmap-line ${conn.type}`}
                        />
                    ))}

                    {positionedNodes.nodes.map((node) => (
                        <g
                            key={node.id}
                            className={`mindmap-node type-${node.type}`}
                            transform={`translate(${node.x}, ${node.y})`}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => handleNodeClick(e, node)}
                        >
                            <circle
                                r={node.type === "root" ? 55 : node.type === "topic" ? 40 : 28}
                                className="node-shape"
                            />
                            
                            <foreignObject 
                                x={node.type === "root" ? -50 : -40} 
                                y={node.type === "root" ? -50 : -40} 
                                width={node.type === "root" ? 100 : 80} 
                                height={node.type === "root" ? 100 : 80}
                                style={{ pointerEvents: "none" }}
                            >
                                <div className="node-label-container">
                                    <span className="node-text">{node.text}</span>
                                </div>
                            </foreignObject>

                            {node.description && (
                                <title>{node.description}</title>
                            )}
                        </g>
                    ))}
                </g>
            </svg>
            
            <div className="mindmap-tip">
                <p>💡 Tip: Drag to pan, use +/- to zoom. Click main topics to start learning.</p>
            </div>
        </div>
    );
};

export default Mindmap;
