import './QuizResults.css';

export const QuizResults = ({ results, onReviewWrong, onRetake, reviewMode }) => {
    const { total, correct, incorrect, percentage, wrongAnswers } = results;

    const getGrade = () => {
        if (percentage >= 90) return { text: 'Excellent!', emoji: '🌟' };
        if (percentage >= 70) return { text: 'Good Job!', emoji: '👍' };
        if (percentage >= 50) return { text: 'Keep Practicing!', emoji: '💪' };
        return { text: 'Need More Practice', emoji: '📚' };
    };

    const grade = getGrade();

    return (
        <div className="quiz-results">
            <div className="results-container">
                <h2>Quiz Complete!</h2>

                <div className="score-card">
                    <div className="score-emoji">{grade.emoji}</div>
                    <div className="score-text">{grade.text}</div>
                    <div className="score-number">{percentage}%</div>
                    <div className="score-breakdown">
                        <span className="correct-count">✅ {correct} Correct</span>
                        <span className="wrong-count">❌ {incorrect} Wrong</span>
                    </div>
                </div>

                {wrongAnswers.length > 0 && (
                    <div className="wrong-answers-section">
                        <h3>Review Wrong Answers</h3>
                        <div className="wrong-answers-list">
                            {wrongAnswers.map((wa, index) => (
                                <div key={index} className="wrong-answer-card">
                                    <div className="wa-question">{wa.question.question}</div>
                                    <div className="wa-details">
                                        <div className="wa-your-answer">
                                            Your answer: <span className="incorrect-text">{wa.userAnswer || '(no answer)'}</span>
                                        </div>
                                        <div className="wa-correct-answer">
                                            Correct answer: <span className="correct-text">{wa.question.correctAnswer}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="results-actions">
                    {wrongAnswers.length > 0 && (
                        <button className="review-btn" onClick={onReviewWrong}>
                            🔄 Review Wrong Answers ({wrongAnswers.length})
                        </button>
                    )}
                    <button className="retake-btn" onClick={onRetake}>
                        ↻ {reviewMode ? 'Back to Main Quiz' : 'Retake Quiz'}
                    </button>
                </div>
            </div>
        </div>
    );
};
