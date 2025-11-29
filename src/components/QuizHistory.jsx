import { useState } from 'react';
import './QuizHistory.css';

export const QuizHistory = ({ history, onDeleteResult, onClearHistory }) => {
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const formatDate = (isoDate) => {
        if (!isoDate) return 'Just now';

        const date = new Date(isoDate);
        if (isNaN(date.getTime())) return 'Just now';

        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getGradeEmoji = (percentage) => {
        if (percentage >= 90) return '🌟';
        if (percentage >= 70) return '👍';
        if (percentage >= 50) return '💪';
        return '📚';
    };

    const getGradeColor = (percentage) => {
        if (percentage >= 90) return 'excellent';
        if (percentage >= 70) return 'good';
        if (percentage >= 50) return 'ok';
        return 'needs-work';
    };

    if (history.length === 0) {
        return (
            <div className="history-container">
                <div className="history-empty">
                    <div className="empty-icon">📊</div>
                    <h2>No Quiz History Yet</h2>
                    <p>Complete some quizzes to see your progress here!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="history-container">
            <div className="history-header">
                <h2>Quiz History</h2>
                <button className="clear-history-btn" onClick={() => setShowClearConfirm(true)}>
                    🗑️ Clear All
                </button>
            </div>

            <div className="history-stats">
                <div className="stat-card">
                    <div className="stat-value">{history.length}</div>
                    <div className="stat-label">Quizzes Taken</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        {Math.round(history.reduce((sum, h) => sum + h.percentage, 0) / history.length)}%
                    </div>
                    <div className="stat-label">Average Score</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        {Math.max(...history.map(h => h.percentage))}%
                    </div>
                    <div className="stat-label">Best Score</div>
                </div>
            </div>

            <div className="history-list">
                {history.map((entry) => (
                    <div key={entry.id} className={`history-card ${getGradeColor(entry.percentage)}`}>
                        <div className="history-card-header">
                            <div className="history-score">
                                <span className="score-emoji">{getGradeEmoji(entry.percentage)}</span>
                                <span className="score-percentage">{entry.percentage}%</span>
                            </div>
                            <button
                                className="delete-btn"
                                onClick={() => onDeleteResult(entry.id)}
                                title="Delete this result"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="history-details">
                            <div className="detail-row">
                                <span className="detail-label">Score:</span>
                                <span className="detail-value">
                                    {entry.correct} / {entry.total} correct
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Questions:</span>
                                <span className="detail-value">{entry.total} questions</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Date:</span>
                                <span className="detail-value">{formatDate(entry.date)}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Category:</span>
                                <span className="detail-value category-badge">
                                    {entry.category === 'all' ? 'All Categories' : entry.category || 'All Categories'}
                                </span>
                            </div>
                        </div>

                        {entry.wrongAnswers && entry.wrongAnswers.length > 0 && (
                            <div className="wrong-answers-preview">
                                <div className="preview-header">❌ Missed {entry.wrongAnswers.length} word{entry.wrongAnswers.length > 1 ? 's' : ''}:</div>
                                <div className="preview-words">
                                    {entry.wrongAnswers.slice(0, 3).map((wa, idx) => (
                                        <span key={idx} className="missed-word">
                                            {wa.question.question}
                                        </span>
                                    ))}
                                    {entry.wrongAnswers.length > 3 && (
                                        <span className="more-words">+{entry.wrongAnswers.length - 3} more</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {showClearConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Clear History?</h3>
                        <p>Are you sure you want to delete all quiz history? This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button
                                className="modal-btn cancel"
                                onClick={() => setShowClearConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="modal-btn confirm"
                                onClick={() => {
                                    setShowClearConfirm(false);
                                    onClearHistory();
                                }}
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
