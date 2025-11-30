import { useState } from 'react';
import { useSpeech } from '../hooks/useSpeech';
import './WordForm.css';

export const WordForm = ({ onAddWord, categories }) => {
    const { speak } = useSpeech();
    const [englishWord, setEnglishWord] = useState('');
    const [turkishMeaning, setTurkishMeaning] = useState('');
    const [exampleSentence, setExampleSentence] = useState('');
    const [emoji, setEmoji] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(categories[0] || 'General');
    const [newCategory, setNewCategory] = useState('');
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);

    const [wordForms, setWordForms] = useState([]);

    const handleAutoTranslate = async () => {
        if (!englishWord.trim()) return;
        setIsTranslating(true);
        setWordForms([]); // Clear previous forms
        try {
            // 1. Get Turkish Translation
            const translateRes = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(englishWord)}&langpair=en|tr`);
            const translateData = await translateRes.json();
            if (translateData.responseData && translateData.responseData.translatedText) {
                setTurkishMeaning(translateData.responseData.translatedText);
            }

            // 2. Get Example Sentence & Word Forms
            const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(englishWord)}`);
            const dictData = await dictRes.json();

            if (Array.isArray(dictData) && dictData.length > 0) {
                // Extract parts of speech with filtering for rare usages
                const meanings = dictData[0].meanings;

                // Calculate definition counts for each POS
                const posCounts = meanings.map(m => ({
                    pos: m.partOfSpeech,
                    count: m.definitions.length
                }));

                // Find the maximum number of definitions any POS has
                const maxCount = Math.max(...posCounts.map(p => p.count));

                // Filter logic:
                // If the most common usage has 3 or more definitions,
                // exclude usages that only have 1 definition (likely rare/archaic).
                const filteredForms = posCounts
                    .filter(p => {
                        if (p.count === maxCount) return true; // Always keep the main one
                        if (maxCount >= 3 && p.count === 1) return false; // Filter rare ones
                        return true;
                    })
                    .map(p => p.pos);

                setWordForms([...new Set(filteredForms)]);

                let foundExample = '';
                for (const meaning of dictData[0].meanings) {
                    for (const def of meaning.definitions) {
                        if (def.example) {
                            foundExample = def.example;
                            break;
                        }
                    }
                    if (foundExample) break;
                }
                if (foundExample) {
                    setExampleSentence(foundExample);
                }
            }
        } catch (error) {
            console.error("Auto-translate failed:", error);
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
        if (!categoryToUse) return;

        onAddWord(englishWord, turkishMeaning, categoryToUse, exampleSentence, emoji);
        setEnglishWord('');
        setTurkishMeaning('');
        setExampleSentence('');
        setEmoji('');
        setWordForms([]); // Clear forms
        // Do not reset category so user can add multiple words to same category
        if (isCreatingCategory) {
            setSelectedCategory(categoryToUse);
            setIsCreatingCategory(false);
            setNewCategory('');
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

    const uniqueCategories = ['General', ...new Set(categories)].filter(c => c !== 'General').sort();

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
                            autoComplete="off"
                        />
                        <button
                            type="button"
                            className="translate-btn-mini"
                            onClick={handleAutoTranslate}
                            disabled={!englishWord || isTranslating}
                            title="Auto-Translate to Turkish"
                            style={{ marginRight: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}
                        >
                            {isTranslating ? '⏳' : '✨ Auto'}
                        </button>
                        <button
                            type="button"
                            className="speak-btn-mini"
                            onClick={() => speak(englishWord)}
                            disabled={!englishWord}
                            title="Listen to pronunciation"
                        >
                            🔊
                        </button>
                    </div>
                    {wordForms.length > 0 && (
                        <div className="word-forms-suggestions">
                            <span className="forms-label">Also used as:</span>
                            <div className="forms-list">
                                {wordForms.map(form => (
                                    <span key={form} className="form-badge">{form}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="form-row">
                    <div className="form-group half">
                        <label htmlFor="turkish">Turkish Meaning</label>
                        <input
                            type="text"
                            id="turkish"
                            value={turkishMeaning}
                            onChange={(e) => setTurkishMeaning(e.target.value)}
                            placeholder="e.g., Elma"
                            autoComplete="off"
                        />
                    </div>
                    <div className="form-group half">
                        <label htmlFor="emoji">Emoji (Optional)</label>
                        <div className="emoji-input-wrapper">
                            <input
                                type="text"
                                id="emoji"
                                value={emoji}
                                onChange={(e) => setEmoji(e.target.value)}
                                placeholder="e.g., 🍎"
                                className="emoji-input"
                            />
                            <div className="quick-emojis">
                                {['🍎', '🍌', '🍕', '🐶', '🐱', '🚗', '✈️', '🏠', '💻', '📱', '📚', '✏️', '🏃', '🏊', '😊', '🤔', '❤️', '⭐', '💼', '💰'].map(e => (
                                    <button
                                        key={e}
                                        type="button"
                                        className="emoji-btn"
                                        onClick={() => setEmoji(e)}
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="example">Example Sentence (Optional)</label>
                    <input
                        type="text"
                        id="example"
                        value={exampleSentence}
                        onChange={(e) => setExampleSentence(e.target.value)}
                        placeholder="e.g., I eat an apple every day."
                        autoComplete="off"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="category">Category</label>
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
                            <option value="new_category_custom_value">+ Create New Category</option>
                        </select>
                    ) : (
                        <div className="new-category-input">
                            <input
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="Enter new category name"
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

                <button type="submit" className="add-btn">
                    <span className="btn-icon">+</span>
                    Add Word
                </button>
            </form>
        </div>
    );
};
