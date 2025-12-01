import { useState, useEffect, useCallback } from 'react';
import { useSpeech } from '../hooks/useSpeech';
import './Flashcard.css';

export const Flashcard = ({ words, initialFolder, initialCategory, onExit }) => {
    const { speak } = useSpeech();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
    const [selectedFolder, setSelectedFolder] = useState(initialFolder || 'all');

    const [isFinished, setIsFinished] = useState(false);

    const categories = ['all', ...new Set(words.map(w => w.category || 'General'))];
    const folders = ['all', ...new Set(words.map(w => w.folder || 'General'))];

    // Update state if props change
    useEffect(() => {
        if (initialFolder) setSelectedFolder(initialFolder);
        if (initialCategory) setSelectedCategory(initialCategory);
    }, [initialFolder, initialCategory]);

    const filteredWords = words.filter(w => {
        const matchesCategory = selectedCategory === 'all' || (w.category || 'General') === selectedCategory;
        const matchesFolder = selectedFolder === 'all' || (w.folder || 'General') === selectedFolder;
        return matchesCategory && matchesFolder;
    });

    const handleNext = useCallback((e) => {
        e?.stopPropagation();
        if (filteredWords.length === 0) return;

        if (currentIndex === filteredWords.length - 1) {
            setIsFinished(true);
            return;
        }

        setIsFlipped(false);
        setCurrentIndex((prev) => prev + 1);
    }, [filteredWords.length, currentIndex]);

    const handlePrev = useCallback((e) => {
        e?.stopPropagation();
        if (filteredWords.length === 0) return;
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev - 1 + filteredWords.length) % filteredWords.length);
    }, [filteredWords.length]);

    const handleFlip = useCallback(() => {
        setIsFlipped(prev => !prev);
    }, []);

    const handleRestart = () => {
        setIsFinished(false);
        setCurrentIndex(0);
        setIsFlipped(false);
    };

    // Reset index when category or folder changes
    useEffect(() => {
        setCurrentIndex(0);
        setIsFlipped(false);
        setIsFinished(false);
    }, [selectedCategory, selectedFolder]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't handle keyboard events if user is interacting with select or input
            if (document.activeElement.tagName === 'SELECT' ||
                document.activeElement.tagName === 'INPUT') {
                return;
            }

            if (isFinished) {
                if (e.key === 'Enter' || e.key === ' ') {
                    handleRestart();
                } else if (e.key === 'Escape') {
                    onExit && onExit();
                }
                return;
            }

            if (e.key === 'ArrowRight') {
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                handlePrev();
            } else if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleFlip();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNext, handlePrev, handleFlip, isFinished, onExit]);

    if (words.length === 0) {
        return (
            <div className="flashcard-container">
                <div className="empty-state">
                    <div className="empty-icon">🎴</div>
                    <p>Add some words to start studying!</p>
                </div>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="flashcard-container">
                <div className="completion-state" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="completion-icon" style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                    <h2>Study Session Complete!</h2>
                    <p style={{ margin: '1rem 0 2rem', color: 'var(--text-secondary)' }}>
                        You have reviewed all {filteredWords.length} words in this set.
                    </p>
                    <div className="completion-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button
                            onClick={handleRestart}
                            className="restart-btn"
                            style={{
                                padding: '1rem 2rem',
                                fontSize: '1.2rem',
                                background: 'var(--primary-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            Start Over ↺
                        </button>
                        {onExit && (
                            <button
                                onClick={onExit}
                                className="exit-btn"
                                style={{
                                    padding: '1rem 2rem',
                                    fontSize: '1.2rem',
                                    background: 'transparent',
                                    color: 'var(--text-primary)',
                                    border: '2px solid var(--border-color)',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                Return to Set 📁
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const currentWord = filteredWords[currentIndex];
    const isContextLocked = !!initialFolder || !!initialCategory;

    return (
        <div className="flashcard-container">
            <h2>
                {initialCategory ? `Studying Set: ${initialCategory}` :
                    initialFolder ? `Studying Folder: ${initialFolder}` :
                        'Study Mode'}
            </h2>

            {!isContextLocked && (
                <div className="category-selection-container">
                    <div className="filter-group">
                        <label htmlFor="study-folder" className="filter-label">Filter by Folder:</label>
                        <select
                            id="study-folder"
                            value={selectedFolder}
                            onChange={(e) => setSelectedFolder(e.target.value)}
                            className="study-category-select"
                            onKeyDown={(e) => {
                                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
                                    e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                    e.stopPropagation();
                                }
                            }}
                        >
                            <option value="all">All Folders</option>
                            {folders.filter(f => f !== 'all').map(f => (
                                <option key={f} value={f}>📁 {f}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="study-category" className="filter-label">Filter by Set:</label>
                        <select
                            id="study-category"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="study-category-select"
                            onKeyDown={(e) => {
                                // Prevent arrow keys from triggering flashcard navigation
                                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
                                    e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                    e.stopPropagation();
                                }
                            }}
                        >
                            <option value="all">All Categories</option>
                            {categories.filter(c => c !== 'all').map(c => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {filteredWords.length === 0 ? (
                <div className="empty-state">
                    <p>No words found in this category.</p>
                </div>
            ) : (
                <>
                    <div className="flashcard-progress">
                        {currentIndex + 1} / {filteredWords.length}
                    </div>

                    <div
                        className={`flashcard ${isFlipped ? 'flipped' : ''}`}
                        onClick={handleFlip}
                    >
                        <div className="flashcard-inner">
                            <div className="flashcard-front">
                                <div className="flashcard-label">English</div>
                                <div className="flashcard-text">{currentWord.english}</div>
                                <button
                                    className="speak-btn-card"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        speak(currentWord.english);
                                    }}
                                    title="Listen"
                                >
                                    🔊
                                </button>
                                <div className="flashcard-hint">Click to reveal</div>
                                <div className="flashcard-tags">
                                    <span className="flashcard-tag folder">📁 {currentWord.folder || 'General'}</span>
                                    <span className="flashcard-tag category">{currentWord.category || 'General'}</span>
                                </div>
                            </div>
                            <div className="flashcard-back">
                                <div className="flashcard-label">Türkçe</div>
                                <div className="flashcard-text">{currentWord.turkish}</div>
                                {currentWord.example && (
                                    <div className="flashcard-example">
                                        <span className="example-label">Example:</span>
                                        "{currentWord.example}"
                                    </div>
                                )}
                                <div className="flashcard-hint">Click to flip back</div>
                            </div>
                        </div>
                    </div>

                    <div className="flashcard-controls">
                        <button
                            onClick={handlePrev}
                            className="control-btn"
                            disabled={filteredWords.length <= 1}
                        >
                            ← Previous
                        </button>
                        <button
                            onClick={handleNext}
                            className="control-btn"
                            disabled={filteredWords.length <= 1}
                        >
                            {currentIndex === filteredWords.length - 1 ? 'Finish' : 'Next →'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
