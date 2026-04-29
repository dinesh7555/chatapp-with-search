import React, { useState, useEffect } from 'react';
import './AskAIFloatingButton.css';

const AskAIFloatingButton = ({ onAsk }) => {
    const [selectionInfo, setSelectionInfo] = useState(null);

    useEffect(() => {
        const handleMouseUp = (e) => {
            setTimeout(() => {
                const selection = window.getSelection();
                const text = selection.toString().trim();
                
                if (text && text.length > 3) {
                    const range = selection.getRangeAt(0);
                    const rect = range.getBoundingClientRect();
                    
                    // Exclude form controls or inputs
                    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                        setSelectionInfo(null);
                        return;
                    }

                    // Show nicely above center of selection
                    setSelectionInfo({
                        text,
                        top: rect.top + window.scrollY - 45,
                        left: rect.left + window.scrollX + (rect.width / 2)
                    });
                } else {
                    setSelectionInfo(null);
                }
            }, 10);
        };

        const handleSelectionChange = () => {
            const selection = window.getSelection();
            if (!selection.toString().trim()) {
                setSelectionInfo(null);
            }
        };

        const updatePosition = () => {
            const selection = window.getSelection();
            if (selection.rangeCount > 0 && !selection.isCollapsed) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                
                if (rect.width > 0 && rect.height > 0) {
                    setSelectionInfo(prev => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            top: rect.top + window.scrollY - 45,
                            left: rect.left + window.scrollX + (rect.width / 2)
                        };
                    });
                }
            }
        };

        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('selectionchange', handleSelectionChange);
        window.addEventListener('scroll', updatePosition, true);
        
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('selectionchange', handleSelectionChange);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, []);

    if (!selectionInfo) return null;

    const handleClick = () => {
        onAsk(selectionInfo.text);
        window.getSelection().removeAllRanges(); // Clear selection so button hides easily
        setSelectionInfo(null);
    };

    return (
        <button 
            className="ask-ai-floating-btn"
            style={{ 
                top: `${selectionInfo.top}px`, 
                left: `${selectionInfo.left}px`,
                transform: 'translateX(-50%)'
            }}
            onClick={handleClick}
            title="Quote this to AI Tutor"
        >
            ✨ Ask AI
        </button>
    );
};

export default AskAIFloatingButton;
