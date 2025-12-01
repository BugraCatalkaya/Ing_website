import { useState } from 'react';
import { createPortal } from 'react-dom';
import { WordList } from './WordList';
import { WordForm } from './WordForm';
import './FolderManager.css';

export const FolderManager = ({
    words,
    folders,
    activeFolder,
    activeSet,
    onNavigateFolder,
    onNavigateSet,
    onCreateFolder,
    onCreateSet,
    onStudyFolder,
    onStudySet,
    onQuizSet,
    onAddWord,
    onDeleteWord,
    onDeleteWords,
    onUpdateWord,
    onUpdateCategory,
    onDeleteFolder,
    onDeleteSet,
    customSets
}) => {
    const [newFolderName, setNewFolderName] = useState('');
    const [newSetName, setNewSetName] = useState('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [isCreatingSet, setIsCreatingSet] = useState(false);
    const [isAddingWord, setIsAddingWord] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ show: false, type: null, folder: null, set: null });

    const handleDeleteClick = (type, folder, set = null) => {
        setDeleteModal({ show: true, type, folder, set });
    };

    const confirmDelete = () => {
        if (deleteModal.type === 'folder') {
            onDeleteFolder(deleteModal.folder);
        } else if (deleteModal.type === 'set') {
            onDeleteSet(deleteModal.folder, deleteModal.set);
        }
        setDeleteModal({ show: false, type: null, folder: null, set: null });
    };

    // Level 1: Folder List
    if (!activeFolder) {
        return (
            <div className="folder-manager-container">
                <div className="folder-header">
                    <h2>My Folders</h2>
                    <button className="create-btn" onClick={() => setIsCreatingFolder(true)}>
                        + New Folder
                    </button>
                </div>

                {isCreatingFolder && (
                    <div className="create-form-inline">
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="Folder Name"
                            autoFocus
                        />
                        <div className="create-actions">
                            <button onClick={() => {
                                if (newFolderName.trim()) {
                                    onCreateFolder(newFolderName);
                                    setNewFolderName('');
                                    setIsCreatingFolder(false);
                                }
                            }} className="confirm-btn">Create</button>
                            <button onClick={() => setIsCreatingFolder(false)} className="cancel-btn">Cancel</button>
                        </div>
                    </div>
                )}

                <div className="folders-grid">
                    {folders.map(folder => {
                        const folderWords = words.filter(w => (w.folder || 'General') === folder);
                        const derivedSets = new Set(folderWords.map(w => w.category || 'General'));
                        const explicitSets = (customSets || []).filter(s => s.folder === folder).map(s => s.set);
                        const setCounts = new Set([...derivedSets, ...explicitSets]).size;

                        return (
                            <div key={folder} className="folder-card" onClick={() => onNavigateFolder(folder)}>
                                <div className="folder-icon">📁</div>
                                <div className="folder-info">
                                    <h3>{folder}</h3>
                                    <p>{folderWords.length} words • {setCounts} sets</p>
                                </div>
                                <div className="folder-arrow">→</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Level 2: Folder Detail (Set List)
    if (activeFolder && !activeSet) {
        const folderWords = words.filter(w => (w.folder || 'General') === activeFolder);
        // Derive sets from words. Include 'General' if it exists.
        const derivedSets = new Set(folderWords.map(w => w.category || 'General'));
        // Get custom sets for this folder
        const explicitSets = (customSets || []).filter(s => s.folder === activeFolder).map(s => s.set);
        // Merge and sort
        const sets = [...new Set([...derivedSets, ...explicitSets])].sort();

        return (
            <div className="folder-manager-container">
                <div className="navigation-breadcrumb">
                    <span onClick={() => onNavigateFolder(null)} className="breadcrumb-link">Folders</span>
                    <span className="breadcrumb-separator">/</span>
                    <span className="breadcrumb-current">{activeFolder}</span>
                </div>

                <div className="folder-header">
                    <h2>{activeFolder}</h2>
                    <div className="header-actions">
                        <button className="study-btn" onClick={() => onStudyFolder(activeFolder)}>
                            📚 Study Folder
                        </button>
                        <button className="create-btn" onClick={() => setIsCreatingSet(true)}>
                            + New Set
                        </button>
                        <button
                            onClick={() => handleDeleteClick('folder', activeFolder)}
                            style={{
                                marginLeft: '0.5rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            🗑️ Delete Folder
                        </button>
                    </div>
                </div>

                {isCreatingSet && (
                    <div className="create-form-inline">
                        <input
                            type="text"
                            value={newSetName}
                            onChange={(e) => setNewSetName(e.target.value)}
                            placeholder="Set Name"
                            autoFocus
                        />
                        <div className="create-actions">
                            <button onClick={() => {
                                if (newSetName.trim()) {
                                    onCreateSet(newSetName);
                                    setNewSetName('');
                                    setIsCreatingSet(false);
                                }
                            }} className="confirm-btn">Create</button>
                            <button onClick={() => setIsCreatingSet(false)} className="cancel-btn">Cancel</button>
                        </div>
                    </div>
                )}

                <div className="sets-grid">
                    {sets.map(set => {
                        const setWords = folderWords.filter(w => (w.category || 'General') === set);
                        return (
                            <div key={set} className="set-card" onClick={() => onNavigateSet(set)}>
                                <div className="set-icon">📑</div>
                                <div className="set-info">
                                    <h3>{set}</h3>
                                    <p>{setWords.length} words</p>
                                </div>
                                <div className="set-arrow">→</div>
                            </div>
                        );
                    })}
                    {sets.length === 0 && !isCreatingSet && (
                        <div className="empty-sets-message">
                            No sets yet. Create one to start adding words!
                        </div>
                    )}
                </div>

                {deleteModal.show && createPortal(
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3>Confirm Deletion</h3>
                            <p>
                                {deleteModal.type === 'folder'
                                    ? `Are you sure you want to delete folder "${deleteModal.folder}" and all its contents?`
                                    : `Are you sure you want to delete set "${deleteModal.set}" and all its contents?`
                                }
                            </p>
                            <div className="modal-actions">
                                <button onClick={confirmDelete} className="confirm-delete-btn">Yes, Delete</button>
                                <button onClick={() => setDeleteModal({ show: false, type: null, folder: null, set: null })} className="cancel-btn">Cancel</button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        );
    }

    // Level 3: Set Detail (Word List)
    if (activeFolder && activeSet) {
        // Filter words for this set
        const setWords = words.filter(w =>
            (w.folder || 'General') === activeFolder &&
            (w.category || 'General') === activeSet
        );

        return (
            <div className="folder-manager-container">
                <div className="navigation-breadcrumb">
                    <span onClick={() => onNavigateFolder(null)} className="breadcrumb-link">Folders</span>
                    <span className="breadcrumb-separator">/</span>
                    <span onClick={() => onNavigateSet(null)} className="breadcrumb-link">{activeFolder}</span>
                    <span className="breadcrumb-separator">/</span>
                    <span className="breadcrumb-current">{activeSet}</span>
                </div>

                <div className="folder-header">
                    <h2>{activeSet}</h2>
                    <div className="header-actions">
                        <button className="study-btn" onClick={() => onStudySet(activeFolder, activeSet)}>
                            🎓 Study Set
                        </button>
                        <button
                            className="study-btn"
                            onClick={() => onQuizSet(activeFolder, activeSet)}
                            style={{ marginLeft: '0.5rem', background: '#8b5cf6' }}
                        >
                            🎯 Quiz Set
                        </button>
                        <button
                            onClick={() => handleDeleteClick('set', activeFolder, activeSet)}
                            style={{
                                marginLeft: '0.5rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            🗑️ Delete Set
                        </button>
                    </div>
                </div>

                <div className="set-content">
                    <div className="word-list-section">
                        <WordList
                            words={words}
                            selectedFolderFilter={activeFolder}
                            forcedSetFilter={activeSet}
                            onDeleteWord={onDeleteWord}
                            onDeleteWords={onDeleteWords}
                            onUpdateWord={onUpdateWord}
                            onUpdateCategory={onUpdateCategory}
                            categories={[activeSet]}
                            hideFilters={true}
                        />
                    </div>

                    <div className="add-word-section" style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                        {!isAddingWord ? (
                            <button
                                onClick={() => setIsAddingWord(true)}
                                className="create-btn"
                                style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', justifyContent: 'center' }}
                            >
                                + Add New Word to Set
                            </button>
                        ) : (
                            <div className="word-form-wrapper">
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                                    <button
                                        onClick={() => setIsAddingWord(false)}
                                        className="cancel-btn"
                                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                                <WordForm
                                    onAddWord={(...args) => {
                                        onAddWord(...args, activeSet, activeFolder);
                                    }}
                                    categories={[activeSet]}
                                    folders={[activeFolder]}
                                    words={words}
                                    initialCategory={activeSet}
                                    initialFolder={activeFolder}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {deleteModal.show && createPortal(
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3>Confirm Deletion</h3>
                            <p>
                                {deleteModal.type === 'folder'
                                    ? `Are you sure you want to delete folder "${deleteModal.folder}" and all its contents?`
                                    : `Are you sure you want to delete set "${deleteModal.set}" and all its contents?`
                                }
                            </p>
                            <div className="modal-actions">
                                <button onClick={confirmDelete} className="confirm-delete-btn">Yes, Delete</button>
                                <button onClick={() => setDeleteModal({ show: false, type: null, folder: null, set: null })} className="cancel-btn">Cancel</button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        );
    }
};
