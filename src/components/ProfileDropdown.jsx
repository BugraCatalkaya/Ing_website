import React from 'react';
import './ProfileDropdown.css';

export const ProfileDropdown = ({ user, onLogout, onNavigate }) => {
    return (
        <div className="profile-dropdown">
            <div className="dropdown-header">
                {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="dropdown-user-img" />
                ) : (
                    <div className="dropdown-user-icon">👤</div>
                )}
                <div className="dropdown-user-info">
                    <span className="dropdown-email">{user.email}</span>
                    <span className="dropdown-role">Member</span>
                </div>
            </div>

            <div className="dropdown-menu-items">
                <button
                    onClick={() => onNavigate('profile')}
                    className="dropdown-item-btn"
                >
                    👤 My Account
                </button>
            </div>

            <div className="dropdown-actions">
                <button onClick={onLogout} className="dropdown-logout-btn">
                    🚪 Log Out
                </button>
            </div>
        </div>
    );
};
