import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSpeech } from '../hooks/useSpeech';

import { WordPacks } from './WordPacks';
import './WordList.css';

export const WordList = ({ words, history, onDeleteWord, onDeleteWords, onUpdateCategory, onUpdateWord, onImportWords, categories, selectedFolderFilter, onFolderFilterChange, forcedSetFilter, hideFilters }) => {
    const { speak } = useSpeech();
    const [editingId, setEditingId] = useState(null);
    const [tempCategory, setTempCategory] = useState('');
    const [tempFolder, setTempFolder] = useState('');
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [isCreatingNewFolder, setIsCreatingNewFolder] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newFolderName, setNewFolderName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState(forcedSetFilter || 'all');
    // selectedFolderFilter is now a prop
    const [editForm, setEditForm] = useState({ english: '', turkish: '', example: '', partOfSpeech: '', folder: '' });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Number of words to display per page

    // Update selectedFilter if forcedSetFilter changes
    useEffect(() => {
        if (forcedSetFilter) {
            setSelectedFilter(forcedSetFilter);
        }
    }, [forcedSetFilter]);

    // Reset currentPage to 1 whenever filters or search terms change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedFilter, selectedFolderFilter]);

    const startEditing = (word) => {
        setEditingId(word.id);
        setTempCategory(word.category || 'General');
        setTempFolder(word.folder || 'General');
        setEditForm({
            english: word.english,
            turkish: word.turkish,
            example: word.example || '',
            partOfSpeech: word.partOfSpeech || '',
            folder: word.folder || 'General'
        });
        setIsCreatingNew(false);
        setIsCreatingNewFolder(false);
        setNewCategoryName('');
        setNewFolderName('');
    };

    const cancelEditing = () => {
        setEditingId(null);
        setTempCategory('');
        setTempFolder('');
        setEditForm({ english: '', turkish: '', example: '', partOfSpeech: '', folder: '' });
        setIsCreatingNew(false);
        setIsCreatingNewFolder(false);
        setNewCategoryName('');
        setNewFolderName('');
    };

    const saveEdit = (id) => {
        const categoryToSave = isCreatingNew ? newCategoryName.trim() : tempCategory;
        const folderToSave = isCreatingNewFolder ? newFolderName.trim() : tempFolder;

        if (editForm.english && editForm.turkish) {
            onUpdateWord(id, {
                ...editForm,
                category: categoryToSave || 'General',
                folder: folderToSave || 'General'
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

    const handleFolderChange = (e) => {
        const value = e.target.value;
        if (value === 'new_folder_custom_value') {
            setIsCreatingNewFolder(true);
            setTempFolder('');
        } else {
            setIsCreatingNewFolder(false);
            setTempFolder(value);
        }
    };

    const uniqueCategories = ['General', ...new Set(categories)].filter(c => c !== 'General').sort();
    const uniqueFolders = ['General', ...new Set(words.map(w => w.folder || 'General'))].filter(f => f !== 'General').sort();

    // Filter words based on selected category AND search term
    const filteredWords = words.filter(word => {
        const matchesCategory = selectedFilter === 'all' || (word.category || 'General') === selectedFilter;
        const matchesFolder = selectedFolderFilter === 'all' || (word.folder || 'General') === selectedFolderFilter;
        const matchesSearch = searchTerm === '' ||
            word.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
            word.turkish.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesCategory && matchesFolder && matchesSearch;
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredWords.length / itemsPerPage);
    const indexOfLastWord = currentPage * itemsPerPage;
    const indexOfFirstWord = indexOfLastWord - itemsPerPage;
    const currentWords = filteredWords.slice(indexOfFirstWord, indexOfLastWord);

    const allCategories = ['all', ...new Set(words.map(w => w.category || 'General'))];
    const allFolders = ['all', ...new Set(words.map(w => w.folder || 'General'))];

    const handleDeleteCategory = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const wordsToDelete = filteredWords;

        if (wordsToDelete.length === 0) {
            alert("No words found to delete in this view.");
            return;
        }
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        const categoryName = selectedFilter === 'all' ? 'All Categories' : selectedFilter;
        const wordsToDelete = filteredWords;

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
                {!hideFilters && (
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

                        <div className="filter-group">
                            <label htmlFor="folder-filter" className="filter-label">Filter by Folder:</label>
                            <select
                                id="folder-filter"
                                value={selectedFolderFilter}
                                onChange={(e) => {
                                    onFolderFilterChange(e.target.value);
                                    if (!forcedSetFilter) setSelectedFilter('all'); // Reset set filter when folder changes, unless forced
                                }}
                                className="premium-filter-select"
                            >
                                <option value="all">All Folders</option>
                                {allFolders.filter(f => f !== 'all').map(f => (
                                    <option key={f} value={f}>
                                        📁 {f}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="category-filter" className="filter-label">Filter by Set:</label>
                            <select
                                id="category-filter"
                                value={selectedFilter}
                                onChange={(e) => setSelectedFilter(e.target.value)}
                                className="premium-filter-select"
                                disabled={!!forcedSetFilter}
                            >
                                <option value="all">All Sets</option>
                                {/* Filter Sets based on selected Folder */}
                                {['all', ...new Set(words
                                    .filter(w => selectedFolderFilter === 'all' || (w.folder || 'General') === selectedFolderFilter)
                                    .map(w => w.category || 'General')
                                )].filter(c => c !== 'all').sort().map(c => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {words.length > 0 && (
                            <button
                                type="button"
                                className="delete-category-btn"
                                onClick={handleDeleteCategory}
                                title="Delete filtered words"
                                style={{ cursor: 'pointer', zIndex: 1000, position: 'relative' }}
                            >
                                🗑️
                            </button>
                        )}
                    </div>
                )}
                {/* Show simplified search if filters are hidden */}
                {hideFilters && (
                    <div className="filter-controls simple">
                        <div className="search-wrapper" style={{ width: '100%' }}>
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search in this set..."
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
                    </div>
                )}
            </div>

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
                                                {/* Folder Edit */}
                                                {!isCreatingNewFolder ? (
                                                    <select
                                                        value={tempFolder}
                                                        onChange={handleFolderChange}
                                                        className="category-edit-select"
                                                        style={{ marginRight: '0.5rem' }}
                                                    >
                                                        <option value="General">General</option>
                                                        {uniqueFolders.map(f => (
                                                            <option key={f} value={f}>{f}</option>
                                                        ))}
                                                        <option value="new_folder_custom_value">+ New Folder</option>
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={newFolderName}
                                                        onChange={(e) => setNewFolderName(e.target.value)}
                                                        placeholder="New folder name"
                                                        className="category-edit-input"
                                                        style={{ marginRight: '0.5rem' }}
                                                    />
                                                )}

                                                {/* Category Edit */}
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
                                                        <option value="new_category_custom_value">+ New Set</option>
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={newCategoryName}
                                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                                        placeholder="New set name"
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
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                <div className="word-category-badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                                    📁 {word.folder || 'General'}
                                                </div>
                                                <div className="word-category-badge">
                                                    {word.category || 'General'}
                                                </div>
                                                {word.partOfSpeech && (
                                                    <div className="word-pos-badge">
                                                        {word.partOfSpeech}
                                                    </div>
                                                )}
                                            </div>
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

            <div style={{ marginTop: '3rem' }}>
                <WordPacks onImportWords={onImportWords} />
            </div>

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
