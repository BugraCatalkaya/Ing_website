import { useState } from 'react';
import './OnboardingWizard.css';

const ASSESSMENT_WORDS = [
    { english: 'necessary', turkish: 'gerekli', category: 'General', emoji: '✅', example: 'Water is necessary for life.' },
    { english: 'available', turkish: 'müsait/mevcut', category: 'General', emoji: '🟢', example: 'Is this seat available?' },
    { english: 'develop', turkish: 'geliştirmek', category: 'Verbs', emoji: '📈', example: 'We need to develop a plan.' },
    { english: 'opportunity', turkish: 'fırsat', category: 'Business', emoji: '🚪', example: 'This is a great opportunity.' },
    { english: 'patient', turkish: 'sabırlı', category: 'Adjectives', emoji: '🧘', example: 'Be patient with him.' },
    { english: 'various', turkish: 'çeşitli', category: 'Adjectives', emoji: '🎨', example: 'There are various options.' },
    { english: 'environment', turkish: 'çevre/ortam', category: 'General', emoji: '🌳', example: 'Protect the environment.' },
    { english: 'likely', turkish: 'muhtemel', category: 'Adjectives', emoji: '🎲', example: 'It is likely to rain.' },
    { english: 'provide', turkish: 'sağlamak', category: 'Verbs', emoji: '🤲', example: 'They provide free food.' },
    { english: 'decision', turkish: 'karar', category: 'General', emoji: '⚖️', example: 'It was a hard decision.' }
];

export const OnboardingWizard = ({ onComplete, onSkip }) => {
    const [step, setStep] = useState('welcome'); // welcome, assessment, result
    const [currentIndex, setCurrentIndex] = useState(0);
    const [wordsToAdd, setWordsToAdd] = useState([]);

    const handleStart = () => {
        setStep('assessment');
    };

    const handleAnswer = (known) => {
        if (!known) {
            setWordsToAdd(prev => [...prev, ASSESSMENT_WORDS[currentIndex]]);
        }

        if (currentIndex < ASSESSMENT_WORDS.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setStep('result');
        }
    };

    const handleFinish = () => {
        onComplete(wordsToAdd);
    };

    if (step === 'welcome') {
        return (
            <div className="wizard-overlay">
                <div className="wizard-card welcome">
                    <div className="wizard-icon">👋</div>
                    <h2>Welcome!</h2>
                    <p>Let's personalize your experience.</p>
                    <p>We'll show you a few words. Tell us if you know them, and we'll build your starting list.</p>
                    <div className="wizard-actions">
                        <button className="wizard-btn primary" onClick={handleStart}>Start Assessment</button>
                        <button className="wizard-btn text" onClick={onSkip}>Skip for now</button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'assessment') {
        const currentWord = ASSESSMENT_WORDS[currentIndex];
        const progress = ((currentIndex + 1) / ASSESSMENT_WORDS.length) * 100;

        return (
            <div className="wizard-overlay">
                <div className="wizard-card assessment">
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="word-display">
                        <span className="word-emoji-lg">{currentWord.emoji}</span>
                        <h3>{currentWord.english}</h3>
                    </div>
                    <p className="question-text">Do you know this word?</p>

                    <div className="assessment-actions">
                        <button
                            className="wizard-btn danger"
                            onClick={() => handleAnswer(false)}
                        >
                            No / Not Sure
                        </button>
                        <button
                            className="wizard-btn success"
                            onClick={() => handleAnswer(true)}
                        >
                            Yes, I know it
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'result') {
        return (
            <div className="wizard-overlay">
                <div className="wizard-card result">
                    <div className="wizard-icon">🎉</div>
                    <h2>All Set!</h2>
                    <p>We found <strong>{wordsToAdd.length}</strong> new words for you to learn.</p>
                    {wordsToAdd.length > 0 && (
                        <div className="words-preview">
                            {wordsToAdd.slice(0, 3).map(w => w.english).join(', ')}
                            {wordsToAdd.length > 3 && '...'}
                        </div>
                    )}
                    <button className="wizard-btn primary" onClick={handleFinish}>
                        {wordsToAdd.length > 0 ? 'Add Words & Start' : 'Go to Dashboard'}
                    </button>
                </div>
            </div>
        );
    }

    return null;
};
