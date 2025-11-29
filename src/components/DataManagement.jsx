import { useRef, useState } from 'react';
import './DataManagement.css';

export const DataManagement = ({ words, history, onImportWords, onImportHistory }) => {
    const fileInputRef = useRef(null);
    const [message, setMessage] = useState('');
    const [showRawData, setShowRawData] = useState(false);

    const getBackupData = () => {
        return JSON.stringify({
            words,
            history,
            exportDate: new Date().toISOString(),
            version: '1.0'
        }, null, 2);
    };

    const handleExport = () => {
        const fileName = `english-study-backup-${new Date().toISOString().slice(0, 10)}.json`;
        const jsonString = getBackupData();
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Try to open in new tab first (often works better in restricted environments)
        const newWindow = window.open(url, '_blank');

        // Also trigger the download link as a backup
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (newWindow) {
            setMessage('Opened in new tab! Press Ctrl+S to save. 📂');
        } else {
            setMessage('Attempting download... If it fails, use "Copy Data". ⚠️');
        }

        setTimeout(() => setMessage(''), 5000);
    };

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(getBackupData())
            .then(() => {
                setMessage('Data copied to clipboard! 📋 Paste it into a text file to save.');
                setTimeout(() => setMessage(''), 5000);
            })
            .catch(err => {
                console.error('Failed to copy:', err);
                setMessage('Failed to copy data ❌');
            });
    };

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);

                if (data.words && Array.isArray(data.words)) {
                    onImportWords(data.words);
                }

                if (data.history && Array.isArray(data.history)) {
                    onImportHistory(data.history);
                }

                setMessage('Backup restored successfully! 🎉');
                setTimeout(() => setMessage(''), 3000);
            } catch (error) {
                console.error('Import error:', error);
                setMessage('Error reading file. Invalid format. ❌');
            }
        };
        reader.readAsText(file);

        // Reset input so same file can be selected again
        e.target.value = '';
    };

    return (
        <div className="data-management">
            <div className="data-actions">
                <button className="data-btn export-btn" onClick={handleExport}>
                    📥 Backup Data
                </button>
                <button className="data-btn copy-btn" onClick={handleCopyToClipboard} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    📋 Copy Data
                </button>
                <button className="data-btn" onClick={() => setShowRawData(!showRawData)} style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                    {showRawData ? '👁️ Hide Data' : '👁️ Show Data'}
                </button>
                <button className="data-btn import-btn" onClick={handleImportClick}>
                    📤 Restore Backup
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    style={{ display: 'none' }}
                />
            </div>

            {message && <div className="data-message">{message}</div>}

            {showRawData && (
                <div className="raw-data-container" style={{ marginTop: '1rem' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        You can manually copy the text below and save it as a .json file:
                    </p>
                    <textarea
                        readOnly
                        value={getBackupData()}
                        style={{
                            width: '100%',
                            height: '200px',
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                            padding: '1rem',
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            resize: 'vertical'
                        }}
                        onClick={(e) => e.target.select()}
                    />
                </div>
            )}
        </div>
    );
};
