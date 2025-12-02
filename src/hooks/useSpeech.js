import { useCallback } from 'react';

export const useSpeech = () => {
    const speak = useCallback((text, lang = 'en-US') => {
        if (!window.speechSynthesis) {
            console.warn('Browser does not support text-to-speech');
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9; // Slightly slower for better clarity
        utterance.pitch = 1;

        // Try to select a better voice if available
        const voices = window.speechSynthesis.getVoices();

        // Find voice based on language
        let selectedVoice = null;
        if (lang === 'en-US') {
            // Try to find a male voice first (Microsoft David on Windows) since the user didn't like the female one
            selectedVoice = voices.find(voice => voice.name.includes('Microsoft David')) ||
                voices.find(voice => voice.name.includes('Google US English')) ||
                voices.find(voice => voice.lang === 'en-US');
        } else if (lang === 'tr-TR') {
            selectedVoice = voices.find(voice =>
                voice.lang.includes('tr') || voice.lang.includes('TR')
            );
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        window.speechSynthesis.speak(utterance);
    }, []);

    return { speak };
};
