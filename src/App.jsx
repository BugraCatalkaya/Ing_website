import { useState, useCallback, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { useWords } from './hooks/useWords';
import { useQuiz } from './hooks/useQuiz';
import { useQuizHistory } from './hooks/useQuizHistory';
import { Dashboard } from './components/Dashboard';
import { WordForm } from './components/WordForm';
import { WordList } from './components/WordList';
import { Quiz } from './components/Quiz';
import { QuizHistory } from './components/QuizHistory';
import { Flashcard } from './components/Flashcard';
import { OnboardingWizard } from './components/OnboardingWizard';
import { Profile } from './components/Profile';
import { ProfileDropdown } from './components/ProfileDropdown';
import { Toast, useToast } from './components/Toast';
import { Sidebar } from './components/Sidebar';
import './App.css';
import { FolderManager } from './components/FolderManager';

function AuthenticatedApp() {
  const { currentUser, logout } = useAuth();
  const { words, loading: wordsLoading, addWord, deleteWord, deleteWords, updateWordCategory, updateWord, importWords, updateWordStats, restoreWord, restoreWords } = useWords();
  const { history, addQuizResult, deleteQuizResult, clearHistory, getStreakStatus } = useQuizHistory();
  const quiz = useQuiz(words);
  const { toasts, addToast, removeToast } = useToast();
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'folders', 'manage', 'study', 'quiz', 'history', 'profile'
  const [isRecovering, setIsRecovering] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedFolderFilter, setSelectedFolderFilter] = useState('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Folder & Set Management State
  const [folders, setFolders] = useState(() => {
    const saved = localStorage.getItem('user_folders');
    return saved ? JSON.parse(saved) : ['General'];
  });
  const [activeFolder, setActiveFolder] = useState(null);
  const [activeSet, setActiveSet] = useState(null);
  const [studyFilter, setStudyFilter] = useState(null); // { folder: string, set?: string }
  const [quizFilter, setQuizFilter] = useState(null); // { folder: string, set?: string }
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderNameHeader, setNewFolderNameHeader] = useState('');
  const [customSets, setCustomSets] = useState(() => {
    const saved = localStorage.getItem('user_sets');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync folders with words and localStorage
  useEffect(() => {
    const wordFolders = [...new Set(words.map(w => w.folder || 'General'))];
    setFolders(prev => {
      const combined = [...new Set([...prev, ...wordFolders])].sort();
      // Only update if different to avoid loops
      if (JSON.stringify(combined) !== JSON.stringify(prev)) {
        return combined;
      }
      return prev;
    });
  }, [words]);

  useEffect(() => {
    localStorage.setItem('user_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('user_sets', JSON.stringify(customSets));
  }, [customSets]);

  // Hash-based routing helper
  const updateHash = (view, folder = null, set = null) => {
    let hash = `#${view}`;
    if (folder) {
      hash += `/${encodeURIComponent(folder)}`;
      if (set) {
        hash += `/${encodeURIComponent(set)}`;
      }
    }
    window.location.hash = hash;
  };

  // Handle hash changes (Browser Back/Forward)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove #
      if (!hash) {
        setCurrentView('dashboard');
        setActiveFolder(null);
        setActiveSet(null);
        setStudyFilter(null);
        setQuizFilter(null);
        return;
      }

      const parts = hash.split('/').map(decodeURIComponent);
      const view = parts[0];
      const folder = parts[1] || null;
      const set = parts[2] || null;

      // Handle special study routes with filters
      if (view === 'study' && folder) {
        setStudyFilter({ folder, set });
        setCurrentView('study');
        setActiveFolder(null); // Clear folder manager state
        setActiveSet(null);
        setQuizFilter(null);
        return;
      }

      if (view === 'quiz' && folder) {
        setQuizFilter({ folder, set });
        setCurrentView('quiz');
        setActiveFolder(null);
        setActiveSet(null);
        setStudyFilter(null);
        return;
      }

      setCurrentView(view);

      if (view === 'folders') {
        setActiveFolder(folder);
        setActiveSet(set);
        setStudyFilter(null); // Clear study filter
        setQuizFilter(null);
      } else {
        setActiveFolder(null);
        setActiveSet(null);
        setStudyFilter(null); // Clear study filter
        setQuizFilter(null);
      }
    };

    // Initial load
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleCreateFolder = (name) => {
    if (!name.trim()) return;
    setFolders(prev => [...new Set([...prev, name.trim()])].sort());
    addToast(`Folder "${name}" created!`, 'success');
    // Navigate to the new folder
    updateHash('folders', name.trim());
  };

  const handleCreateSet = (folder, set) => {
    if (!set.trim()) return;
    setCustomSets(prev => {
      if (prev.some(s => s.folder === folder && s.set === set)) return prev;
      return [...prev, { folder, set }];
    });
    addToast(`Set "${set}" created!`, 'success');
    updateHash('folders', folder, set);
  };

  // Close login modal if user logs in
  useEffect(() => {
    if (currentUser) {
      setShowLoginModal(false);
    }
  }, [currentUser]);

  // Redirect to dashboard on logout if currently on profile page
  useEffect(() => {
    if (!currentUser && currentView === 'profile') {
      updateHash('dashboard');
    }
  }, [currentUser, currentView]);

  // Show wizard if no words exist on initial load
  useEffect(() => {
    if (!wordsLoading && words.length === 0) {
      setShowWizard(true);
    }
  }, [wordsLoading, words.length]);

  const handleWizardComplete = (newWords) => {
    if (newWords.length > 0) {
      importWords(newWords);
      addToast(`Added ${newWords.length} new words!`, 'success');
    }
    setShowWizard(false);
  };

  const handleDeleteWord = (id) => {
    const wordToDelete = words.find(w => w.id === id);
    if (wordToDelete) {
      deleteWord(id);
      addToast(
        `Deleted "${wordToDelete.english}"`,
        'info',
        () => {
          restoreWord(wordToDelete);
          addToast(`Restored "${wordToDelete.english}"`, 'success');
        }
      );
    }
  };

  const handleDeleteWords = (ids, categoryName = 'selected words') => {
    const wordsToDelete = words.filter(w => ids.includes(w.id));
    if (wordsToDelete.length > 0) {
      deleteWords(ids);
      addToast(
        `Deleted ${wordsToDelete.length} words from ${categoryName}`,
        'info',
        () => {
          restoreWords(wordsToDelete);
          addToast(`Restored ${wordsToDelete.length} words`, 'success');
        }
      );
    }
  };

  const handleViewChange = (view) => {
    // Check if a quiz is currently active
    const isQuizActive = currentView === 'quiz' && quiz.questions && !quiz.isComplete;

    if (isQuizActive) {
      // If trying to navigate away OR clicking Quiz button again while active
      if (window.confirm('⚠️ You are currently taking a quiz.\n\nAre you sure you want to exit? Your progress will be lost.')) {
        quiz.resetQuiz();
        setIsRecovering(false);
        updateHash(view);
      }
    } else {
      // If leaving quiz view and quiz is finished, reset it so it doesn't trigger save again on return
      if (currentView === 'quiz' && quiz.isComplete) {
        quiz.resetQuiz();
      }
      updateHash(view);
    }
  };

  const handleRecoverStreak = () => {
    setIsRecovering(true);
    quiz.resetQuiz(); // Ensure fresh quiz
    setCurrentView('quiz');
  };

  const handleQuizComplete = useCallback((result) => {
    if (!result.isReview) {
      // Update stats for each word
      result.results.forEach(r => {
        updateWordStats(r.question.word.id, r.isCorrect);
      });

      if (isRecovering) {
        // If recovering, save result for YESTERDAY
        const yesterday = new Date(Date.now() - 86400000).toISOString();
        addQuizResult(result, yesterday);
        setIsRecovering(false);
        alert("🔥 Streak Recovered! Great job!");
      } else {
        addQuizResult(result);
      }
    }
  }, [addQuizResult, isRecovering, updateWordStats]);

  // Filter words for Study mode
  const getStudyWords = () => {
    if (!studyFilter) return words;
    return words.filter(w => {
      const matchFolder = !studyFilter.folder || (w.folder || 'General') === studyFilter.folder;
      const matchSet = !studyFilter.set || (w.category || 'General') === studyFilter.set;
      return matchFolder && matchSet;
    });
  };

  return (
    <div className="app">
      {showLoginModal && !currentUser && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLoginModal(false);
          }}
        >
          <div style={{ position: 'relative', width: '100%', maxWidth: '450px' }}>
            <button
              onClick={() => setShowLoginModal(false)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '2rem',
                cursor: 'pointer',
                zIndex: 1001,
                lineHeight: 1
              }}
            >
              ×
            </button>
            <Login />
          </div>
        </div>
      )}

      {/* Create Folder Modal (Header) */}
      {showCreateFolderModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target.className === 'modal-overlay') setShowCreateFolderModal(false);
        }}>
          <div className="modal-content">
            <h3>Create New Folder</h3>
            <input
              type="text"
              value={newFolderNameHeader}
              onChange={(e) => setNewFolderNameHeader(e.target.value)}
              placeholder="Folder Name"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'rgba(30, 35, 60, 0.6)',
                color: 'white',
                marginBottom: '1.5rem',
                fontSize: '1rem'
              }}
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={() => {
                if (newFolderNameHeader.trim()) {
                  handleCreateFolder(newFolderNameHeader);
                  setNewFolderNameHeader('');
                  setShowCreateFolderModal(false);
                  // Optionally navigate to folders view
                  setCurrentView('folders');
                }
              }} className="confirm-delete-btn" style={{ background: 'var(--accent-primary)' }}>Create</button>
              <button onClick={() => setShowCreateFolderModal(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showWizard && (
        <OnboardingWizard
          onComplete={handleWizardComplete}
          onSkip={() => setShowWizard(false)}
        />
      )}

      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onUndo={() => {
              if (toast.onUndo) toast.onUndo();
              removeToast(toast.id);
            }}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentView={currentView}
        onViewChange={handleViewChange}
        user={currentUser}
        onLogout={logout}
        onLoginClick={() => setShowLoginModal(true)}
      />

      <header className="app-header">
        <div className="header-left">
          <button
            className="hamburger-btn"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>

          <div
            className="logo"
            onClick={() => handleViewChange('dashboard')}
            style={{ cursor: 'pointer' }}
            title="Go to Dashboard"
          >
            <span className="logo-icon">🧠</span>
            <h1>WordMaster</h1>
          </div>
        </div>

        <div className="header-right">
          <button
            className="login-btn-header"
            style={{ marginRight: '1rem', padding: '0.5rem 1rem', fontSize: '1.2rem' }}
            onClick={() => setShowCreateFolderModal(true)}
            title="Create New Folder"
          >
            +
          </button>

          {currentUser ? (
            <div className="profile-menu-wrapper">
              <button
                className={`profile-btn-header ${currentView === 'profile' ? 'active' : ''}`}
                onClick={() => handleViewChange('profile')}
              >
                <span className="profile-icon">👤</span>
                <span className="profile-text">Profile</span>
              </button>
              <ProfileDropdown
                user={currentUser}
                onLogout={logout}
                onNavigate={handleViewChange}
              />
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="login-btn-header"
            >
              Login / Sign Up
            </button>
          )}
        </div>
      </header>

      <main className="app-content">
        {currentView === 'dashboard' && (
          <Dashboard
            words={words}
            history={history}
            onNavigate={handleViewChange}
            onRecoverStreak={handleRecoverStreak}
            streakStatus={getStreakStatus()}
          />
        )}

        {currentView === 'folders' && (
          <FolderManager
            words={words}
            folders={folders}
            customSets={customSets}
            activeFolder={activeFolder}
            activeSet={activeSet}
            onNavigateFolder={(folder) => updateHash('folders', folder)}
            onNavigateSet={(set) => updateHash('folders', activeFolder, set)}
            onCreateFolder={handleCreateFolder}
            onCreateSet={(setName) => handleCreateSet(activeFolder, setName)}
            onStudyFolder={(folder) => {
              updateHash('study', folder);
            }}
            onStudySet={(folder, set) => {
              updateHash('study', folder, set);
            }}
            onQuizFolder={(folder) => {
              updateHash('quiz', folder);
            }}
            onQuizSet={(folder, set) => {
              updateHash('quiz', folder, set);
            }}
            onAddWord={(...args) => {
              addWord(...args);
              addToast('Word added successfully!', 'success');
            }}
            onDeleteWord={handleDeleteWord}
            onDeleteWords={handleDeleteWords}
            onUpdateWord={(id, data) => {
              updateWord(id, data);
              addToast('Word updated!', 'success');
            }}
            onUpdateCategory={updateWordCategory}
            onDeleteFolder={(folderName) => {
              const wordsToDelete = words.filter(w => (w.folder || 'General') === folderName);
              if (wordsToDelete.length > 0) {
                deleteWords(wordsToDelete.map(w => w.id));
              }
              setFolders(prev => prev.filter(f => f !== folderName));
              setCustomSets(prev => prev.filter(s => s.folder !== folderName));
              addToast(`Folder "${folderName}" deleted`, 'success');
              updateHash('folders');
            }}
            onDeleteSet={(folderName, setName) => {
              const wordsToDelete = words.filter(w =>
                (w.folder || 'General') === folderName &&
                (w.category || 'General') === setName
              );
              if (wordsToDelete.length > 0) {
                deleteWords(wordsToDelete.map(w => w.id));
              }
              setCustomSets(prev => prev.filter(s => !(s.folder === folderName && s.set === setName)));
              addToast(`Set "${setName}" deleted`, 'success');
              updateHash('folders', folderName);
            }}
          />
        )}

        {currentView === 'manage' && (
          <div className="manage-view">
            <WordForm
              onAddWord={(...args) => {
                addWord(...args);
                addToast('Word added successfully!', 'success');
                // args[6] is the folder. If provided, switch filter to it.
                if (args[6] && args[6] !== 'General') {
                  setSelectedFolderFilter(args[6]);
                }
              }}
              categories={['General', ...new Set(words.map(w => w.category || 'General'))]}
              folders={['General', ...new Set(words.map(w => w.folder || 'General'))]}
              words={words}
            />
            <WordList
              words={words}
              history={history}
              onDeleteWord={handleDeleteWord}
              onDeleteWords={handleDeleteWords}
              onUpdateCategory={updateWordCategory}
              onUpdateWord={(id, data) => {
                updateWord(id, data);
                addToast('Word updated!', 'success');
              }}
              onImportWords={(newWords) => {
                importWords(newWords);
                addToast(`Imported ${newWords.length} words!`, 'success');
              }}
              categories={['General', ...new Set(words.map(w => w.category || 'General'))]}
              selectedFolderFilter={selectedFolderFilter}
              onFolderFilterChange={setSelectedFolderFilter}
            />
          </div>
        )}

        {currentView === 'study' && (
          <Flashcard
            words={getStudyWords()}
            initialFolder={studyFilter?.folder}
            initialCategory={studyFilter?.set}
            onExit={() => {
              if (studyFilter?.folder && studyFilter?.set) {
                updateHash('folders', studyFilter.folder, studyFilter.set);
              } else if (studyFilter?.folder) {
                updateHash('folders', studyFilter.folder);
              } else {
                updateHash('folders');
              }
            }}
          />
        )}

        {currentView === 'quiz' && (
          <Quiz
            quiz={quiz}
            words={words}
            initialFolder={quizFilter?.folder}
            initialCategory={quizFilter?.set}
            onQuizComplete={handleQuizComplete}
            onExit={() => {
              if (quizFilter?.folder && quizFilter?.set) {
                updateHash('folders', quizFilter.folder, quizFilter.set);
              } else if (quizFilter?.folder) {
                updateHash('folders', quizFilter.folder);
              } else {
                updateHash('folders');
              }
            }}
          />
        )}

        {currentView === 'history' && (
          <QuizHistory
            history={history}
            onDeleteResult={deleteQuizResult}
            onClearHistory={clearHistory}
          />
        )}

        {currentView === 'profile' && (
          <Profile
            words={words}
            history={history}
            streakStatus={getStreakStatus()}
            onLogout={logout}
          />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
