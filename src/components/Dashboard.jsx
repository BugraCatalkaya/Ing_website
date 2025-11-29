import './Dashboard.css';

export const Dashboard = ({ words, history, streakStatus, onNavigate, onRecoverStreak }) => {
    // Calculate stats
    const totalWords = words.length;
    const totalQuizzes = history.length;

    const lastQuiz = history.length > 0 ? history[0] : null;
    const averageScore = history.length > 0
        ? Math.round(history.reduce((acc, curr) => acc + curr.percentage, 0) / history.length)
        : 0;

    // Get recent words (last 5)
    const recentWords = [...words].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    const { streak, canRecover, potentialStreak } = streakStatus;

    return (
        <div className="dashboard-container">
            <div className="welcome-section">
                <h2>Welcome back! 👋</h2>
                <p>Ready to learn some English today?</p>
            </div>

            {canRecover && (
                <div className="recovery-alert">
                    <div className="recovery-content">
                        <span className="recovery-icon">🚑</span>
                        <div>
                            <h3>Streak Broken!</h3>
                            <p>You missed yesterday. Complete a quiz NOW to recover your <strong>{potentialStreak} day streak!</strong></p>
                        </div>
                    </div>
                    <button className="recover-btn" onClick={onRecoverStreak}>
                        Recover Streak 🔥
                    </button>
                </div>
            )}

            <div className="stats-grid">
                <div className="stat-card orange">
                    <div className="stat-icon">{streak > 0 ? '🔥' : '❄️'}</div>
                    <div className="stat-info">
                        <h3>Daily Streak</h3>
                        <p className="stat-value">{streak} Days</p>
                    </div>
                </div>
                <div className="stat-card blue">
                    <div className="stat-icon">📚</div>
                    <div className="stat-info">
                        <h3>Total Words</h3>
                        <p className="stat-value">{totalWords}</p>
                    </div>
                </div>
                <div className="stat-card green">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-info">
                        <h3>Quizzes Taken</h3>
                        <p className="stat-value">{totalQuizzes}</p>
                    </div>
                </div>
                <div className="stat-card purple">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-info">
                        <h3>Avg. Score</h3>
                        <p className="stat-value">{averageScore}%</p>
                    </div>
                </div>
            </div>

            <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                    <button className="action-btn primary" onClick={() => onNavigate('quiz')}>
                        <span className="btn-icon">🎲</span>
                        Start Quiz
                    </button>
                    <button className="action-btn secondary" onClick={() => onNavigate('study')}>
                        <span className="btn-icon">🧠</span>
                        Study Flashcards
                    </button>
                    <button className="action-btn outline" onClick={() => onNavigate('manage')}>
                        <span className="btn-icon">➕</span>
                        Add New Words
                    </button>
                </div>
            </div>

            <div className="dashboard-content-grid">
                <div className="recent-activity">
                    <h3>Recent Words</h3>
                    {recentWords.length > 0 ? (
                        <div className="recent-list">
                            {recentWords.map(word => (
                                <div key={word.id} className="recent-item">
                                    <span className="recent-en">{word.english}</span>
                                    <span className="recent-arrow">→</span>
                                    <span className="recent-tr">{word.turkish}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="empty-text">No words added yet.</p>
                    )}
                </div>

                <div className="last-quiz-summary">
                    <h3>Last Quiz Result</h3>
                    {lastQuiz ? (
                        <div className="last-quiz-card">
                            <div className="quiz-date">{new Date(lastQuiz.date).toLocaleDateString()}</div>
                            <div className="quiz-score-circle" style={{
                                background: `conic-gradient(${lastQuiz.percentage >= 70 ? '#10b981' : '#ef4444'} ${lastQuiz.percentage * 3.6}deg, rgba(255,255,255,0.1) 0deg)`
                            }}>
                                <div className="inner-circle">
                                    <span>{lastQuiz.percentage}%</span>
                                </div>
                            </div>
                            <div className="quiz-details">
                                <p>Correct: {lastQuiz.correct}</p>
                                <p>Incorrect: {lastQuiz.incorrect}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="empty-text">No quizzes taken yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
