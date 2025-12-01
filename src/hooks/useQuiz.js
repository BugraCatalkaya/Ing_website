import { useState, useCallback } from 'react';

// Shuffle array helper
const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Generate quiz questions with SRS priority
const generateQuestions = (words, count = 10, questionMode = 'mixed') => {
    if (words.length < 4) {
        return null; // Need at least 4 words for multiple choice
    }

    // Sort words by priority:
    // 1. Due for review (nextReview <= now)
    // 2. Low level (harder words)
    // 3. Random shuffle for equal priority
    const now = new Date().toISOString();

    const sortedWords = [...words].sort((a, b) => {
        const aDue = a.nextReview ? a.nextReview <= now : true;
        const bDue = b.nextReview ? b.nextReview <= now : true;

        if (aDue && !bDue) return -1;
        if (!aDue && bDue) return 1;

        // If both due or both not due, sort by level (lower level first)
        const aLevel = a.level || 1;
        const bLevel = b.level || 1;
        if (aLevel !== bLevel) return aLevel - bLevel;

        return 0.5 - Math.random();
    });

    // Take top N words, but shuffle them so they aren't always in same order if list is static
    const selectedWords = shuffleArray(sortedWords.slice(0, Math.min(count, words.length)));

    return selectedWords.map((word, index) => {
        let questionType;

        // Determine question type based on mode
        if (questionMode === 'multiple-choice') {
            questionType = 'multiple-choice';
        } else if (questionMode === 'fill-in') {
            questionType = 'fill-in';
        } else if (questionMode === 'listening') {
            questionType = 'listening';
        } else if (questionMode === 'reverse') {
            questionType = 'reverse';
        } else {
            // mixed mode - random selection (excluding listening/reverse for now to keep it simple, or include them?)
            // Let's keep mixed mode as just multiple-choice and fill-in for now, or maybe add reverse?
            // Let's stick to original mixed behavior for now.
            questionType = Math.random() < 0.5 ? 'multiple-choice' : 'fill-in';
        }

        if (questionType === 'multiple-choice') {
            // Get 3 wrong answers
            const wrongAnswers = words
                .filter(w => w.id !== word.id)
                .map(w => w.turkish);
            const shuffledWrong = shuffleArray(wrongAnswers).slice(0, 3);

            // Combine and shuffle options
            const options = shuffleArray([word.turkish, ...shuffledWrong]);

            return {
                id: `q-${word.id}-${index}`,
                type: 'multiple-choice',
                question: word.english,
                correctAnswer: word.turkish,
                options,
                word
            };
        } else if (questionType === 'listening') {
            return {
                id: `q-${word.id}-${index}`,
                type: 'listening',
                question: word.english, // The text to be spoken
                correctAnswer: word.turkish,
                word
            };
        } else if (questionType === 'reverse') {
            return {
                id: `q-${word.id}-${index}`,
                type: 'reverse',
                question: word.turkish, // Show Turkish
                correctAnswer: word.english, // Expect English
                word
            };
        } else {
            return {
                id: `q-${word.id}-${index}`,
                type: 'fill-in',
                question: word.english,
                correctAnswer: word.turkish,
                word
            };
        }
    });
};

