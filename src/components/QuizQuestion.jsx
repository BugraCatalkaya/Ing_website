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
            const userAnswer = answer.trim().toLowerCase();
            const correctAnswers = question.correctAnswer.split(',').map(a => a.trim().toLowerCase());
            correct = correctAnswers.some(correctAns => userAnswer === correctAns);
        }

        if (correct) {
            // Play success sound
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'); // Simple chime sound
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Audio play failed', e));
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
            const userAnswer = answer.trim().toLowerCase();
            const correctAnswers = question.correctAnswer.split(',').map(a => a.trim().toLowerCase());
            return correctAnswers.some(correctAns => userAnswer === correctAns);
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
            return speechDetected ? "Ses algılandı! Yazılıyor..." : "Dinleniyor... Konuşun!";
        }
        return "Cevabı yazın veya mikrofona basın...";
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

                {question.word && question.word.partOfSpeech && (
                    <div className="question-pos-badge">
                        {question.word.partOfSpeech}
                    </div>
                )}

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
                            <h3 className="question-text">{question.question}</h3>
                            <button
                                className="speak-btn-quiz"
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
    );
};
