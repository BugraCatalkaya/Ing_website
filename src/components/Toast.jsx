import { useState, useEffect, useCallback } from 'react';
import './Toast.css';

export const Toast = ({ message, type = 'info', duration = 3000, onUndo, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className={`toast toast-${type}`}>
            <span className="toast-message">{message}</span>
            {onUndo && (
                <button className="toast-undo-btn" onClick={onUndo}>
                    Undo ↩️
                </button>
            )}
            <button className="toast-close-btn" onClick={onClose}>✕</button>
        </div>
    );
};

export const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', onUndo = null) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, onUndo }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return { toasts, addToast, removeToast };
};
