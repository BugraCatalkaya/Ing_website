import React, { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export const Profile = ({ words, history, streakStatus, onLogout }) => {
    const { currentUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(currentUser?.photoURL || '');
    const [loading, setLoading] = useState(false);

    // Calculate stats
    const totalWords = words.length;
    const masteredWords = words.filter(w => w.level === 5).length;
    const totalQuizzes = history.length;
    const averageScore = totalQuizzes > 0
        ? Math.round(history.reduce((acc, curr) => acc + curr.score, 0) / totalQuizzes)
        : 0;

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            await updateProfile(currentUser, {
                photoURL: avatarUrl
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile picture.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="dashboard-container">
            <div className="welcome-section" style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <div style={{ position: 'relative', width: '120px', margin: '0 auto 1.5rem auto' }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3rem',
                        boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)',
                        border: '4px solid rgba(255,255,255,0.1)'
                    }}>
                        {currentUser?.photoURL ? (
                            <img src={currentUser.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span>👤</span>
                        )}
                    </div>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        style={{
                            position: 'absolute',
                            bottom: '0',
                            right: '0',
                            background: '#3b82f6',
                            border: 'none',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                        }}
                    >
                        ✏️
                    </button>
                </div>

                {isEditing && (
                    <div style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', maxWidth: '400px', margin: '0 auto 2rem auto' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Update Profile Picture</h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                                placeholder="Enter Image URL..."
                                style={{
                                    flex: 1,
                                    padding: '0.6rem',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(0,0,0,0.2)',
                                    color: 'white'
                                }}
                            />
                            <button
                                onClick={handleSaveProfile}
                                disabled={loading}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: '#10b981',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                {loading ? '...' : 'Save'}
                            </button>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                            Tip: You can use a URL from Imgur or other image hosts.
                        </p>
                    </div>
                )}

                <h1 style={{ marginBottom: '0.5rem' }}>{currentUser?.displayName || 'WordMaster Member'}</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{currentUser?.email}</p>

                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '2rem',
                    marginTop: '1.5rem',
                    color: '#94a3b8',
                    fontSize: '0.9rem'
                }}>
                    <div>
                        <span style={{ display: 'block', fontWeight: '600', color: '#e2e8f0' }}>Joined</span>
                        {formatDate(currentUser?.metadata?.creationTime)}
                    </div>
                    <div>
                        <span style={{ display: 'block', fontWeight: '600', color: '#e2e8f0' }}>Last Active</span>
                        {formatDate(currentUser?.metadata?.lastSignInTime)}
                    </div>
                </div>
            </div>

            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Statistics 📊</h2>
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📚</div>
                    <div className="stat-info">
                        <h3>Total Words</h3>
                        <p>{totalWords}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🎓</div>
                    <div className="stat-info">
                        <h3>Mastered</h3>
                        <p>{masteredWords}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🔥</div>
                    <div className="stat-info">
                        <h3>Current Streak</h3>
                        <p>{streakStatus.streak} Days</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📈</div>
                    <div className="stat-info">
                        <h3>Avg. Score</h3>
                        <p>{averageScore}%</p>
                    </div>
                </div>
            </div>

            <h2 style={{ marginBottom: '1.5rem', marginTop: '2rem', color: 'var(--text-primary)' }}>Mode Performance 🎯</h2>
            <div className="stats-grid">
                {['multiple-choice', 'fill-in', 'listening', 'reverse'].map(mode => {
                    const modeQuizzes = history.filter(h => h.mode === mode);
                    const avg = modeQuizzes.length > 0
                        ? Math.round(modeQuizzes.reduce((acc, curr) => acc + curr.percentage, 0) / modeQuizzes.length)
                        : 0;

                    const getIcon = (m) => {
                        switch (m) {
                            case 'listening': return '🎧';
                            case 'reverse': return '🔄';
                            case 'fill-in': return '✍️';
                            case 'multiple-choice': return '📝';
                            default: return '❓';
                        }
                    };

                    const getLabel = (m) => {
                        switch (m) {
                            case 'listening': return 'Listening';
                            case 'reverse': return 'Reverse';
                            case 'fill-in': return 'Fill-in';
                            case 'multiple-choice': return 'Multi-Choice';
                            default: return m;
                        }
                    };

                    return (
                        <div key={mode} className="stat-card" style={{ opacity: modeQuizzes.length ? 1 : 0.6 }}>
                            <div className="stat-icon" style={{ fontSize: '1.5rem' }}>{getIcon(mode)}</div>
                            <div className="stat-info">
                                <h3 style={{ fontSize: '0.9rem' }}>{getLabel(mode)}</h3>
                                <p style={{ fontSize: '1.2rem' }}>
                                    {modeQuizzes.length > 0 ? `${avg}%` : '-'}
                                </p>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                    {modeQuizzes.length} quizzes
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="action-buttons" style={{ marginTop: '3rem', justifyContent: 'center' }}>
                <button
                    onClick={onLogout}
                    className="action-btn"
                    style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        maxWidth: '200px'
                    }}
                >
                    <span className="btn-icon">🚪</span>
                    Log Out
                </button>
            </div>
        </div>
    );
};
