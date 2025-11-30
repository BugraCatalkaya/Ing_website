import { useState, useEffect, useCallback } from 'react';
import { useSpeech } from '../hooks/useSpeech';
import './Flashcard.css';

export const Flashcard = ({ words }) => {
    const { speak } = useSpeech();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedFolder, setSelectedFolder] = useState('all');

    const categories = ['all', ...new Set(words.map(w => w.category || 'General'))];
    const folders = ['all', ...new Set(words.map(w => w.folder || 'General'))];

    const filteredWords = words.filter(w => {
        const matchesCategory = selectedCategory === 'all' || (w.category || 'General') === selectedCategory;
        const matchesFolder = selectedFolder === 'all' || (w.folder || 'General') === selectedFolder;
        return matchesCategory && matchesFolder;
    });

    const handleNext = useCallback((e) => {
        e?.stopPropagation();
        if (filteredWords.length === 0) return;
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev + 1) % filteredWords.length);
    }, [filteredWords.length]);

    const handlePrev = useCallback((e) => {
        e?.stopPropagation();
        if (filteredWords.length === 0) return;
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev - 1 + filteredWords.length) % filteredWords.length);
    }, [filteredWords.length]);

    const handleFlip = useCallback(() => {
        setIsFlipped(prev => !prev);
    }, []);

    // Reset index when category or folder changes
    useEffect(() => {
        setCurrentIndex(0);
        setIsFlipped(false);
    }, [selectedCategory, selectedFolder]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't handle keyboard events if user is interacting with select or input
            if (document.activeElement.tagName === 'SELECT' ||
                document.activeElement.tagName === 'INPUT') {
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
    }, [handleNext, handlePrev, handleFlip]);

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

    const currentWord = filteredWords[currentIndex];

    return (
        <div className="flashcard-container">
            <h2>Study Mode</h2>

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
                                {currentWord.emoji && <div className="flashcard-emoji">{currentWord.emoji}</div>}
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
                            Next →
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
