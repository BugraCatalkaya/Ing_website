import { useState, useEffect, useRef, useCallback } from 'react';
import './Games.css';

export const Games = ({ words, onExit }) => {
    const [activeGame, setActiveGame] = useState(null);

    // Memory Game State
    const [gameCards, setGameCards] = useState([]);
    const [flippedCards, setFlippedCards] = useState([]);
    const [matchedPairs, setMatchedPairs] = useState([]);
    const [moves, setMoves] = useState(0);
    const [gameWon, setGameWon] = useState(false);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [bestTime, setBestTime] = useState(() => {
        const saved = localStorage.getItem('memory_best_time');
        return saved ? parseInt(saved) : null;
    });
    const [isNewRecord, setIsNewRecord] = useState(false);

    // Speed Typer State
    const [fallingWords, setFallingWords] = useState([]);
    const [typerInput, setTyperInput] = useState('');
    const [typerScore, setTyperScore] = useState(0);
    const [typerLives, setTyperLives] = useState(3);
    const [typerGameOver, setTyperGameOver] = useState(false);
    const [typerBestScore, setTyperBestScore] = useState(() => {
        const saved = localStorage.getItem('typer_best_score');
        return saved ? parseInt(saved) : 0;
    });
    const requestRef = useRef();
    const lastSpawnTime = useRef(0);
    const gameAreaRef = useRef(null);

    // Timer logic
    useEffect(() => {
        let interval;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const formatTime = (seconds) => {
        if (seconds === null) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // --- Memory Game Logic ---
    const startMemoryGame = () => {
        const shuffledWords = [...words].sort(() => 0.5 - Math.random()).slice(0, 8);
        const cards = shuffledWords.flatMap(word => [
            { id: `${word.id}-en`, content: word.english, type: 'en', matchId: word.id },
            { id: `${word.id}-tr`, content: word.turkish, type: 'tr', matchId: word.id }
        ]).sort(() => 0.5 - Math.random());

        setGameCards(cards);
        setFlippedCards([]);
        setMatchedPairs([]);
        setMoves(0);
        setGameWon(false);
        setTimer(0);
        setIsNewRecord(false);
        setIsTimerRunning(true);
        setActiveGame('memory');
    };

    const handleCardClick = (card) => {
        if (
            flippedCards.length === 2 ||
            flippedCards.some(c => c.id === card.id) ||
            matchedPairs.includes(card.matchId)
        ) return;

        const newFlipped = [...flippedCards, card];
        setFlippedCards(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            if (newFlipped[0].matchId === newFlipped[1].matchId) {
                setMatchedPairs(prev => [...prev, newFlipped[0].matchId]);
                setFlippedCards([]);

                // Play success sound
                try {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    if (AudioContext) {
                        const ctx = new AudioContext();
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(600, ctx.currentTime);
                        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
                        gain.gain.setValueAtTime(0.1, ctx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                        osc.start();
                        osc.stop(ctx.currentTime + 0.1);
                    }
                } catch (e) {
                    // Ignore audio errors
                }
                if (matchedPairs.length + 1 === gameCards.length / 2) {
                    setGameWon(true);
                    setIsTimerRunning(false);
                    if (bestTime === null || timer < bestTime) {
                        setBestTime(timer);
                        localStorage.setItem('memory_best_time', timer);
                        setIsNewRecord(true);
                    }
                }
            } else {
                setTimeout(() => setFlippedCards([]), 1000);
            }
        }
    };

    // --- Speed Typer Logic ---
    const startSpeedTyper = () => {
        if (words.length < 5) {
            alert("You need at least 5 words to play Speed Typer!");
            return;
        }
        setFallingWords([]);
        setTyperScore(0);
        setTyperLives(3);
        setTyperGameOver(false);
        setTyperInput('');
        lastSpawnTime.current = Date.now();
        setActiveGame('speed-typer');
        requestRef.current = requestAnimationFrame(updateTyperGame);
    };

    const spawnWord = () => {
        const randomWord = words[Math.floor(Math.random() * words.length)];
        const gameWidth = gameAreaRef.current ? gameAreaRef.current.clientWidth : 800;
        const x = Math.random() * (gameWidth - 150); // Keep within bounds

        setFallingWords(prev => [
            ...prev,
            {
                id: Date.now(),
                text: randomWord.english,
                x,
                y: -50,
                speed: 1 + (typerScore * 0.05) // Increase speed with score
            }
        ]);
    };

    const updateTyperGame = useCallback(() => {
        if (typerGameOver) return;

        const now = Date.now();
        // Spawn rate increases with score (harder)
        const spawnRate = Math.max(1000, 3000 - (typerScore * 50));

        if (now - lastSpawnTime.current > spawnRate) {
            spawnWord();
            lastSpawnTime.current = now;
        }

        setFallingWords(prev => {
            const nextWords = [];
            let livesLost = 0;

            prev.forEach(word => {
                const nextY = word.y + word.speed;
                if (nextY > 450) { // Hit bottom
                    livesLost++;
                } else {
                    nextWords.push({ ...word, y: nextY });
                }
            });

            if (livesLost > 0) {
                setTyperLives(l => {
                    const newLives = l - livesLost;
                    if (newLives <= 0) {
                        setTyperGameOver(true);
                        cancelAnimationFrame(requestRef.current);
                    }
                    return newLives;
                });
            }

            return nextWords;
        });

        if (!typerGameOver) {
            requestRef.current = requestAnimationFrame(updateTyperGame);
        }
    }, [typerScore, typerGameOver, words]);

    // Clean up animation frame
    useEffect(() => {
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    // Re-bind animation loop when state changes (to capture fresh state if needed, though mostly handled by refs/setters)
    useEffect(() => {
        if (activeGame === 'speed-typer' && !typerGameOver) {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = requestAnimationFrame(updateTyperGame);
        }
    }, [updateTyperGame, activeGame, typerGameOver]);

    const handleTyperInput = (e) => {
        const input = e.target.value;
        setTyperInput(input);

        const matchIndex = fallingWords.findIndex(w => !w.matched && w.text.toLowerCase() === input.toLowerCase().trim());
        if (matchIndex !== -1) {
            // Match found!
            // Play success sound if possible (simple beep using AudioContext)
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    const ctx = new AudioContext();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(500, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
                    gain.gain.setValueAtTime(0.1, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.1);
                }
            } catch (e) {
                // Ignore audio errors
            }

            // Mark as matched for animation
            setFallingWords(prev => prev.map((w, i) =>
                i === matchIndex ? { ...w, matched: true } : w
            ));

            setTyperScore(s => {
                const newScore = s + 1;
                if (newScore > typerBestScore) {
                    setTyperBestScore(newScore);
                    localStorage.setItem('typer_best_score', newScore);
                }
                return newScore;
            });
            setTyperInput(''); // Clear input

            // Remove after animation
            setTimeout(() => {
                setFallingWords(prev => prev.filter((_, i) => i !== matchIndex));
            }, 300);
        }
    };

    // --- Render ---

    if (activeGame === 'memory') {
        return (
            <div className="games-container">
                <div className="game-stats">
                    <div className="stat-box">⏱️ {formatTime(timer)}</div>
                    <div className="stat-box">Moves: {moves}</div>
                    <div className="stat-box" title="Your Best Time">🏆 Best: {formatTime(bestTime)}</div>
                </div>

                {gameWon ? (
                    <div className="completion-state" style={{ textAlign: 'center', padding: '3rem' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                        <h2>{isNewRecord ? '🏆 NEW RECORD! 🏆' : 'You Won!'}</h2>
                        <p>Great memory! You completed the game in {formatTime(timer)} and {moves} moves.</p>
                        <div className="game-controls">
                            <button className="play-btn" onClick={startMemoryGame}>Play Again</button>
                            <button className="back-btn" onClick={() => setActiveGame(null)}>Back to Games</button>
                        </div>
                    </div>
                ) : (
                    <div className="memory-game-board">
                        {gameCards.map(card => (
                            <div
                                key={card.id}
                                className={`memory-card ${flippedCards.some(c => c.id === card.id) || matchedPairs.includes(card.matchId)
                                    ? 'flipped'
                                    : ''
                                    } ${matchedPairs.includes(card.matchId) ? 'matched' : ''}`}
                                onClick={() => handleCardClick(card)}
                            >
                                <div className="card-face card-front">?</div>
                                <div className="card-face card-back">{card.content}</div>
                            </div>
                        ))}
                    </div>
                )}

                {!gameWon && (
                    <div className="game-controls">
                        <button className="back-btn" onClick={() => {
                            setIsTimerRunning(false);
                            setActiveGame(null);
                        }}>Quit Game</button>
                    </div>
                )}
            </div>
        );
    }

    if (activeGame === 'speed-typer') {
        return (
            <div className="games-container">
                <div className="game-stats">
                    <div className="stat-box score-display">Score: {typerScore}</div>
                    <div className="stat-box lives-display">{'❤️'.repeat(Math.max(0, typerLives))}</div>
                    <div className="stat-box">🏆 Best: {typerBestScore}</div>
                </div>

                <div className="typer-game-area" ref={gameAreaRef}>
                    {typerGameOver && (
                        <div className="game-over-overlay">
                            <div className="game-over-content">
                                <div className="game-over-icon">💥</div>
                                <h2 className="game-over-title">Game Over!</h2>
                                <div className="game-over-score">
                                    Final Score
                                    <span className="score-highlight">{typerScore}</span>
                                </div>
                                <div className="game-controls">
                                    <button className="play-btn" onClick={startSpeedTyper}>Try Again</button>
                                    <button className="back-btn" onClick={() => setActiveGame(null)}>Exit</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {fallingWords.map(word => (
                        <div
                            key={word.id}
                            className={`falling-word ${word.y > 350 ? 'danger' : ''} ${word.matched ? 'correct' : ''}`}
                            style={{ left: word.x, top: word.y }}
                        >
                            {word.text}
                            {word.matched && <span style={{ marginLeft: '0.5rem' }}>✨</span>}
                        </div>
                    ))}
                </div>

                <div className="typer-input-container">
                    <input
                        type="text"
                        className="typer-input"
                        placeholder="Type the falling words..."
                        value={typerInput}
                        onChange={handleTyperInput}
                        autoFocus
                        disabled={typerGameOver}
                    />
                </div>

                {!typerGameOver && (
                    <div className="game-controls">
                        <button className="back-btn" onClick={() => {
                            setTyperGameOver(true); // Stop loop
                            setActiveGame(null);
                        }}>Quit Game</button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="games-container">
            <div className="games-header">
                <h2>Game Zone 🎮</h2>
                <p>Learn while having fun!</p>
            </div>

            <div className="games-grid">
                <div className="game-card" onClick={startMemoryGame}>
                    <span className="game-icon">🧠</span>
                    <h3>Memory Match</h3>
                    <p>Find matching pairs of English and Turkish words.</p>
                    {bestTime !== null && (
                        <div style={{
                            margin: '1rem 0',
                            padding: '0.5rem',
                            background: 'rgba(16, 185, 129, 0.1)',
                            borderRadius: '8px',
                            color: '#10b981',
                            fontWeight: '600'
                        }}>
                            🏆 Best: {formatTime(bestTime)}
                        </div>
                    )}
                    <button className="play-btn">Play Now</button>
                </div>

                <div className="game-card" onClick={startSpeedTyper}>
                    <span className="game-icon">⌨️</span>
                    <h3>Speed Typer</h3>
                    <p>Type the falling words before they hit the bottom!</p>
                    {typerBestScore > 0 && (
                        <div style={{
                            margin: '1rem 0',
                            padding: '0.5rem',
                            background: 'rgba(99, 102, 241, 0.1)',
                            borderRadius: '8px',
                            color: 'var(--accent-primary)',
                            fontWeight: '600'
                        }}>
                            🏆 Best Score: {typerBestScore}
                        </div>
                    )}
                    <button className="play-btn">Play Now</button>
                </div>
            </div>
        </div>
    );
};
