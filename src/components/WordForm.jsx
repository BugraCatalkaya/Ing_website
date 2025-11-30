import { useState } from 'react';
import { useSpeech } from '../hooks/useSpeech';
import './WordForm.css';

export const WordForm = ({ onAddWord, categories, folders = ['General'] }) => {
    const { speak } = useSpeech();
    const [englishWord, setEnglishWord] = useState('');
    const [turkishMeaning, setTurkishMeaning] = useState('');
    const [exampleSentence, setExampleSentence] = useState('');
    const [emoji, setEmoji] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(categories[0] || 'General');
    const [newCategory, setNewCategory] = useState('');
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState(folders[0] || 'General');
    const [newFolder, setNewFolder] = useState('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [wordForms, setWordForms] = useState([]);
    const [selectedPartOfSpeech, setSelectedPartOfSpeech] = useState('');

    const handleAutoTranslate = async () => {
        if (!englishWord.trim()) return;
        setIsTranslating(true);
        try {
            // 1. Get Turkish translation
            const translateRes = await fetch(`https://api.mymemory.translated.net/get?q=${englishWord}&langpair=en|tr`);
            const translateData = await translateRes.json();
            if (translateData.responseData && translateData.responseData.translatedText) {
                setTurkishMeaning(translateData.responseData.translatedText);
            }

            // 2. Get English definition/examples/forms
            const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${englishWord}`);
            const dictData = await dictRes.json();

            if (Array.isArray(dictData) && dictData.length > 0) {
                const entry = dictData[0];
                const meanings = entry.meanings || [];
                let foundExample = '';
                let forms = [];

                // Collect forms (noun, verb, etc.)
                meanings.forEach(m => {
                    forms.push(m.partOfSpeech);
                    if (!foundExample && m.definitions) {
                        const defWithExample = m.definitions.find(d => d.example);
                        if (defWithExample) foundExample = defWithExample.example;
                    }
                });

                if (foundExample) setExampleSentence(foundExample);
                setWordForms([...new Set(forms)]); // Unique forms
                if (forms.length > 0) setSelectedPartOfSpeech(forms[0]);
            }
        } catch (error) {
            console.error("Translation error:", error);
        } finally {
            setIsTranslating(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!englishWord.trim() || !turkishMeaning.trim()) {
            return;
        }

        const categoryToUse = isCreatingCategory ? newCategory.trim() : selectedCategory;
        const folderToUse = isCreatingFolder ? newFolder.trim() : selectedFolder;

        if (!categoryToUse || !folderToUse) return;

        onAddWord(englishWord, turkishMeaning, categoryToUse, exampleSentence, emoji, selectedPartOfSpeech, folderToUse);
        setEnglishWord('');
        setTurkishMeaning('');
        setExampleSentence('');
        setEmoji('');
        setWordForms([]); // Clear forms
        setSelectedPartOfSpeech('');

        // Do not reset category/folder so user can add multiple words to same place
        if (isCreatingCategory) {
            setSelectedCategory(categoryToUse);
            setIsCreatingCategory(false);
            setNewCategory('');
        }
        if (isCreatingFolder) {
            setSelectedFolder(folderToUse);
            setIsCreatingFolder(false);
            setNewFolder('');
        }
    };

    const handleCategoryChange = (e) => {
        const value = e.target.value;
        if (value === 'new_category_custom_value') {
            setIsCreatingCategory(true);
            setNewCategory('');
        } else {
            setIsCreatingCategory(false);
            setSelectedCategory(value);
        }
    };

    const handleFolderChange = (e) => {
        const value = e.target.value;
        if (value === 'new_folder_custom_value') {
            setIsCreatingFolder(true);
            setNewFolder('');
        } else {
            setIsCreatingFolder(false);
            setSelectedFolder(value);
        }
    };

    const uniqueCategories = ['General', ...new Set(categories)].filter(c => c !== 'General').sort();
    const uniqueFolders = ['General', ...new Set(folders)].filter(f => f !== 'General').sort();

    return (
        <div className="word-form-container">
            <h2>Add New Word</h2>
            <form onSubmit={handleSubmit} className="word-form">
                <div className="form-group">
                    <label htmlFor="english">English Word</label>
                    <div className="input-with-action">
                        <input
                            type="text"
                            id="english"
                            value={englishWord}
                            onChange={(e) => setEnglishWord(e.target.value)}
                            placeholder="e.g., Apple"
                            required
                        />
                        <button
                            type="button"
                            className="action-btn"
                            onClick={handleAutoTranslate}
                            disabled={isTranslating || !englishWord.trim()}
                            title="Auto Translate & Fill"
                        >
                            {isTranslating ? '...' : '✨'}
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="turkish">Turkish Meaning</label>
                    <input
                        type="text"
                        id="turkish"
                        value={turkishMeaning}
                        onChange={(e) => setTurkishMeaning(e.target.value)}
                        placeholder="e.g., Elma"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Part of Speech</label>
                    <div className="pos-selection">
                        {wordForms.length > 0 && (
                            <div className="suggested-pos">
                                {wordForms.map(pos => (
                                    <button
                                        key={pos}
                                        type="button"
                                        className={`form-badge ${selectedPartOfSpeech === pos ? 'selected' : ''}`}
                                        onClick={() => setSelectedPartOfSpeech(pos)}
                                    >
                                        {pos}
                                    </button>
                                ))}
                            </div>
                        )}
                        <select
                            value={selectedPartOfSpeech}
                            onChange={(e) => setSelectedPartOfSpeech(e.target.value)}
                            className="pos-select-input"
                        >
                            <option value="">Select Type (Optional)</option>
                            <option value="noun">Noun (İsim)</option>
                            <option value="verb">Verb (Fiil)</option>
                            <option value="adjective">Adjective (Sıfat)</option>
                            <option value="adverb">Adverb (Zarf)</option>
                            <option value="preposition">Preposition (Edat)</option>
                            <option value="conjunction">Conjunction (Bağlaç)</option>
                            <option value="pronoun">Pronoun (Zamir)</option>
                            <option value="interjection">Interjection (Ünlem)</option>
                            <option value="phrase">Phrase (İfade)</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="example">Example Sentence (Optional)</label>
                    <div className="input-with-action">
                        <input
                            type="text"
                            id="example"
                            value={exampleSentence}
                            onChange={(e) => setExampleSentence(e.target.value)}
                            placeholder="e.g., I ate an apple."
                        />
                        <button
                            type="button"
                            className="action-btn"
                            onClick={() => speak(englishWord)}
                            title="Listen"
                        >
                            🔊
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="emoji">Emoji / Icon (Optional)</label>
                    <input
                        type="text"
                        id="emoji"
                        value={emoji}
                        onChange={(e) => setEmoji(e.target.value)}
                        placeholder="e.g., 🍎"
                        className="emoji-input"
                    />
                </div>

                {/* Insert Folder Selection Here */}
                <div className="form-row">
                    <div className="form-group half">
                        <label htmlFor="folder">Folder (Group)</label>
                        {!isCreatingFolder ? (
                            <select
                                id="folder"
                                value={selectedFolder}
                                onChange={handleFolderChange}
                                className="category-select-input"
                            >
                                <option value="General">General</option>
                                {uniqueFolders.map(f => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                                <option value="new_folder_custom_value">+ Create New Folder</option>
                            </select>
                        ) : (
                            <div className="new-category-input">
                                <input
                                    type="text"
                                    value={newFolder}
                                    onChange={(e) => setNewFolder(e.target.value)}
                                    placeholder="Enter new folder name"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    className="cancel-category-btn"
                                    onClick={() => setIsCreatingFolder(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="form-group half">
                        <label htmlFor="category">Set (Category)</label>
                        {!isCreatingCategory ? (
                            <select
                                id="category"
                                value={selectedCategory}
                                onChange={handleCategoryChange}
                                className="category-select-input"
                            >
                                <option value="General">General</option>
                                {uniqueCategories.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                                <option value="new_category_custom_value">+ Create New Set</option>
                            </select>
                        ) : (
                            <div className="new-category-input">
                                <input
                                    type="text"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    placeholder="Enter new set name"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    className="cancel-category-btn"
                                    onClick={() => setIsCreatingCategory(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <button type="submit" className="add-btn">
                    <span className="btn-icon">+</span>
                    Add Word
                </button>
            </form>
        </div>
    );
};
