import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import './DataManagement.css';

export const DataManagement = ({ words, history, onImportWords, onImportHistory }) => {
    const fileInputRef = useRef(null);
    const excelInputRef = useRef(null);
    const [message, setMessage] = useState('');
    const [showRawData, setShowRawData] = useState(false);

    const downloadExcelTemplate = () => {
        const templateData = [
            {
                English: 'Example Word',
                Turkish: 'Örnek Kelime',
                Type: 'noun',
                Category: 'General',
                Example: 'This is an example sentence.'
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "word-import-template.xlsx");
        setMessage('Template downloaded! 📥 Fill it and import.');
        setTimeout(() => setMessage(''), 4000);
    };

    const handleExcelImportClick = () => {
        excelInputRef.current.click();
    };

    const handleExcelFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                if (jsonData.length === 0) {
                    setMessage('Excel file is empty! ⚠️');
                    return;
                }

                const newWords = jsonData.map(row => ({
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    english: row.English || row.english || '',
                    turkish: row.Turkish || row.turkish || '',
                    type: (row.Type || row.type || 'noun').toLowerCase(),
                    category: row.Category || row.category || 'General',
                    example: row.Example || row.example || '',
                    createdAt: new Date().toISOString()
                })).filter(w => w.english && w.turkish); // Filter out invalid rows

                if (newWords.length > 0) {
                    onImportWords(newWords);
                    setMessage(`Successfully imported ${newWords.length} words! 🎉`);
                } else {
                    setMessage('No valid words found. Check column names. ⚠️');
                }

                setTimeout(() => setMessage(''), 4000);
            } catch (error) {
                console.error('Excel import error:', error);
                setMessage('Error reading Excel file. ❌');
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    return (
        <div className="data-management">
            <div className="data-actions">
                <div className="excel-actions" style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="data-btn excel-template-btn" onClick={downloadExcelTemplate}>
                        📊 Download Excel Template
                    </button>
                    <button className="data-btn excel-import-btn" onClick={handleExcelImportClick}>
                        📥 Import from Excel
                    </button>
                    <input
                        type="file"
                        ref={excelInputRef}
                        onChange={handleExcelFileChange}
                        accept=".xlsx, .xls"
                        style={{ display: 'none' }}
                    />
                </div>
            </div>

            {message && <div className="data-message">{message}</div>}
        </div>
    );
};