export const useQuiz = (words) => {
    const [questions, setQuestions] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [isComplete, setIsComplete] = useState(false);
    const [reviewMode, setReviewMode] = useState(false);
    const [questionMode, setQuestionMode] = useState('mixed');
    const [quizCategory, setQuizCategory] = useState('all');
    const [quizFolder, setQuizFolder] = useState('all');

    const startQuiz = useCallback((questionsToUse = null, mode = 'mixed', category = 'all', folder = 'all') => {
        let quizWords = words;
        if (category !== 'all') {
            quizWords = quizWords.filter(w => w.category === category);
        }
        if (folder !== 'all') {
            quizWords = quizWords.filter(w => (w.folder || 'General') === folder);
        }

        const quizQuestions = questionsToUse || generateQuestions(quizWords, 10, mode);
        if (!quizQuestions) return false;

        setQuestions(quizQuestions);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setIsComplete(false);
        setReviewMode(!!questionsToUse);
        setQuestionMode(mode);
        setQuizCategory(category);
        setQuizFolder(folder);
        return true;
    }, [words]);

    const submitAnswer = useCallback((questionId, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));

        // Move to next question or complete
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setIsComplete(true);
        }
    }, [currentQuestionIndex, questions]);

    const checkAnswer = useCallback((questionId, answer) => {
        const question = questions?.find(q => q.id === questionId);
        if (!question) return false;

        if (question.type === 'multiple-choice') {
            return answer === question.correctAnswer;
        } else {
            // Fill-in: case-insensitive, trim whitespace
            // Support multiple meanings separated by comma
            const normalize = (str) => str.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();

            const userParts = answer.split(',').map(normalize);
            const correctParts = question.correctAnswer.split(',').map(normalize);

            // Check if ANY of the user's provided meanings match ANY of the correct meanings
            // OR if the user provided the FULL string exactly
            return userParts.some(uPart => correctParts.includes(uPart)) ||
                normalize(answer) === normalize(question.correctAnswer);
        }
    }, [questions]);

    const getResults = useCallback(() => {
        if (!questions) return null;

        const results = questions.map(q => ({
            question: q,
            userAnswer: answers[q.id] || '',
            isCorrect: checkAnswer(q.id, answers[q.id] || '')
        }));

        const correctCount = results.filter(r => r.isCorrect).length;
        const wrongAnswers = results.filter(r => !r.isCorrect);

        return {
            total: questions.length,
            correct: correctCount,
            incorrect: wrongAnswers.length,
            percentage: Math.round((correctCount / questions.length) * 100),
            results,
            wrongAnswers,
            category: quizCategory,
            folder: quizFolder,
            mode: questionMode,
            isReview: reviewMode
        };
    }, [questions, answers, checkAnswer, quizCategory, quizFolder, reviewMode]);

    const startReviewQuiz = useCallback(() => {
        const results = getResults();
        if (!results || results.wrongAnswers.length === 0) return false;

        // Generate new questions from wrong answers
        const wrongQuestions = results.wrongAnswers.map((wa, index) => {
            const word = wa.question.word;
            const questionType = wa.question.type;

            if (questionType === 'multiple-choice') {
                const wrongAnswers = words
                    .filter(w => w.id !== word.id)
                    .map(w => w.turkish);
                const shuffledWrong = shuffleArray(wrongAnswers).slice(0, 3);
                const options = shuffleArray([word.turkish, ...shuffledWrong]);

                return {
                    id: `review-${word.id}-${index}`,
                    type: 'multiple-choice',
                    question: word.english,
                    correctAnswer: word.turkish,
                    options,
                    word
                };
            } else if (questionType === 'listening') {
                return {
                    id: `review-${word.id}-${index}`,
                    type: 'listening',
                    question: word.english,
                    correctAnswer: word.turkish,
                    word
                };
            } else if (questionType === 'reverse') {
                return {
                    id: `review-${word.id}-${index}`,
                    type: 'reverse',
                    question: word.turkish,
                    correctAnswer: word.english,
                    word
                };
            } else {
                return {
                    id: `review-${word.id}-${index}`,
                    type: 'fill-in',
                    question: word.english,
                    correctAnswer: word.turkish,
                    word
                };
            }
        });

        return startQuiz(wrongQuestions);
    }, [getResults, words, startQuiz]);

    const resetQuiz = useCallback(() => {
        setQuestions(null);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setIsComplete(false);
        setReviewMode(false);
    }, []);

    return {
        questions,
        currentQuestion: questions?.[currentQuestionIndex],
        currentQuestionIndex,
        totalQuestions: questions?.length || 0,
        answers,
        isComplete,
        reviewMode,
        questionMode,
        startQuiz,
        submitAnswer,
        checkAnswer,
        getResults,
        startReviewQuiz,
        resetQuiz
    };
};
