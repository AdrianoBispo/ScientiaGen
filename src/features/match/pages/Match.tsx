import React, { useState, useEffect, useRef } from 'react';
import { generateFlashcards, FlashcardData } from '../../../services/ai';
import { Play, Settings, RefreshCw, Timer, CheckCircle, XCircle, History, Trash2, Save, Edit, X, Plus } from 'lucide-react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { ExerciseLists } from '../../../components/layout/ExerciseLists';

type GameState = 'setup' | 'loading' | 'playing' | 'finished';

interface MatchCard {
    id: string;
    text: string;
    type: 'term' | 'definition';
    matched: boolean;
    originalPairId: string; // Used to identify correct pairs
}

interface MatchHistoryItem {
    id: string;
    date: string;
    topic: string;
    pairs: number;
    timeTaken: number;
    completed: boolean;
}

interface SavedMatchGame {
    id: string;
    title: string;
    cards: FlashcardData[];
    createdAt: string;
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
    
    const [history, setHistory] = useLocalStorage<MatchHistoryItem[]>('matchHistory', []);
    const [savedGames, setSavedGames] = useLocalStorage<SavedMatchGame[]>('savedMatchGames', []);
    const [editingGame, setEditingGame] = useState<SavedMatchGame | null>(null);

    const timerRef = useRef<number | null>(null);

