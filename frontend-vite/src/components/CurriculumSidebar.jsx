import React from 'react';
import './CurriculumSidebar.css';

const CurriculumSidebar = ({ subjectData, currentTopic, onTopicSelect, onQuizSelect, isOpen, onClose }) => {
  if (!subjectData) return <div className="curriculum-loading">Loading curriculum...</div>;

  const totalTopics = subjectData.units.reduce((acc, unit) => acc + unit.topics.length, 0);
  const completedTopics = 0; // Mock for now, could be derived from unit state

  return (
    <div className={`curriculum-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="curriculum-header">
        <div className="curriculum-header-top">
          <div className="curriculum-title-group">
            <span className="curriculum-icon">📖</span>
            <h3>Chapters</h3>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close Sidebar">
            &times;
          </button>
        </div>
        <div className="curriculum-meta">
          {totalTopics} topics • 12 hours total
        </div>
      </div>

      <div className="chapters-list">
        {subjectData.units.map((chapter, uIdx) => (
          <div key={chapter.id} className="chapter-container">
            <div className="chapter-header">
              <h4>{chapter.title}</h4>
              <span className="chapter-status-icon success">✓</span>
            </div>
            
            <ul className="topics-list">
              {chapter.topics.map((topic, tIdx) => {
                const isCurrent = topic === currentTopic;
                return (
                  <li 
                    key={topic} 
                    className={`topic-item ${isCurrent ? 'active' : ''}`}
                    onClick={() => onTopicSelect(topic)}
                  >
                    <span className="topic-number">{uIdx + 1}.{tIdx + 1}</span>
                    <span className="topic-name">{topic.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                    <span className="topic-check">✓</span>
                  </li>
                );
              })}
            </ul>

            {chapter.quiz && (
              <div 
                className="chapter-quiz-item"
                onClick={() => onQuizSelect(chapter.quiz.id)}
              >
                <div className="quiz-info">
                  <span className="quiz-label">{chapter.quiz.title}</span>
                  <span className="quiz-score">85%</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};

export default CurriculumSidebar;
