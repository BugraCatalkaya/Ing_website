import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    writeBatch
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const GUEST_HISTORY_KEY = 'guest_history';

export const useQuizHistory = () => {
    const [history, setHistory] = useState([]);
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);

    // Load Data
    useEffect(() => {
        if (!currentUser) {
            const saved = localStorage.getItem(GUEST_HISTORY_KEY);
            if (saved) {
                try {
                    setHistory(JSON.parse(saved));
                } catch (e) {
                    console.error("Failed to parse guest history", e);
                    setHistory([]);
                }
            } else {
                setHistory([]);
            }
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(collection(db, 'users', currentUser.uid, 'history'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const historyData = [];
            querySnapshot.forEach((doc) => {
                historyData.push({ id: doc.id, ...doc.data() });
            });
            historyData.sort((a, b) => new Date(b.date) - new Date(a.date));
            setHistory(historyData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching history:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Save to LocalStorage (Guest Mode)
    useEffect(() => {
        if (!currentUser && !loading) {
            localStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(history));
        }
    }, [history, currentUser, loading]);

    const addQuizResult = useCallback(async (result, customDate = null) => {
        const newEntryData = {
            date: customDate || new Date().toISOString(),
            ...result
        };

        if (!currentUser) {
            setHistory(prev => [{ id: Date.now(), ...newEntryData }, ...prev]);
            return;
        }

        try {
            await addDoc(collection(db, 'users', currentUser.uid, 'history'), newEntryData);
        } catch (error) {
            console.error("Error adding quiz result:", error);
        }
    }, [currentUser]);

    const deleteQuizResult = useCallback(async (id) => {
        if (!currentUser) {
            setHistory(prev => prev.filter(h => h.id !== id));
            return;
        }

        try {
            await deleteDoc(doc(db, 'users', currentUser.uid, 'history', id));
        } catch (error) {
            console.error("Error deleting quiz result:", error);
        }
    }, [currentUser]);

    const clearHistory = useCallback(async () => {
        if (!currentUser) {
            setHistory([]);
            return;
        }

        const batch = writeBatch(db);
        history.forEach(h => {
            const docRef = doc(db, 'users', currentUser.uid, 'history', h.id);
            batch.delete(docRef);
        });
        await batch.commit();
    }, [currentUser, history]);

    const importHistory = useCallback(async (newHistory) => {
        if (!Array.isArray(newHistory)) return;

        if (!currentUser) {
            setHistory(prev => {
                const historyMap = new Map(prev.map(h => [h.id, h]));
                newHistory.forEach(h => {
                    const entryWithId = h.id ? h : { ...h, id: Date.now() + Math.random() };
                    historyMap.set(entryWithId.id, entryWithId);
                });
                return Array.from(historyMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
            });
            return;
        }

        let count = 0;
        let currentBatch = writeBatch(db);

        for (const h of newHistory) {
            const docRef = doc(collection(db, 'users', currentUser.uid, 'history'));
            const { id, ...data } = h;
            currentBatch.set(docRef, data);

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
    }, [currentUser]);

    const getStreakStatus = useCallback(() => {
        if (history.length === 0) return { streak: 0, canRecover: false };

        // Get unique dates (YYYY-MM-DD) from history
        const uniqueDates = [...new Set(history.map(h => h.date.split('T')[0]))].sort().reverse();

        if (uniqueDates.length === 0) return { streak: 0, canRecover: false };

        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const dayBeforeYesterday = new Date(Date.now() - 172800000).toISOString().split('T')[0];

        // Check if the most recent quiz was today or yesterday
        const lastQuizDate = uniqueDates[0];

        // Normal streak calculation
        let streak = 0;
        let currentDate = new Date();

        // If user hasn't taken a quiz today yet, start checking from yesterday
        if (lastQuizDate !== today) {
            currentDate.setDate(currentDate.getDate() - 1);
        }

        for (let i = 0; i < uniqueDates.length; i++) {
            const checkDate = currentDate.toISOString().split('T')[0];

            if (uniqueDates.includes(checkDate)) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        // Recovery Logic:
        const canRecover = streak === 0 && lastQuizDate === dayBeforeYesterday;

        let potentialStreak = 0;
        if (canRecover) {
            let recoveryDate = new Date(Date.now() - 172800000);
            for (let i = 0; i < uniqueDates.length; i++) {
                const checkDate = recoveryDate.toISOString().split('T')[0];
                if (uniqueDates.includes(checkDate)) {
                    potentialStreak++;
                    recoveryDate.setDate(recoveryDate.getDate() - 1);
                } else {
                    break;
                }
            }
            potentialStreak += 1;
        }

        return { streak, canRecover, potentialStreak };
    }, [history]);

    return {
        history,
        loading,
        addQuizResult,
        deleteQuizResult,
        clearHistory,
        importHistory,
        getStreakStatus
    };
};
