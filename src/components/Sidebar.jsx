import React from 'react';
import './Sidebar.css';

export const Sidebar = ({ isOpen, onClose, currentView, onViewChange, user, onLogout, onLoginClick }) => {
    return (
        <>
            {/* Overlay */}
            <div
                className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div
                        className="logo"
                        onClick={() => { onViewChange('dashboard'); onClose(); }}
                        style={{ cursor: 'pointer' }}
                    >
                        <span className="logo-icon">🧠</span>
                        <h1>WordMaster</h1>
                    </div>
                    <button className="close-sidebar-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
                        onClick={() => { onViewChange('dashboard'); onClose(); }}
                    >
                        <span className="nav-icon">📊</span>
                        Dashboard
                    </button>
                    <button
                        className={`nav-item ${currentView === 'manage' ? 'active' : ''}`}
                        onClick={() => { onViewChange('manage'); onClose(); }}
                    >
                        <span className="nav-icon">📝</span>
                        Manage Words
                    </button>
                    <button
                        className={`nav-item ${currentView === 'folders' ? 'active' : ''}`}
                        onClick={() => { onViewChange('folders'); onClose(); }}
                    >
                        <span className="nav-icon">📁</span>
                        Folders
                    </button>
                    <button
                        className={`nav-item ${currentView === 'study' ? 'active' : ''}`}
                        onClick={() => { onViewChange('study'); onClose(); }}
                    >
                        <span className="nav-icon">🎴</span>
                        Study Cards
                    </button>
                    <button
                        className={`nav-item ${currentView === 'quiz' ? 'active' : ''}`}
                        onClick={() => { onViewChange('quiz'); onClose(); }}
                    >
                        <span className="nav-icon">❓</span>
                        Take Quiz
                    </button>
                    <button
                        className={`nav-item ${currentView === 'history' ? 'active' : ''}`}
                        onClick={() => { onViewChange('history'); onClose(); }}
                    >
                        <span className="nav-icon">📜</span>
                        History
                    </button>
                </nav>

                <div className="sidebar-footer">
                    {user ? (
                        <div className="user-info">
                            <button
                                className={`nav-item ${currentView === 'profile' ? 'active' : ''}`}
                                onClick={() => { onViewChange('profile'); onClose(); }}
                            >
                                <span className="nav-icon">👤</span>
                                Profile
                            </button>
                            <button className="nav-item logout" onClick={() => { onLogout(); onClose(); }}>
                                <span className="nav-icon">🚪</span>
                                Logout
                            </button>
                        </div>
                    ) : (
                        <button className="login-btn-sidebar" onClick={() => { onLoginClick(); onClose(); }}>
                            Login / Sign Up
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};
