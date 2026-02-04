import React, { useState, useEffect, useRef } from 'react';
import { generateFlashcards, FlashcardData } from '../services/ai';
import { Play, Settings, RefreshCw, Timer, CheckCircle, XCircle } from 'lucide-react';

type GameState = 'setup' | 'loading' | 'playing' | 'finished';

interface MatchCard {
    id: string;
    text: string;
    type: 'term' | 'definition';
    matched: boolean;
    originalPairId: string; // Used to identify correct pairs
}

export function Match() {
    // Game Configuration State
    const [topic, setTopic] = useState('');
    const [pairCount, setPairCount] = useState(6);
    const [timeLimit, setTimeLimit] = useState(120); // seconds
    
    // Game Runtime State
    const [gameState, setGameState] = useState<GameState>('setup');
    const [matches, setMatches] = useState<number>(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [gameItems, setGameItems] = useState<{terms: MatchCard[], definitions: MatchCard[]}>({ terms: [], definitions: [] });
    const [draggedItem, setDraggedItem] = useState<MatchCard | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    const timerRef = useRef<number | null>(null);

    // Initial default values for config
    useEffect(() => {
        setPairCount(6);
        setTimeLimit(120);
    }, []);

    // Timer Logic
    useEffect(() => {
        if (gameState === 'playing') {
            timerRef.current = window.setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        finishGame();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
             if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameState]);

    const startGame = async () => {
        if (!topic) return;
        setGameState('loading');
        setErrorMsg('');
        
        try {
            const cards = await generateFlashcards(topic, pairCount);
            if (cards.length < 3) {
                setErrorMsg("Não foi possível gerar pares suficientes. Tente outro tópico.");
                setGameState('setup');
                return;
            }
            prepareGame(cards);
        } catch (error) {
            console.error(error);
            setErrorMsg("Erro ao gerar o jogo. Tente novamente.");
            setGameState('setup');
        }
    };

    const prepareGame = (cards: FlashcardData[]) => {
        const terms: MatchCard[] = cards.map((c, i) => ({
            id: `term-${i}`,
            text: c.term,
            type: 'term',
            matched: false,
            originalPairId: `pair-${i}`
        })).sort(() => Math.random() - 0.5);

        const definitions: MatchCard[] = cards.map((c, i) => ({
            id: `def-${i}`,
            text: c.definition,
            type: 'definition',
            matched: false,
            originalPairId: `pair-${i}`
        })).sort(() => Math.random() - 0.5);

        setGameItems({ terms, definitions });
        setTimeLeft(timeLimit);
        setMatches(0);
        setGameState('playing');
    };

    const finishGame = () => {
        setGameState('finished');
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const handleDragStart = (item: MatchCard) => {
        setDraggedItem(item);
    };

    const handleDrop = (targetItem: MatchCard) => {
        if (!draggedItem) return;
        
        // Cannot match same type (term-term or def-def)
        if (draggedItem.type === targetItem.type) return;

        // Check Match
        if (draggedItem.originalPairId === targetItem.originalPairId) {
            // Success
            const newTerms = gameItems.terms.map(item => 
                (item.id === draggedItem.id || item.id === targetItem.id) ? { ...item, matched: true } : item
            );
            const newDefs = gameItems.definitions.map(item => 
                (item.id === draggedItem.id || item.id === targetItem.id) ? { ...item, matched: true } : item
            );
            
            setGameItems({ terms: newTerms, definitions: newDefs });
            setMatches(m => {
                const newMatches = m + 1;
                if (newMatches >= gameItems.terms.length) finishGame();
                return newMatches;
            });
        }
        
        setDraggedItem(null);
    };

    // Render Setup Screen
    if (gameState === 'setup') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center w-full max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Modo Combinar</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-8">Arraste os termos da esquerda para as definições corretas na direita.</p>

                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 w-full max-w-lg">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-white">
                        <Settings className="text-blue-600 dark:text-blue-400" /> Configuração do Jogo
                    </h2>
                    
                    <div className="space-y-4 text-left">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tópico de Estudo</label>
                            <input 
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ex: Revolução Francesa, Tabela Periódica..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Pares de Cartões</label>
                                <select 
                                    value={pairCount}
                                    onChange={(e) => setPairCount(Number(e.target.value))}
                                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value={4}>4 Pares</option>
                                    <option value={6}>6 Pares</option>
                                    <option value={8}>8 Pares</option>
                                    <option value={10}>10 Pares</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tempo Limite</label>
                                <select 
                                    value={timeLimit}
                                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value={60}>1 Minuto</option>
                                    <option value={120}>2 Minutos</option>
                                    <option value={180}>3 Minutos</option>
                                    <option value={300}>5 Minutos</option>
                                </select>
                            </div>
                        </div>

                        {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

                        <button 
                            onClick={startGame}
                            disabled={!topic}
                            className="w-full py-3 mt-4 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Play size={20} fill="currentColor" /> Iniciar Jogo
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    if (gameState === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <RefreshCw className="animate-spin text-blue-600 dark:text-blue-400 mb-4" size={40} />
                <p className="text-gray-600 dark:text-gray-300">Gerando o jogo...</p>
            </div>
        );
    }

    if (gameState === 'finished') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in zoom-in duration-300">
                <div className="mb-6 flex flex-col items-center">
                   {matches === gameItems.terms.length ? (
                       <CheckCircle size={80} className="text-green-500 mb-4" />
                   ) : (
                       <XCircle size={80} className="text-red-500 mb-4" />
                   )}
                   <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                       {matches === gameItems.terms.length ? "Parabéns!" : "Tempo Esgotado!"}
                   </h2>
                </div>

                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 w-full max-w-sm text-center mb-8">
                    <p className="text-gray-500 dark:text-gray-400 mb-1">Pontuação Final</p>
                    <p className="text-4xl font-bold text-gray-800 dark:text-white mb-6">{matches} / {gameItems.terms.length}</p>
                    
                    <button 
                        onClick={() => setGameState('setup')}
                        className="w-full py-3 bg-gray-800 dark:bg-slate-700 text-white rounded-xl font-medium hover:bg-gray-900 dark:hover:bg-slate-600 transition"
                    >
                        Jogar Novamente
                    </button>
                </div>
            </div>
        );
    }

    // Render Game Board
    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            {/* Game Header */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 mb-6">
                <h2 className="font-bold text-gray-700 dark:text-white flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    {topic}
                </h2>
                <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 30 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                    <Timer size={24} />
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
                <div className="font-bold text-blue-600 dark:text-blue-400">
                    Matches: {matches}/{gameItems.terms.length}
                </div>
            </div>

            {/* Game Area */}
            <div className="flex-1 flex gap-8 min-h-0">
                {/* Terms Column */}
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2">
                    {gameItems.terms.map(item => (
                        <div
                            key={item.id}
                            draggable={!item.matched}
                            onDragStart={() => handleDragStart(item)}
                            className={`
                                p-4 rounded-xl shadow-sm border-2 transition-all cursor-grab active:cursor-grabbing text-sm
                                ${item.matched 
                                    ? 'opacity-0 pointer-events-none' 
                                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
                                }
                            `}
                        >
                            <span className="font-medium text-gray-800 dark:text-gray-200">{item.text}</span>
                        </div>
                    ))}
                </div>

                {/* Definitions Column */}
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2">
                     {gameItems.definitions.map(item => (
                        <div
                            key={item.id}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(item)}
                            className={`
                                p-4 rounded-xl shadow-sm border-2 transition-all text-sm flex items-center min-h-[60px]
                                ${item.matched 
                                    ? 'opacity-0 pointer-events-none' 
                                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-900 dark:text-blue-100 border-dashed'
                                }
                            `}
                        >
                            {item.matched ? null : item.text}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
