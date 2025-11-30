import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSpeech } from '../hooks/useSpeech';

import { WordPacks } from './WordPacks';
import './WordList.css';

export const WordList = ({ words, history, onDeleteWord, onDeleteWords, onUpdateCategory, onUpdateWord, onImportWords, categories }) => {
    const { speak } = useSpeech();
    const [editingId, setEditingId] = useState(null);
    const [tempCategory, setTempCategory] = useState('');
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [editForm, setEditForm] = useState({ english: '', turkish: '', example: '', partOfSpeech: '' });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Number of words to display per page

    // Reset currentPage to 1 whenever filters or search terms change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedFilter]);

    const startEditing = (word) => {
        setEditingId(word.id);
        setTempCategory(word.category || 'General');
        setEditForm({
            english: word.english,
            turkish: word.turkish,
            example: word.example || '',
            partOfSpeech: word.partOfSpeech || ''
        });
        setIsCreatingNew(false);
        setNewCategoryName('');
    };

    const cancelEditing = () => {
        setEditingId(null);
        setTempCategory('');
        setEditForm({ english: '', turkish: '', example: '', partOfSpeech: '' });
        setIsCreatingNew(false);
        setNewCategoryName('');
    };

    const saveEdit = (id) => {
        const categoryToSave = isCreatingNew ? newCategoryName.trim() : tempCategory;

        if (editForm.english && editForm.turkish) {
            onUpdateWord(id, {
                ...editForm,
                category: categoryToSave || 'General'
            });
            cancelEditing();
        }
    };

    // Kept for backward compatibility if needed, but saveEdit handles everything now
    const saveCategory = (id) => {
        saveEdit(id);
    };

    const handleCategoryChange = (e) => {
        const value = e.target.value;
        if (value === 'new_category_custom_value') {
            setIsCreatingNew(true);
            setTempCategory('');
        } else {
            setIsCreatingNew(false);
            setTempCategory(value);
        }
    };

    const uniqueCategories = ['General', ...new Set(categories)].filter(c => c !== 'General').sort();

    // Filter words based on selected category AND search term
    const filteredWords = words.filter(word => {
        const matchesCategory = selectedFilter === 'all' || (word.category || 'General') === selectedFilter;
        const matchesSearch = searchTerm === '' ||
            word.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
            word.turkish.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesCategory && matchesSearch;
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredWords.length / itemsPerPage);
    const indexOfLastWord = currentPage * itemsPerPage;
    const indexOfFirstWord = indexOfLastWord - itemsPerPage;
    const currentWords = filteredWords.slice(indexOfFirstWord, indexOfLastWord);

    const allCategories = ['all', ...new Set(words.map(w => w.category || 'General'))];

    const handleDeleteCategory = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const wordsToDelete = selectedFilter === 'all'
            ? words
            : words.filter(w => (w.category || 'General') === selectedFilter);

        if (wordsToDelete.length === 0) {
            alert("No words found to delete in this category.");
            return;
        }
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        const categoryName = selectedFilter === 'all' ? 'All Categories' : selectedFilter;
        const wordsToDelete = selectedFilter === 'all'
            ? words
            : words.filter(w => (w.category || 'General') === selectedFilter);

        onDeleteWords(wordsToDelete.map(w => w.id), categoryName);
        if (selectedFilter !== 'all') {
            setSelectedFilter('all');
        }
        setShowDeleteConfirm(false);
    };

    return (
        <div className="word-list-container">
            <div className="word-list-header">
                <h2>Your Vocabulary ({filteredWords.length})</h2>
                <div className="filter-controls">
                    <div className="search-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search words..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button
                                className="clear-search-btn"
                                onClick={() => setSearchTerm('')}
                            >✕</button>
                        )}
                    </div>
                    <select
                        value={selectedFilter}
                        onChange={(e) => setSelectedFilter(e.target.value)}
                        className="category-filter-select"
                    >
                        <option value="all">All Categories ({words.length})</option>
                        {allCategories.filter(c => c !== 'all').map(c => (
                            <option key={c} value={c}>
                                {c} ({words.filter(w => (w.category || 'General') === c).length})
                            </option>
                        ))}
                    </select>
                    {words.length > 0 && (
                        <button
                            type="button"
                            className="delete-category-btn"
                            onClick={handleDeleteCategory}
                            title={selectedFilter === 'all' ? "Delete All Words" : `Delete Category: ${selectedFilter}`}
                            style={{ cursor: 'pointer', zIndex: 1000, position: 'relative' }}
                        >
                            {selectedFilter === 'all' ? '🗑️ Delete All' : '🗑️ Delete Category'}
                        </button>
                    )}
                </div>
            </div>

            <WordPacks onImportWords={onImportWords} />

            {words.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📚</div>
                    <p>No words yet. Start adding some words to study!</p>
                </div>
            ) : (
                <>
                    <div className="word-list">
                        {currentWords.map((word) => (
                            <div key={word.id} className="word-card">
                                <div className="word-content">
                                    {editingId === word.id ? (
                                        <div className="word-edit-form">
                                            <div className="edit-row">
                                                <input
                                                    type="text"
                                                    value={editForm.english}
                                                    onChange={(e) => setEditForm({ ...editForm, english: e.target.value })}
                                                    className="edit-input english"
                                                    placeholder="English"
                                                />
                                                <input
                                                    type="text"
                                                    value={editForm.turkish}
                                                    onChange={(e) => setEditForm({ ...editForm, turkish: e.target.value })}
                                                    className="edit-input turkish"
                                                    placeholder="Turkish"
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                value={editForm.example}
                                                onChange={(e) => setEditForm({ ...editForm, example: e.target.value })}
                                                className="edit-input example"
                                                placeholder="Example sentence"
                                            />

                                            <div className="category-edit-container">
                                                {!isCreatingNew ? (
                                                    <select
                                                        value={tempCategory}
                                                        onChange={handleCategoryChange}
                                                        className="category-edit-select"
                                                    >
                                                        <option value="General">General</option>
                                                        {uniqueCategories.map(c => (
                                                            <option key={c} value={c}>{c}</option>
                                                        ))}
                                                        <option value="new_category_custom_value">+ New Category</option>
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={newCategoryName}
                                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                                        placeholder="New category name"
                                                        className="category-edit-input"
                                                    />
                                                )}

                                                <select
                                                    value={editForm.partOfSpeech}
                                                    onChange={(e) => setEditForm({ ...editForm, partOfSpeech: e.target.value })}
                                                    className="category-edit-select"
                                                    style={{ minWidth: '100px' }}
                                                >
                                                    <option value="">Type (Opt)</option>
                                                    <option value="noun">Noun</option>
                                                    <option value="verb">Verb</option>
                                                    <option value="adjective">Adjective</option>
                                                    <option value="adverb">Adverb</option>
                                                    <option value="pronoun">Pronoun</option>
                                                    <option value="preposition">Preposition</option>
                                                    <option value="conjunction">Conjunction</option>
                                                    <option value="interjection">Interjection</option>
                                                </select>
                                            </div>

                                            <div className="edit-actions-row">
                                                <button onClick={() => saveEdit(word.id)} className="save-btn-text">Save</button>
                                                <button onClick={cancelEditing} className="cancel-btn-text">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="word-main">
                                                <div className="english-wrapper">
                                                    {word.emoji && <span className="word-emoji">{word.emoji}</span>}
                                                    <div className="word-english">{word.english}</div>
                                                    <button
                                                        className="speak-btn-list"
                                                        onClick={() => speak(word.english)}
                                                        title="Listen"
                                                    >
                                                        🔊
                                                    </button>
                                                </div>
                                                <div className="word-separator">→</div>
                                                <div className="word-turkish-wrapper">
                                                    <div className="word-turkish">{word.turkish}</div>
                                                    {word.example && <div className="word-example">"{word.example}"</div>}
                                                </div>
                                            </div>
                                            <div
                                                className="word-category-badge"
                                            >
                                                {word.category || 'General'}
                                            </div>
                                            {word.partOfSpeech && (
                                                <div className="word-pos-badge">
                                                    {word.partOfSpeech}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className="card-actions">
                                    {editingId !== word.id && (
                                        <button
                                            onClick={() => startEditing(word)}
                                            className="edit-btn"
                                            title="Edit word"
                                        >
                                            ✎
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onDeleteWord(word.id)}
                                        className="delete-btn"
                                        aria-label="Delete word"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredWords.length > itemsPerPage && (
                        <div className="pagination-controls">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="pagination-btn"
                            >
                                ←
                            </button>
                            <span className="pagination-info">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="pagination-btn"
                            >
                                →
                            </button>
                        </div>
                    )}
                </>
            )}

            {showDeleteConfirm && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Confirm Deletion</h3>
                        <p>
                            {selectedFilter === 'all'
                                ? `Are you sure you want to delete ALL ${words.length} words?`
                                : `Are you sure you want to delete the category "${selectedFilter}"?`
                            }
                        </p>
                        <div className="modal-actions">
                            <button onClick={confirmDelete} className="confirm-delete-btn">Yes, Delete</button>
                            <button onClick={() => setShowDeleteConfirm(false)} className="cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
