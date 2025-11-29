import { useCallback } from 'react';

export const useSpeech = () => {
    const speak = useCallback((text) => {
        if (!window.speechSynthesis) {
            console.warn('Browser does not support text-to-speech');
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; // Set language to US English
        utterance.rate = 0.9; // Slightly slower for better clarity
        utterance.pitch = 1;

        // Try to select a better voice if available
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(voice =>
            voice.name.includes('Google US English') ||
            (voice.lang.includes('en-US') && !voice.name.includes('Microsoft'))
        );

        if (englishVoice) {
            utterance.voice = englishVoice;
        }

        window.speechSynthesis.speak(utterance);
    }, []);

    return { speak };
};
