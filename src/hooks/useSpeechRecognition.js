import { useState, useEffect, useCallback } from 'react';

export const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [speechDetected, setSpeechDetected] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);
    const [recognition, setRecognition] = useState(null);

    useEffect(() => {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = true;
            recognitionInstance.lang = 'tr-TR';

            recognitionInstance.onstart = () => {
                setIsListening(true);
                setSpeechDetected(false);
                setError(null);
            };

            recognitionInstance.onend = () => {
                setIsListening(false);
                setSpeechDetected(false);
            };

            recognitionInstance.onspeechstart = () => {
                setSpeechDetected(true);
            };

            recognitionInstance.onresult = (event) => {
                const current = event.resultIndex;
                const transcriptText = event.results[current][0].transcript;
                setTranscript(transcriptText);
            };

            recognitionInstance.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setError(event.error);
                setIsListening(false);
            };

            setRecognition(recognitionInstance);
        } else {
            setError('Browser not supported');
        }
    }, []);

    const startListening = useCallback(() => {
        if (recognition && !isListening) {
            setTranscript('');
            try {
                recognition.start();
            } catch (e) {
                console.error(e);
            }
        }
    }, [recognition, isListening]);

    const stopListening = useCallback(() => {
        if (recognition && isListening) {
            recognition.stop();
        }
    }, [recognition, isListening]);

    return {
        isListening,
        speechDetected,
        transcript,
        startListening,
        stopListening,
        error,
        isSupported: !!recognition
    };
};
