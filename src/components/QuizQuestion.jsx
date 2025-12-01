import { useState, useEffect, useRef } from 'react';
import { useSpeech } from '../hooks/useSpeech';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import './QuizQuestion.css';

export const QuizQuestion = ({ question, onSubmit, questionNumber, totalQuestions, onExit }) => {
    const { speak } = useSpeech();
    const { isListening, speechDetected, transcript, startListening, stopListening, isSupported, error: speechError } = useSpeechRecognition();

    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [fillInAnswer, setFillInAnswer] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const inputRef = useRef(null);

    // Auto-focus input when question changes
    useEffect(() => {
        if (question && (question.type === 'fill-in' || question.type === 'listening' || question.type === 'reverse') && inputRef.current) {
            inputRef.current.focus();
        }

        // Auto-play audio for listening mode
        if (question && question.type === 'listening') {
            // Small delay to ensure smooth transition
            const timer = setTimeout(() => {
                speak(question.question);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [question?.id, question?.type, speak, question?.question]);

    // Update input when speech is recognized
    useEffect(() => {
        if (transcript) {
            // Remove trailing punctuation (like periods) that speech-to-text might add
            const cleanTranscript = transcript.replace(/[.,!?]$/, '');
            setFillInAnswer(cleanTranscript);
        }
    }, [transcript]);

    if (!question) return <div className="quiz-loading">Loading question...</div>;

    const handleSubmit = () => {
        if (submitted) return;

        const answer = question.type === 'multiple-choice' ? selectedAnswer : fillInAnswer;
        if (!answer.trim()) return;

        // Check correctness immediately to play sound
        let correct = false;
        if (question.type === 'multiple-choice') {
            correct = answer === question.correctAnswer;
        } else {
            const normalize = (str) => str.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
            const userParts = answer.split(',').map(normalize);
            const correctParts = question.correctAnswer.split(',').map(normalize);
            correct = userParts.some(uPart => correctParts.includes(uPart)) ||
                normalize(answer) === normalize(question.correctAnswer);
        }

        if (correct) {
            // Play success sound using Web Audio API (more reliable)
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    const ctx = new AudioContext();
                    const start = ctx.currentTime;

                    // Play a pleasant major chord (C5 - E5 - G5)
                    [523.25, 659.25, 783.99].forEach((freq, i) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();

                        osc.frequency.value = freq;
                        osc.type = 'sine';

                        // Smooth attack and release
                        gain.gain.setValueAtTime(0, start + i * 0.08);
                        gain.gain.linearRampToValueAtTime(0.1, start + i * 0.08 + 0.05);
                        gain.gain.exponentialRampToValueAtTime(0.001, start + i * 0.08 + 0.4);

                        osc.connect(gain);
                        gain.connect(ctx.destination);

                        osc.start(start + i * 0.08);
                        osc.stop(start + i * 0.08 + 0.45);
                    });
                }
            } catch (e) {
                console.error("Audio play failed", e);
            }
        }

        setSubmitted(true);

        // Show feedback briefly before moving to next question
        setTimeout(() => {
            onSubmit(question.id, answer);
            setSubmitted(false);
            setSelectedAnswer('');
            setFillInAnswer('');
        }, 1000);
    };

    const isCorrect = () => {
        const answer = question.type === 'multiple-choice' ? selectedAnswer : fillInAnswer;
        if (question.type === 'multiple-choice') {
            return answer === question.correctAnswer;
        } else {
            // Support multiple answers separated by comma
            const normalize = (str) => str.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();

            const userParts = answer.split(',').map(normalize);
            const correctParts = question.correctAnswer.split(',').map(normalize);

            return userParts.some(uPart => correctParts.includes(uPart)) ||
                normalize(answer) === normalize(question.correctAnswer);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
            // Clear previous answer when starting new recording
            setFillInAnswer('');
            if (inputRef.current) inputRef.current.focus();
        }
    };

    // Helper to get user-friendly error message
    const getErrorMessage = (err) => {
        if (!err) return null;
        if (err === 'not-allowed') return 'Mikrofon izni reddedildi. Lütfen izin verin.';
        if (err === 'no-speech') return 'Ses algılanamadı. Lütfen tekrar deneyin.';
        if (err === 'network') return 'Ağ hatası. Bağlantınızı kontrol edin.';
        return `Hata: ${err}`;
    };

    const getPlaceholderText = () => {
        if (isListening) {
            return speechDetected ? "Listening... Speaking detected!" : "Listening... Speak now!";
        }
        return "Type answer...";
    };

    const handleGiveUp = () => {
        if (submitted) return;
        setSubmitted(true);
        // Show correct answer by setting submitted to true, but don't play success sound

        setTimeout(() => {
            // Submit with a special marker or empty string to count as wrong
            onSubmit(question.id, '__SKIPPED__');
            setSubmitted(false);
            setSelectedAnswer('');
            setFillInAnswer('');
        }, 2500); // Give enough time to read the answer
    };

    return (
        <div className="quiz-question">
            <div className="quiz-header">
                <div className="quiz-progress">
                    Question {questionNumber} / {totalQuestions}
                </div>
                <button className="exit-quiz-btn" onClick={onExit} title="Exit Quiz">
                    ✕
                </button>
            </div>

            <div className="question-card">
                <div className="question-type-badge">
                    {question.type === 'multiple-choice' && '📝 Multiple Choice'}
                    {question.type === 'fill-in' && '✍️ Fill in the Blank'}
                    {question.type === 'listening' && '🎧 Listening Challenge'}
                    {question.type === 'reverse' && '🔄 Reverse Translation'}
                </div>

                <div className="question-text-wrapper">
                    {question.type === 'listening' ? (
                        <div
                            className="listening-placeholder clickable"
                            onClick={() => speak(question.question, 'en-US')}
                            title="Click to play audio"
                        >
                            <span className="listening-icon">🔊</span>
                            <p>Click to listen</p>
                        </div>
                    ) : (
                        <>
                            <h3 className="question-text-v2">
                                {question.question}
                                {question.word && question.word.partOfSpeech && (
                                    <span className="question-pos-suffix-v2"> ({question.word.partOfSpeech})</span>
                                )}
                            </h3>
                            <button
                                className="speak-btn-quiz-v2"
                                onClick={() => speak(question.question, question.type === 'reverse' ? 'tr-TR' : 'en-US')}
                                title="Listen to question"
                            >
                                🔊
                            </button>
                        </>
                    )}
                </div>

                <p className="question-prompt">
                    {question.type === 'multiple-choice' && 'Select the correct Turkish translation:'}
                    {question.type === 'fill-in' && 'Type or speak the Turkish translation:'}
                    {question.type === 'listening' && 'Type the Turkish translation of what you hear:'}
                    {question.type === 'reverse' && 'Type the English translation:'}
                </p>

                {question.type === 'multiple-choice' ? (
                    <div className="options-container">
                        {question.options.map((option, index) => (
                            <button
                                key={index}
                                className={`option-btn ${selectedAnswer === option ? 'selected' : ''} ${submitted ? (option === question.correctAnswer ? 'correct' : selectedAnswer === option ? 'incorrect' : '') : ''
                                    }`}
                                onClick={() => !submitted && setSelectedAnswer(option)}
                                disabled={submitted}
                            >
                                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                                <span className="option-text">{option}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="fill-in-container">
                        <div className={`input-wrapper ${isListening ? 'listening-mode' : ''}`}>
                            <input
                                ref={inputRef}
                                type="text"
                                className={`fill-in-input ${submitted ? (isCorrect() ? 'correct' : 'incorrect') : ''}`}
                                value={fillInAnswer}
                                onChange={(e) => setFillInAnswer(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                                placeholder={getPlaceholderText()}
                                disabled={submitted}
                                autoFocus
                            />
                            {isSupported && (
                                <button
                                    className={`mic-btn ${isListening ? 'listening' : ''}`}
                                    onClick={toggleListening}
                                    disabled={submitted}
                                    title={isListening ? "Stop listening" : "Speak answer"}
                                >
                                    {isListening ? '⏹️' : '🎙️'}
                                </button>
                            )}
                        </div>

                        {/* Speech Error Message */}
                        {speechError && (
                            <div className="speech-error-message">
                                ⚠️ {getErrorMessage(speechError)}
                            </div>
                        )}

                        {submitted && !isCorrect() && (
                            <div className="correct-answer-hint">
                                Correct answer: <strong>{question.correctAnswer}</strong>
                            </div>
                        )}
                    </div>
                )}

                {submitted && (
                    <div className={`feedback ${isCorrect() ? 'correct' : 'incorrect'}`}>
                        {isCorrect() ? '✅ Correct!' : '❌ Incorrect'}
                    </div>
                )}

                <div className="quiz-actions">
                    {!submitted && question.type !== 'multiple-choice' && (
                        <button
                            className="give-up-btn"
                            onClick={handleGiveUp}
                            title="I don't know the answer"
                        >
                            🤷 I don't know
                        </button>
                    )}
                    <button
                        className="submit-btn"
                        onClick={handleSubmit}
                        disabled={
                            submitted ||
                            (question.type === 'multiple-choice' ? !selectedAnswer : !fillInAnswer.trim())
                        }
                    >
                        {submitted ? 'Next Question...' : 'Submit Answer'}
                    </button>
                </div>
            </div>
        </div>
    );
};
