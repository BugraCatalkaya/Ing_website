import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    writeBatch,
    setDoc
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const GUEST_STORAGE_KEY = 'guest_words';

export const useWords = () => {
    const [words, setWords] = useState([]);
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);

    // Load Data
    useEffect(() => {
        if (!currentUser) {
            const saved = localStorage.getItem(GUEST_STORAGE_KEY);
            if (saved) {
                try {
                    setWords(JSON.parse(saved));
                } catch (e) {
                    console.error("Failed to parse guest words", e);
                    setWords([]);
                }
            } else {
                setWords([]);
            }
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(collection(db, 'users', currentUser.uid, 'words'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const wordsData = [];
            querySnapshot.forEach((doc) => {
                wordsData.push({ id: doc.id, ...doc.data() });
            });
            wordsData.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                return dateB - dateA;
            });
            setWords(wordsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching words:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Save to LocalStorage (Guest Mode)
    useEffect(() => {
        if (!currentUser && !loading) {
            localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(words));
        }
    }, [words, currentUser, loading]);

    const addWord = async (englishWord, turkishMeaning, category = 'General', exampleSentence = '', emoji = '') => {
        const newWordData = {
            english: englishWord.trim(),
            turkish: turkishMeaning.trim(),
            category: category.trim() || 'General',
            example: exampleSentence.trim(),
            emoji: emoji.trim(),
            level: 1,
            nextReview: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            lastReviewed: null
        };

        if (!currentUser) {
            setWords(prev => [...prev, { id: Date.now(), ...newWordData }]);
            return;
        }

        try {
            await addDoc(collection(db, 'users', currentUser.uid, 'words'), newWordData);
        } catch (error) {
            console.error("Error adding word:", error);
        }
    };

    const deleteWord = async (id) => {
        if (!currentUser) {
            setWords(prev => prev.filter(w => w.id !== id));
            return;
        }

        try {
            await deleteDoc(doc(db, 'users', currentUser.uid, 'words', id));
        } catch (error) {
            console.error("Error deleting word:", error);
        }
    };

    const updateWordCategory = async (id, newCategory) => {
        if (!currentUser) {
            setWords(prev => prev.map(w => w.id === id ? { ...w, category: newCategory } : w));
            return;
        }

        try {
            await updateDoc(doc(db, 'users', currentUser.uid, 'words', id), {
                category: newCategory
            });
        } catch (error) {
            console.error("Error updating category:", error);
        }
    };

    const updateWord = async (id, updatedFields) => {
        if (!currentUser) {
            setWords(prev => prev.map(w => w.id === id ? { ...w, ...updatedFields } : w));
            return;
        }

        try {
            await updateDoc(doc(db, 'users', currentUser.uid, 'words', id), updatedFields);
        } catch (error) {
            console.error("Error updating word:", error);
        }
    };

    const updateWordStats = async (id, isCorrect) => {
        // Calculate new stats logic (shared)
        const word = words.find(w => w.id === id);
        if (!word) return;

        let newLevel = word.level || 1;
        let nextReviewDate = new Date();

        if (isCorrect) {
            newLevel = Math.min(newLevel + 1, 5);
            const daysToAdd = Math.pow(2, newLevel - 1);
            nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd);
        } else {
            newLevel = 1;
        }

        const updates = {
            level: newLevel,
            nextReview: nextReviewDate.toISOString(),
            lastReviewed: new Date().toISOString()
        };

        if (!currentUser) {
            setWords(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
            return;
        }

        try {
            await updateDoc(doc(db, 'users', currentUser.uid, 'words', id), updates);
        } catch (error) {
            console.error("Error updating stats:", error);
        }
    };

    const deleteWords = async (ids) => {
        if (!currentUser) {
            setWords(prev => prev.filter(w => !ids.includes(w.id)));
            return;
        }

        const batch = writeBatch(db);
        ids.forEach(id => {
            const docRef = doc(db, 'users', currentUser.uid, 'words', id);
            batch.delete(docRef);
        });
        await batch.commit();
    };

    const importWords = async (newWords) => {
        if (!currentUser) {
            // Guest import
            const validWords = newWords.filter(w => w.english && w.turkish);
            setWords(prev => {
                const wordMap = new Map(prev.map(w => [w.id, w]));
                validWords.forEach(w => {
                    const wordWithId = w.id ? w : { ...w, id: Date.now() + Math.random() };
                    wordMap.set(wordWithId.id, wordWithId);
                });
                return Array.from(wordMap.values());
            });
            return;
        }

        // Firestore Import
        let count = 0;
        let currentBatch = writeBatch(db);

        for (const w of newWords) {
            if (!w.english || !w.turkish) continue;

            const docRef = doc(collection(db, 'users', currentUser.uid, 'words'));
            currentBatch.set(docRef, {
                english: w.english,
                turkish: w.turkish,
                category: w.category || 'General',
                example: w.example || '',
                emoji: w.emoji || '',
                level: w.level || 1,
                nextReview: w.nextReview || new Date().toISOString(),
                createdAt: w.createdAt || new Date().toISOString(),
                lastReviewed: w.lastReviewed || null
            });

            count++;
            if (count >= 450) {
                await currentBatch.commit();
                currentBatch = writeBatch(db);
                count = 0;
            }
        }

        if (count > 0) {
            await currentBatch.commit();
        }
    };

    const restoreWord = async (wordToRestore) => {
        if (!currentUser) {
            setWords(prev => {
                if (prev.some(w => w.id === wordToRestore.id)) return prev;
                return [...prev, wordToRestore];
            });
            return;
        }

        try {
            const { id, ...data } = wordToRestore;
            if (id && typeof id === 'string' && id.length > 10) {
                await setDoc(doc(db, 'users', currentUser.uid, 'words', id), data);
            } else {
                await addDoc(collection(db, 'users', currentUser.uid, 'words'), data);
            }
        } catch (error) {
            console.error("Error restoring word:", error);
        }
    };

    const restoreWords = async (wordsToRestore) => {
        importWords(wordsToRestore);
    };

    return {
        words,
        loading,
        addWord,
        deleteWord,
        deleteWords,
        updateWordCategory,
        updateWord,
        updateWordStats,
        importWords,
        restoreWord,
        restoreWords
    };
};