    const handleSaveHistory = () => {
        const timeUsed = timeLimit - timeLeft;
        const newItem: MatchHistoryItem = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            topic: topic,
            pairs: pairCount,
            timeTaken: timeUsed,
            completed: matches === pairCount
        };
        setHistory([newItem, ...history]);
    };

    const handleSaveGame = (cardsToSave: FlashcardData[]) => {
        const title = prompt("Digite um nome para este jogo:", topic);
        if(!title) return;

        const newGame: SavedMatchGame = {
             id: crypto.randomUUID(),
             title: title,
             cards: cardsToSave,
             createdAt: new Date().toISOString()
        };
        setSavedGames([newGame, ...savedGames]);
        alert('Jogo salvo com sucesso!');
    };

    const handleDeleteSavedGame = (id: string) => {
        setSavedGames(savedGames.filter(g => g.id !== id));
    };

    const handleDeleteHistoryItem = (id: string) => {
        setHistory(history.filter(item => item.id !== id));
    };

    const handlePlaySavedGame = (game: SavedMatchGame) => {
        setTopic(game.title);
        prepareGame(game.cards);
    };

    const handleEditGame = (game: SavedMatchGame) => {
        setEditingGame(game);
    };
    
    const saveEditedGame = () => {
        if (!editingGame || !editingGame.title.trim()) return;
        setSavedGames(savedGames.map(g => g.id === editingGame.id ? editingGame : g));
        setEditingGame(null);
    };

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
        handleSaveHistory();
    };

    const handleDragStart = (item: MatchCard) => {
        setDraggedItem(item);
    };

    const handleDrop = (target: MatchCard) => {
        if (!draggedItem) return;
        
        // Cannot match two terms or two definitions
        if (draggedItem.type === target.type) return;

        if (draggedItem.originalPairId === target.originalPairId) {
            // Match found!
            setGameItems(prev => ({
                terms: prev.terms.map(t => t.id === draggedItem.id || t.id === target.id ? { ...t, matched: true } : t),
                definitions: prev.definitions.map(d => d.id === draggedItem.id || d.id === target.id ? { ...d, matched: true } : d)
            }));
            setMatches(prev => {
                const newMatches = prev + 1;
                if (newMatches === gameItems.terms.length) {
                    setTimeout(finishGame, 500);
                }
                return newMatches;
            });
        }
        
        setDraggedItem(null);
    };

    const renderEditGameModal = () => {
        if (!editingGame) return null;

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Edit size={20} className="text-blue-500" />
                            Editar Jogo
                        </h3>
                        <button 
                            onClick={() => setEditingGame(null)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"
                        >
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Título do Jogo
                            </label>
                            <input 
                                type="text"
                                value={editingGame.title}
                                onChange={(e) => setEditingGame({...editingGame, title: e.target.value})}
                                className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-700 dark:text-gray-300">Pares (Termo - Definição)</h4>
                            {editingGame.cards.map((card, idx) => (
                                <div key={idx} className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl relative group">
                                     <button 
                                        onClick={() => {
                                            const newCards = editingGame.cards.filter((_, i) => i !== idx);
                                            setEditingGame({...editingGame, cards: newCards});
                                        }}
                                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <X size={16} />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Termo</label>
                                            <input 
                                                type="text"
                                                className="w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 outline-none focus:border-blue-500"
                                                value={card.term}
                                                onChange={(e) => {
                                                    const newCards = [...editingGame.cards];
                                                    newCards[idx] = { ...card, term: e.target.value };
                                                    setEditingGame({...editingGame, cards: newCards});
                                                }}
                                                placeholder="Termo"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Definição</label>
                                            <textarea 
                                                className="w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 outline-none focus:border-blue-500 resize-none min-h-[40px]"
                                                value={card.definition}
                                                onChange={(e) => {
                                                    const newCards = [...editingGame.cards];
                                                    newCards[idx] = { ...card, definition: e.target.value };
                                                    setEditingGame({...editingGame, cards: newCards});
                                                }}
                                                placeholder="Definição"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex justify-between gap-4">
                        <button 
                            onClick={() => setEditingGame({...editingGame, cards: [...editingGame.cards, { term: '', definition: '' }]})}
                            className="px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                        >
                            <Plus size={18} className="inline mr-1" /> Adicionar Novo Par
                        </button>
                        <button 
                            onClick={saveEditedGame}
                            className="flex-1 max-w-xs py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                        >
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Render Setup Screen
    if (gameState === 'setup') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 max-w-lg mx-auto text-center">
                 <div className="space-y-4">
                     <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Jogo da Memória</h1>
                     <p className="text-gray-600 dark:text-gray-300">Encontre os pares correspondentes antes que o tempo acabe.</p>
                 </div>

                 <div className="w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
                     <label className="block text-sm font-medium mb-4 text-left text-gray-700 dark:text-gray-300">Tema do Jogo</label>
                     <input 
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full p-4 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none mb-6"
                        placeholder="Ex: Países e Capitais"
                     />
                     
                     <div className="flex gap-4 mb-6">
                        <div className="flex-1">
                            <label className="block text-xs font-medium mb-2 text-left text-gray-500">Pares</label>
                            <input 
                                type="number" 
                                min="3" 
                                max="12"
                                value={pairCount}
                                onChange={(e) => setPairCount(parseInt(e.target.value))}
                                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-center"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-medium mb-2 text-left text-gray-500">Tempo (s)</label>
                            <input 
                                type="number" 
                                min="30" 
                                max="300"
                                value={timeLimit}
                                onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-center"
                            />
                        </div>
                     </div>
                     
                     {errorMsg && <p className="text-red-500 text-sm mb-4">{errorMsg}</p>}

                     <button 
                        onClick={startGame}
                        disabled={!topic || gameState === 'loading'}
                        className="w-full py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                         {gameState === 'loading' ? 'Gerando...' : 'Iniciar Jogo'}
                     </button>
                 </div>

                 <div className="w-full max-w-lg mx-auto">
                    <ExerciseLists<SavedMatchGame, MatchHistoryItem>
                        savedItems={savedGames}
                        historyItems={history}
                        onPlaySaved={handlePlaySavedGame}
                        onEditSaved={handleEditGame}
                        onDeleteSaved={handleDeleteSavedGame}
                        onDeleteHistory={handleDeleteHistoryItem}
                        getSavedTitle={(item) => item.title}
                        getSavedSubtitle={(item) => `${item.cards.length} pares • ${new Date(item.createdAt).toLocaleDateString()}`}
                        getHistoryTitle={(item) => item.topic}
                        getHistorySubtitle={(item) => `${new Date(item.date).toLocaleDateString()} • ${item.timeTaken}s`}
                    />
                 </div>
                 
                 {renderEditGameModal()}
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
                       {matches === gameItems.terms.length ? 'Você Venceu!' : 'Fim de Jogo'}
                   </h2>
                   <p className="text-gray-600 dark:text-gray-400 mt-2">
                       Você encontrou {matches} pares em {timeLimit - timeLeft} segundos.
                   </p>
                </div>

                <div className="space-y-4 w-full max-w-xs">
                    <button 
                        onClick={() => setGameState('setup')}
                        className="w-full py-3 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                    >
                        Voltar ao Menu
                    </button>
                    <button 
                        onClick={() => {
                             // Reconstruct original cards to save
                            const originalCards: FlashcardData[] = [];
                            gameItems.terms.forEach(t => {
                                const def = gameItems.definitions.find(d => d.originalPairId === t.originalPairId);
                                if (def) {
                                    originalCards.push({ term: t.text, definition: def.text });
                                }
                            });
                            handleSaveGame(originalCards);
                        }}
                        className="w-full py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition flex items-center justify-center gap-2"
                    >
                        <Save size={18} />
                        Salvar Jogo
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <button 
                    onClick={() => setGameState('setup')}
                    className="flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition"
                >
                    <Settings size={20} className="mr-2" /> Configurar
                </button>
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
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
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
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
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
