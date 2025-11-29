import { useEffect, useState, useRef } from 'react';
import { QuizQuestion } from './QuizQuestion';
import { QuizResults } from './QuizResults';
import './Quiz.css';

export const Quiz = ({ quiz, words, onQuizComplete }) => {
    const {
        questions,
        currentQuestion,
        currentQuestionIndex,
        totalQuestions,
        isComplete,
        reviewMode,
        startQuiz,
        submitAnswer,
        getResults,
        startReviewQuiz,
        resetQuiz
    } = quiz;

    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const savedRef = useRef(false);

    const categories = ['all', ...new Set(words.map(w => w.category || 'General'))];

    const filteredWords = selectedCategory === 'all'
        ? words
        : words.filter(w => w.category === selectedCategory);

    // Reset saved state when quiz is not complete (new quiz started)
    useEffect(() => {
        if (!isComplete) {
            savedRef.current = false;
        }
    }, [isComplete]);

    // Save results only once when quiz completes
    useEffect(() => {
        if (isComplete && !savedRef.current) {
            onQuizComplete(getResults());
            savedRef.current = true;
        }
    }, [isComplete, onQuizComplete, getResults]);

    if (!questions) {
        return (
            <div className="quiz-container">
                <div className="quiz-start">
                    <div className="quiz-icon">🎯</div>
                    <h2>Ready to Test Your Knowledge?</h2>
                    <p className="quiz-description">
                        Take a quiz with 10 random questions from your vocabulary list.
                    </p>

                    <div className="category-selection">
                        <label htmlFor="quiz-category">Select Category:</label>
                        <select
                            id="quiz-category"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="category-select"
                        >
                            <option value="all">All Categories</option>
                            {categories.filter(c => c !== 'all').map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {filteredWords.length < 4 ? (
                        <div className="insufficient-words">
                            <p>⚠️ You need at least 4 words in this category to take a quiz.</p>
                            <p>Add more words in the Manage tab first.</p>
                        </div>
                    ) : (
                        <>
                            <div className="quiz-stats">
                                <div className="stat">
                                    <div className="stat-number">{Math.min(10, filteredWords.length)}</div>
                                    <div className="stat-label">Questions</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-number">{filteredWords.length}</div>
                                    <div className="stat-label">Total Words</div>
                                </div>
                            </div>

                            <div className="quiz-type-selection">
                                <h3>Select Quiz Type:</h3>
                                <div className="quiz-type-buttons">
                                    <button
                                        className="quiz-type-btn multiple-choice-btn"
                                        onClick={() => startQuiz(null, 'multiple-choice', selectedCategory)}
                                    >
                                        <span className="type-icon">📝</span>
                                        <span className="type-name">Multiple Choice</span>
                                        <span className="type-desc">Select correct answer</span>
                                    </button>

                                    <button
                                        className="quiz-type-btn fill-in-btn"
                                        onClick={() => startQuiz(null, 'fill-in', selectedCategory)}
                                    >
                                        <span className="type-icon">✍️</span>
                                        <span className="type-name">Fill in the Blank</span>
                                        <span className="type-desc">Type the answer</span>
                                    </button>

                                    <button
                                        className="quiz-type-btn mixed-btn"
                                        onClick={() => startQuiz(null, 'mixed', selectedCategory)}
                                    >
                                        <span className="type-icon">🎲</span>
                                        <span className="type-name">Mixed Mode</span>
                                        <span className="type-desc">Random mix</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                    {reviewMode && (
                        <div className="review-mode-badge">
                            📝 Review Mode - Practice Your Mistakes
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (isComplete) {
        return (
            <div className="quiz-container">
                <QuizResults
                    results={getResults()}
                    onReviewWrong={startReviewQuiz}
                    onRetake={resetQuiz}
                    reviewMode={reviewMode}
                />
            </div>
        );
    }

    return (
        <div className="quiz-container">
            <QuizQuestion
                question={currentQuestion}
                onSubmit={submitAnswer}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={totalQuestions}
                onExit={() => setShowExitConfirm(true)}
            />

            {showExitConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Quit Quiz?</h3>
                        <p>Are you sure you want to quit? Your progress will be lost.</p>
                        <div className="modal-actions">
                            <button
                                className="modal-btn cancel"
                                onClick={() => setShowExitConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="modal-btn confirm"
                                onClick={() => {
                                    setShowExitConfirm(false);
                                    resetQuiz();
                                }}
                            >
                                Quit Quiz
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
