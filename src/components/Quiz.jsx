import { useEffect, useState, useRef } from 'react';
import { QuizQuestion } from './QuizQuestion';
import { QuizResults } from './QuizResults';
import './Quiz.css';

export const Quiz = ({ quiz, words, onQuizComplete, initialFolder, initialCategory, onExit }) => {
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

    const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
    const [selectedFolder, setSelectedFolder] = useState(initialFolder || 'all');
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const savedRef = useRef(false);

    const categories = ['all', ...new Set(words.map(w => w.category || 'General'))];
    const folders = ['all', ...new Set(words.map(w => w.folder || 'General'))];

    useEffect(() => {
        if (initialFolder) setSelectedFolder(initialFolder);
        if (initialCategory) setSelectedCategory(initialCategory);
    }, [initialFolder, initialCategory]);

    const filteredWords = words.filter(w => {
        const matchesCategory = selectedCategory === 'all' || (w.category || 'General') === selectedCategory;
        const matchesFolder = selectedFolder === 'all' || (w.folder || 'General') === selectedFolder;
        return matchesCategory && matchesFolder;
    });

    const isContextLocked = !!initialFolder || !!initialCategory;

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
                    <h2>
                        {initialCategory ? `Quiz: ${initialCategory}` :
                            initialFolder ? `Quiz: ${initialFolder}` :
                                'Ready to Test Your Knowledge?'}
                    </h2>
                    <p className="quiz-description">
                        Take a quiz with 10 random questions from your vocabulary list.
                    </p>

                    {!isContextLocked && (
                        <div className="category-selection">
                            <div style={{ marginBottom: '1rem' }}>
                                <label htmlFor="quiz-folder" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Select Folder:</label>
                                <select
                                    id="quiz-folder"
                                    value={selectedFolder}
                                    onChange={(e) => setSelectedFolder(e.target.value)}
                                    className="category-select"
                                >
                                    <option value="all">All Folders</option>
                                    {folders.filter(f => f !== 'all').map(f => (
                                        <option key={f} value={f}>📁 {f}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="quiz-category" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Select Category:</label>
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
                        </div>
                    )}

                    {filteredWords.length < 4 ? (
                        <div className="insufficient-words">
                            <p>⚠️ You need at least 4 words in this selection to take a quiz.</p>
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
                                        onClick={() => startQuiz(null, 'multiple-choice', selectedCategory, selectedFolder)}
                                    >
                                        <span className="type-icon">📝</span>
                                        <span className="type-name">Multiple Choice</span>
                                        <span className="type-desc">Select correct answer</span>
                                    </button>

                                    <button
                                        className="quiz-type-btn fill-in-btn"
                                        onClick={() => startQuiz(null, 'fill-in', selectedCategory, selectedFolder)}
                                    >
                                        <span className="type-icon">✍️</span>
                                        <span className="type-name">Fill in the Blank</span>
                                        <span className="type-desc">Type the answer</span>
                                    </button>

                                    <button
                                        className="quiz-type-btn mixed-btn"
                                        onClick={() => startQuiz(null, 'mixed', selectedCategory, selectedFolder)}
                                    >
                                        <span className="type-icon">🎲</span>
                                        <span className="type-name">Mixed Mode</span>
                                        <span className="type-desc">Random mix</span>
                                    </button>

                                    <button
                                        className="quiz-type-btn listening-btn"
                                        onClick={() => startQuiz(null, 'listening', selectedCategory, selectedFolder)}
                                    >
                                        <span className="type-icon">🎧</span>
                                        <span className="type-name">Listening</span>
                                        <span className="type-desc">Hear & Type</span>
                                    </button>

                                    <button
                                        className="quiz-type-btn reverse-btn"
                                        onClick={() => startQuiz(null, 'reverse', selectedCategory, selectedFolder)}
                                    >
                                        <span className="type-icon">🔄</span>
                                        <span className="type-name">Reverse</span>
                                        <span className="type-desc">TR ➔ EN</span>
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

                    {onExit && (
                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <button
                                onClick={onExit}
                                className="cancel-btn"
                                style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}
                            >
                                Return to Set 📁
                            </button>
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
                    onExit={onExit}
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
                                    if (onExit) onExit();
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
