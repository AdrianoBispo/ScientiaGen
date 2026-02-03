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
        if (!topic.trim()) {
            setErrorMsg('Por favor, insira um tópico.');
            return;
        }

        setGameState('loading');
        setErrorMsg('');
        
        try {
            const cards = await generateFlashcards(topic, pairCount);
            
            if (cards.length < pairCount) {
                setErrorMsg(`Não foi possível gerar ${pairCount} pares. Tentando com ${cards.length}.`);
            }

            prepareGameBoard(cards);
            setTimeLeft(timeLimit);
            setMatches(0);
            setGameState('playing');
        } catch (error) {
            console.error(error);
            setErrorMsg('Erro ao gerar o jogo. Tente novamente.');
            setGameState('setup');
        }
    };

    const prepareGameBoard = (cards: FlashcardData[]) => {
        const newTerms: MatchCard[] = [];
        const newDefinitions: MatchCard[] = [];

        cards.forEach((card, index) => {
            const pairId = `pair-${index}`;
            newTerms.push({
                id: `term-${index}`,
                text: card.term,
                type: 'term',
                matched: false,
                originalPairId: pairId
            });
            newDefinitions.push({
                id: `def-${index}`,
                text: card.definition,
                type: 'definition',
                matched: false,
                originalPairId: pairId
            });
        });

        setGameItems({
            terms: shuffleArray(newTerms),
            definitions: shuffleArray(newDefinitions)
        });
    };

    const shuffleArray = <T,>(array: T[]): T[] => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    const handleDragStart = (e: React.DragEvent, item: MatchCard) => {
        if (item.matched) return;
        setDraggedItem(item);
        e.dataTransfer.setData('text/plain', item.originalPairId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const handleDrop = (e: React.DragEvent, targetItem: MatchCard) => {
        e.preventDefault();
        if (!draggedItem || targetItem.matched || draggedItem.type === targetItem.type) return;

        const draggedPairId = draggedItem.originalPairId;
        
        if (draggedPairId === targetItem.originalPairId) {
            // Match found!
            handleMatch(draggedItem, targetItem);
        } else {
            // Incorrect match visual feedback
            const targetElement = e.currentTarget as HTMLElement;
            targetElement.classList.add('animate-shake');
            setTimeout(() => targetElement.classList.remove('animate-shake'), 500);
        }
        setDraggedItem(null);
    };

    const handleMatch = (item1: MatchCard, item2: MatchCard) => {
        setGameItems(prev => ({
            terms: prev.terms.map(item => 
                (item.id === item1.id || item.id === item2.id) ? { ...item, matched: true } : item
            ),
            definitions: prev.definitions.map(item => 
                (item.id === item1.id || item.id === item2.id) ? { ...item, matched: true } : item
            )
        }));
        
        setMatches(prev => {
            const newMatches = prev + 1;
            if (newMatches >= gameItems.terms.length) {
                // Game Completed successfully
                setTimeout(finishGame, 500);
            }
            return newMatches;
        });
    };

    const finishGame = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setGameState('finished');
    };

    const resetGame = () => {
        setGameState('setup');
        setTopic('');
        setMatches(0);
        setErrorMsg('');
    };

    const replayGame = () => {
        // Shuffle existing items again and restart
        const currentTerms = gameItems.terms.map(t => ({...t, matched: false}));
        const currentDefs = gameItems.definitions.map(d => ({...d, matched: false}));
        
        setGameItems({
            terms: shuffleArray(currentTerms),
            definitions: shuffleArray(currentDefs)
        });
        setTimeLeft(timeLimit);
        setMatches(0);
        setGameState('playing');
    };

    // -- Render Helpers --

    const renderSetup = () => (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Settings className="w-6 h-6 text-indigo-600" />
                Configuração do Jogo
            </h2>
            
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tópico de Estudo</label>
                    <input 
                        type="text" 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Ex: Revolução Francesa, Tabela Periódica..."
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pares de Cartões</label>
                        <select 
                            value={pairCount}
                            onChange={(e) => setPairCount(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value={4}>4 Pares</option>
                            <option value={6}>6 Pares</option>
                            <option value={8}>8 Pares</option>
                            <option value={10}>10 Pares</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tempo Limite</label>
                        <select 
                            value={timeLimit}
                            onChange={(e) => setTimeLimit(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value={60}>1 Minuto</option>
                            <option value={120}>2 Minutos</option>
                            <option value={180}>3 Minutos</option>
                            <option value={300}>5 Minutos</option>
                        </select>
                    </div>
                </div>

                {errorMsg && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                        {errorMsg}
                    </div>
                )}

                <button 
                    onClick={startGame}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                    <Play className="w-5 h-5" />
                    Iniciar Jogo
                </button>
            </div>
        </div>
    );

    const renderLoading = () => (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Gerando pares de combinação com IA...</p>
        </div>
    );

    const renderPlaying = () => (
        <div className="flex flex-col h-full">
            {/* Header: Timer & Score */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="flex items-center gap-2 text-xl font-bold text-gray-800">
                    <Timer className={`w-6 h-6 ${timeLeft < 30 ? 'text-red-500' : 'text-indigo-600'}`} />
                    <span className={timeLeft < 30 ? 'text-red-500' : ''}>
                        {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                    </span>
                </div>
                <div className="text-gray-600 font-medium">
                    Combinados: <span className="text-green-600 font-bold">{matches}</span> / {gameItems.terms.length}
                </div>
            </div>

            {/* Game Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                {/* Terms Column */}
                <div className="space-y-3">
                    <h3 className="text-center text-gray-500 font-medium mb-2">Termos</h3>
                    {gameItems.terms.map((item) => (
                        <div
                            key={item.id}
                            draggable={!item.matched}
                            onDragStart={(e) => handleDragStart(e, item)}
                            className={`p-4 rounded-lg shadow-sm border-2 transition-all cursor-grab active:cursor-grabbing
                                ${item.matched 
                                    ? 'bg-gray-100 border-gray-200 text-gray-400 opacity-60' 
                                    : 'bg-white border-indigo-100 hover:border-indigo-300 hover:shadow-md'
                                }
                            `}
                        >
                            {item.matched ? <span className="line-through decoration-2">{item.text}</span> : item.text}
                        </div>
                    ))}
                </div>

                {/* Definitions Column */}
                <div className="space-y-3">
                    <h3 className="text-center text-gray-500 font-medium mb-2">Definições</h3>
                    {gameItems.definitions.map((item) => (
                        <div
                            key={item.id}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, item)}
                            className={`p-4 rounded-lg shadow-sm border-2 transition-all min-h-[80px] flex items-center
                                ${item.matched 
                                    ? 'bg-gray-100 border-gray-200 text-gray-400 opacity-60' 
                                    : 'bg-white border-dashed border-gray-300 hover:bg-gray-50'
                                }
                            `}
                        >
                            {item.matched ? <span className="line-through decoration-2">{item.text}</span> : <span className="text-sm">{item.text}</span>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderFinished = () => {
        const isWin = matches === gameItems.terms.length;
        
        return (
            <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center">
                <div className="mb-6 flex justify-center">
                    {isWin ? (
                        <div className="bg-green-100 p-4 rounded-full">
                            <CheckCircle className="w-16 h-16 text-green-600" />
                        </div>
                    ) : (
                        <div className="bg-orange-100 p-4 rounded-full">
                            <XCircle className="w-16 h-16 text-orange-600" />
                        </div>
                    )}
                </div>
                
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                    {isWin ? 'Parabéns!' : 'Tempo Esgotado!'}
                </h2>
                <p className="text-gray-600 mb-8">
                    {isWin 
                        ? `Você combinou todos os ${pairCount} pares em ${timeLimit - timeLeft} segundos.` 
                        : `Você conseguiu combinar ${matches} de ${pairCount} pares.`
                    }
                </p>

                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={replayGame}
                        className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Jogar Novamente
                    </button>
                    <button 
                        onClick={resetGame}
                        className="py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
                    >
                        Novo Tópico
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto max-w-5xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Modo Combinar</h1>
                <p className="text-gray-600 mt-2">Arraste os termos da esquerda para as definições corretas na direita.</p>
            </div>

            {gameState === 'setup' && renderSetup()}
            {gameState === 'loading' && renderLoading()}
            {gameState === 'playing' && renderPlaying()}
            {gameState === 'finished' && renderFinished()}

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                    border-color: #ef4444 !important; /* Red border on error */
                    background-color: #fef2f2 !important;
                }
            `}</style>
        </div>
    );
}

export default Match;
