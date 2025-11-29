import { useState } from 'react';
import './WordPacks.css';

const PREDEFINED_PACKS = [
    {
        id: 'verbs-50',
        name: 'Top 50 Verbs',
        description: 'Most common English verbs for beginners.',
        icon: '🏃',
        words: [
            { english: 'be', turkish: 'olmak', category: 'Verbs', emoji: '✨', example: 'I want to be happy.' },
            { english: 'have', turkish: 'sahip olmak', category: 'Verbs', emoji: '🤲', example: 'I have a car.' },
            { english: 'do', turkish: 'yapmak', category: 'Verbs', emoji: '🔨', example: 'Just do it.' },
            { english: 'say', turkish: 'söylemek', category: 'Verbs', emoji: '🗣️', example: 'Say hello to him.' },
            { english: 'go', turkish: 'gitmek', category: 'Verbs', emoji: '🚶', example: 'Let\'s go home.' },
            { english: 'get', turkish: 'almak/edinmek', category: 'Verbs', emoji: '🎁', example: 'I get a gift.' },
            { english: 'make', turkish: 'yapmak/üretmek', category: 'Verbs', emoji: '🍳', example: 'I make breakfast.' },
            { english: 'know', turkish: 'bilmek', category: 'Verbs', emoji: '🧠', example: 'I know the answer.' },
            { english: 'think', turkish: 'düşünmek', category: 'Verbs', emoji: '💭', example: 'I think it is good.' },
            { english: 'take', turkish: 'almak/götürmek', category: 'Verbs', emoji: '🤚', example: 'Take this book.' },
            { english: 'see', turkish: 'görmek', category: 'Verbs', emoji: '👀', example: 'I see a bird.' },
            { english: 'come', turkish: 'gelmek', category: 'Verbs', emoji: '👋', example: 'Come here.' },
            { english: 'want', turkish: 'istemek', category: 'Verbs', emoji: '🙏', example: 'I want water.' },
            { english: 'look', turkish: 'bakmak', category: 'Verbs', emoji: '🔭', example: 'Look at the sky.' },
            { english: 'use', turkish: 'kullanmak', category: 'Verbs', emoji: '🔧', example: 'Use a hammer.' },
            { english: 'find', turkish: 'bulmak', category: 'Verbs', emoji: '🔍', example: 'I can\'t find my keys.' },
            { english: 'give', turkish: 'vermek', category: 'Verbs', emoji: '🎁', example: 'Give me a hand.' },
            { english: 'tell', turkish: 'anlatmak', category: 'Verbs', emoji: '📢', example: 'Tell me a story.' },
            { english: 'work', turkish: 'çalışmak', category: 'Verbs', emoji: '💼', example: 'I work hard.' },
            { english: 'call', turkish: 'aramak/çağırmak', category: 'Verbs', emoji: '📞', example: 'Call me later.' }
        ]
    },
    {
        id: 'travel-essentials',
        name: 'Travel Essentials',
        description: 'Must-know words for your next trip.',
        icon: '✈️',
        words: [
            { english: 'passport', turkish: 'pasaport', category: 'Travel', emoji: '🛂', example: 'Where is my passport?' },
            { english: 'ticket', turkish: 'bilet', category: 'Travel', emoji: '🎫', example: 'One ticket please.' },
            { english: 'hotel', turkish: 'otel', category: 'Travel', emoji: '🏨', example: 'Is the hotel far?' },
            { english: 'airport', turkish: 'havalimanı', category: 'Travel', emoji: '🛫', example: 'To the airport.' },
            { english: 'station', turkish: 'istasyon', category: 'Travel', emoji: '🚉', example: 'Train station.' },
            { english: 'bus', turkish: 'otobüs', category: 'Travel', emoji: '🚌', example: 'The bus is late.' },
            { english: 'train', turkish: 'tren', category: 'Travel', emoji: '🚆', example: 'I like trains.' },
            { english: 'flight', turkish: 'uçuş', category: 'Travel', emoji: '✈️', example: 'My flight is at 5.' },
            { english: 'luggage', turkish: 'bagaj', category: 'Travel', emoji: '🧳', example: 'Lost luggage.' },
            { english: 'map', turkish: 'harita', category: 'Travel', emoji: '🗺️', example: 'Look at the map.' },
            { english: 'money', turkish: 'para', category: 'Travel', emoji: '💵', example: 'I need money.' },
            { english: 'price', turkish: 'fiyat', category: 'Travel', emoji: '🏷️', example: 'What is the price?' },
            { english: 'expensive', turkish: 'pahalı', category: 'Travel', emoji: '💎', example: 'Too expensive!' },
            { english: 'cheap', turkish: 'ucuz', category: 'Travel', emoji: '🏷️', example: 'Very cheap.' },
            { english: 'help', turkish: 'yardım', category: 'Travel', emoji: '🆘', example: 'Help me please.' }
        ]
    },
    {
        id: 'daily-routine',
        name: 'Daily Routine',
        description: 'Words to describe your day.',
        icon: '📅',
        words: [
            { english: 'wake up', turkish: 'uyanmak', category: 'Daily Life', emoji: '⏰', example: 'I wake up at 7.' },
            { english: 'breakfast', turkish: 'kahvaltı', category: 'Daily Life', emoji: '🥞', example: 'Eat breakfast.' },
            { english: 'shower', turkish: 'duş', category: 'Daily Life', emoji: '🚿', example: 'Take a shower.' },
            { english: 'work', turkish: 'iş', category: 'Daily Life', emoji: '💼', example: 'Go to work.' },
            { english: 'school', turkish: 'okul', category: 'Daily Life', emoji: '🏫', example: 'Go to school.' },
            { english: 'lunch', turkish: 'öğle yemeği', category: 'Daily Life', emoji: '🍔', example: 'Time for lunch.' },
            { english: 'dinner', turkish: 'akşam yemeği', category: 'Daily Life', emoji: '🍽️', example: 'Cook dinner.' },
            { english: 'sleep', turkish: 'uyumak', category: 'Daily Life', emoji: '😴', example: 'Go to sleep.' },
            { english: 'tired', turkish: 'yorgun', category: 'Daily Life', emoji: '😫', example: 'I am tired.' },
            { english: 'busy', turkish: 'meşgul', category: 'Daily Life', emoji: '📅', example: 'I am very busy.' }
        ]
    }
];

