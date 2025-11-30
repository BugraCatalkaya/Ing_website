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
import './App.css';

function AuthenticatedApp() {
  const { currentUser, logout } = useAuth();
  const { words, loading: wordsLoading, addWord, deleteWord, deleteWords, updateWordCategory, updateWord, importWords, updateWordStats, restoreWord, restoreWords } = useWords();
  const { history, addQuizResult, deleteQuizResult, clearHistory, getStreakStatus } = useQuizHistory();
  const quiz = useQuiz(words);
  const { toasts, addToast, removeToast } = useToast();
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'manage', 'study', 'quiz', 'history', or 'profile'
  const [isRecovering, setIsRecovering] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedFolderFilter, setSelectedFolderFilter] = useState('all');

  // Close login modal if user logs in
  useEffect(() => {
    if (currentUser) {
      setShowLoginModal(false);
    }
  }, [currentUser]);

  // Redirect to dashboard on logout if currently on profile page
  useEffect(() => {
    if (!currentUser && currentView === 'profile') {
      setCurrentView('dashboard');
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
        setCurrentView(view);
      }
    } else {
      // If leaving quiz view and quiz is finished, reset it so it doesn't trigger save again on return
      if (currentView === 'quiz' && quiz.isComplete) {
        quiz.resetQuiz();
      }
      setCurrentView(view);
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

      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">🧠</span>
          <h1>WordMaster</h1>
        </div>
        <nav className="main-nav">
          <button
            className={currentView === 'dashboard' ? 'active' : ''}
            onClick={() => handleViewChange('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={currentView === 'manage' ? 'active' : ''}
            onClick={() => handleViewChange('manage')}
          >
            Manage Words
          </button>
          <button
            className={currentView === 'study' ? 'active' : ''}
            onClick={() => handleViewChange('study')}
          >
            Study Cards
          </button>
          <button
            className={currentView === 'quiz' ? 'active' : ''}
            onClick={() => handleViewChange('quiz')}
          >
            Take Quiz
          </button>
          <button
            className={currentView === 'history' ? 'active' : ''}
            onClick={() => handleViewChange('history')}
          >
            History
          </button>

          {currentUser ? (
            <div className="profile-menu-wrapper">
              <button
                className={currentView === 'profile' ? 'active' : ''}
                onClick={() => handleViewChange('profile')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                👤 Profile
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
              style={{ marginLeft: 'auto', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none' }}
            >
              Login / Sign Up
            </button>
          )}
        </nav>
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
          <Flashcard words={words} />
        )}

        {currentView === 'quiz' && (
          <Quiz
            quiz={quiz}
            words={words}
            onQuizComplete={handleQuizComplete}
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