export const WordPacks = ({ onImportWords }) => {
    const [addedPacks, setAddedPacks] = useState({});
    const [previewPack, setPreviewPack] = useState(null);

    const handleAddPack = (pack) => {
        onImportWords(pack.words);
        setAddedPacks(prev => ({ ...prev, [pack.id]: true }));

        // Reset success message after 3 seconds
        setTimeout(() => {
            setAddedPacks(prev => ({ ...prev, [pack.id]: false }));
        }, 3000);

        if (previewPack) setPreviewPack(null); // Close modal if open
    };

    return (
        <div className="word-packs-container">
            <h3>📚 Quick Word Packs</h3>
            <div className="packs-grid">
                {PREDEFINED_PACKS.map(pack => (
                    <div key={pack.id} className="pack-card">
                        <div className="pack-icon">{pack.icon}</div>
                        <div className="pack-info">
                            <h4>{pack.name}</h4>
                            <p>{pack.description}</p>
                            <span className="word-count">{pack.words.length} words</span>
                        </div>
                        <div className="pack-actions">
                            <button
                                className="preview-btn"
                                onClick={() => setPreviewPack(pack)}
                                title="See words"
                            >
                                👁️
                            </button>
                            <button
                                className={`add-pack-btn ${addedPacks[pack.id] ? 'added' : ''}`}
                                onClick={() => handleAddPack(pack)}
                                disabled={addedPacks[pack.id]}
                            >
                                {addedPacks[pack.id] ? 'Added! ✅' : 'Add +'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {previewPack && (
                <div className="pack-modal-overlay" onClick={() => setPreviewPack(null)}>
                    <div className="pack-modal" onClick={e => e.stopPropagation()}>
                        <div className="pack-modal-header">
                            <div className="header-left">
                                <span className="modal-icon">{previewPack.icon}</span>
                                <h3>{previewPack.name}</h3>
                            </div>
                            <button className="close-modal-btn" onClick={() => setPreviewPack(null)}>✕</button>
                        </div>

                        <div className="pack-word-list">
                            {previewPack.words.map((word, index) => (
                                <div key={index} className="pack-word-item">
                                    <span className="en">{word.english}</span>
                                    <span className="arrow">→</span>
                                    <span className="tr">{word.turkish}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pack-modal-footer">
                            <button
                                className={`add-pack-btn full-width ${addedPacks[previewPack.id] ? 'added' : ''}`}
                                onClick={() => handleAddPack(previewPack)}
                                disabled={addedPacks[previewPack.id]}
                            >
                                {addedPacks[previewPack.id] ? 'Added to Library! ✅' : `Add All ${previewPack.words.length} Words`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
