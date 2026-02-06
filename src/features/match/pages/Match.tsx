import React, { useState, useEffect, useRef } from 'react';
import { generateFlashcards, FlashcardData } from '../../../services/ai';
import { parseSpreadsheet, getAcceptString, isValidSpreadsheetFile } from '../../../utils/spreadsheetParser';
import { Play, Settings, RefreshCw, Timer, CheckCircle, XCircle, History, Trash2, Save, Edit, X, Plus, Brain, ArrowLeft, FileSpreadsheet, Loader2, Sparkles, Pencil } from 'lucide-react';
import { usePersistence } from '../../../hooks/usePersistence';
import { ExerciseLists } from '../../../components/layout/ExerciseLists';
import { ExerciseSetup } from '../../../components/exercises/ExerciseSetup';
import { ExerciseCompletion } from '../../../components/exercises/ExerciseCompletion';

const MAX_VISIBLE_PAIRS = 6;

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
    const [currentView, setCurrentView] = useState<'setup' | 'ai' | 'manual'>('setup');
    const [showSetup, setShowSetup] = useState(false);
    const [pendingAction, setPendingAction] = useState<'ai' | 'saved' | null>(null);
    const [selectedSavedGame, setSelectedSavedGame] = useState<SavedMatchGame | null>(null);
    const [resultSaved, setResultSaved] = useState(false);
    
    // Manual creation state
    const [manualTitle, setManualTitle] = useState('');
    const [manualCards, setManualCards] = useState<FlashcardData[]>([{ term: '', definition: '' }]);
    
    // Game Runtime State
    const [gameState, setGameState] = useState<GameState>('setup');
    const [matches, setMatches] = useState<number>(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [gameItems, setGameItems] = useState<{terms: MatchCard[], definitions: MatchCard[]}>({ terms: [], definitions: [] });
    const [draggedItem, setDraggedItem] = useState<MatchCard | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [visiblePairIds, setVisiblePairIds] = useState<string[]>([]);
    
    const [history, setHistory] = usePersistence<MatchHistoryItem[]>('matchHistory', []);
    const [savedGames, setSavedGames] = usePersistence<SavedMatchGame[]>('savedMatchGames', []);
    const [editingGame, setEditingGame] = useState<SavedMatchGame | null>(null);

    const timerRef = useRef<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Spreadsheet Import State
    const [isImporting, setIsImporting] = useState(false);
    const [importError, setImportError] = useState('');

    const handleSpreadsheetImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!isValidSpreadsheetFile(file)) {
            setImportError('Formato de arquivo não suportado. Use .xlsx, .xls, .csv, .ods ou .xlsm');
            return;
        }

        setIsImporting(true);
        setImportError('');

        try {
            const result = await parseSpreadsheet(file);
            
            if (result.success && result.data.length >= 3) {
                // Pre-fill the manual creation form with imported data
                setManualTitle(file.name.replace(/\.[^/.]+$/, '')); // Remove extension
                setManualCards(result.data.map(row => ({ term: row.term, definition: row.definition })));
                setCurrentView('manual');
            } else if (result.success && result.data.length < 3) {
                setImportError('O arquivo deve conter pelo menos 3 pares válidos.');
            } else {
                setImportError(result.error || 'Erro ao importar arquivo.');
            }
        } catch (error) {
            console.error('Error importing spreadsheet:', error);
            setImportError('Erro ao processar o arquivo.');
        } finally {
            setIsImporting(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

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
        setSelectedSavedGame(game);
        setTopic(game.title);
        setPendingAction('saved');
        setShowSetup(true);
    };

    const handleEditGame = (game: SavedMatchGame) => {
        setEditingGame(game);
    };
    
    const saveEditedGame = () => {
        if (!editingGame || !editingGame.title.trim()) return;
        setSavedGames(savedGames.map(g => g.id === editingGame.id ? editingGame : g));
        setEditingGame(null);
    };

    const handleSaveManualGame = () => {
        if (!manualTitle.trim()) return;
        const validCards = manualCards.filter(c => c.term.trim() && c.definition.trim());
        if (validCards.length < 3) {
            setErrorMsg('Adicione pelo menos 3 pares válidos.');
            return;
        }

        const newGame: SavedMatchGame = {
            id: crypto.randomUUID(),
            title: manualTitle,
            cards: validCards,
            createdAt: new Date().toISOString()
        };

        setSavedGames([...savedGames, newGame]);
        setManualTitle('');
        setManualCards([{ term: '', definition: '' }]);
        setCurrentView('setup');
    };

    const renderAIView = () => (
        <div className="w-full max-w-4xl mx-auto p-6">
            <button 
                onClick={() => setCurrentView('setup')} 
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:hover:text-white mb-6 transition"
            >
                <ArrowLeft size={20} /> Voltar
            </button>

            <div className="flex flex-col h-full">
                <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white text-center">Gerar com IA</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">Use o formulário abaixo para gerar pares de termos e definições com IA.</p>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 mb-8">
                    <label className="block text-sm font-medium mb-4 text-left text-gray-700 dark:text-gray-300">Tópico do Jogo</label>
                    <input 
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full p-4 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none mb-4"
                        placeholder="Ex: Países e Capitais"
                    />
                    
                    <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                            <label className="block text-xs font-medium mb-2 text-left text-gray-500">Pares</label>
                            <input 
                                type="number" 
                                min="3" 
                                max="12"
                                value={pairCount}
                                onChange={(e) => setPairCount(parseInt(e.target.value))}
                                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-center dark:text-white"
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
                                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-center dark:text-white"
                            />
                        </div>
                    </div>
                    
                    {errorMsg && <p className="text-red-500 text-sm mb-4">{errorMsg}</p>}

                    <button 
                        onClick={() => {
                            if (!topic) return;
                            setPendingAction('ai');
                            setShowSetup(true);
                        }}
                        disabled={!topic || gameState === 'loading'}
                        className="w-full py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Sparkles size={20} />
                        {gameState === 'loading' ? 'Gerando...' : 'Gerar Jogo'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderManualCreationView = () => (
        <div className="w-full max-w-4xl mx-auto p-6">
            <button 
                onClick={() => setCurrentView('setup')} 
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:hover:text-white mb-6 transition"
            >
                <ArrowLeft size={20} /> Voltar
            </button>

            <div className="flex flex-col h-full">
                <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white text-center">Criar Jogo Manualmente</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">Crie seus próprios pares de termos e definições. Mínimo de 3 pares.</p>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 mb-8">
                    <input 
                        type="text" 
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        className="w-full p-4 mb-6 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-lg"
                        placeholder="Nome do Jogo (Ex: Países e Capitais)"
                    />

                    <div className="space-y-4">
                        {manualCards.map((card, idx) => (
                            <div key={idx} className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl border border-gray-100 dark:border-slate-600 relative group animate-fade-in">
                                <button 
                                    onClick={() => {
                                        if (manualCards.length > 1) {
                                            setManualCards(manualCards.filter((_, i) => i !== idx));
                                        }
                                    }}
                                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition opacity-0 group-hover:opacity-100"
                                    disabled={manualCards.length === 1}
                                >
                                    <X size={16} />
                                </button>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-6">
                                    <input 
                                        className="w-full p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-800 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        value={card.term}
                                        onChange={(e) => {
                                            const newCards = [...manualCards];
                                            newCards[idx] = { ...card, term: e.target.value };
                                            setManualCards(newCards);
                                        }}
                                        placeholder="Termo"
                                    />
                                    <input 
                                        className="w-full p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-600 dark:text-gray-300 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        value={card.definition}
                                        onChange={(e) => {
                                            const newCards = [...manualCards];
                                            newCards[idx] = { ...card, definition: e.target.value };
                                            setManualCards(newCards);
                                        }}
                                        placeholder="Definição"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {errorMsg && <p className="text-red-500 text-sm mt-4">{errorMsg}</p>}

                    <div className="mt-6 flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100 dark:border-slate-700">
                        <button 
                            onClick={() => setManualCards([...manualCards, { term: '', definition: '' }])}
                            className="flex items-center justify-center gap-2 px-6 py-3 border border-blue-600 text-blue-600 dark:text-blue-400 rounded-xl font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group"
                        >
                            <Plus size={20} className="group-hover:scale-110 transition-transform"/> Adicionar Par
                        </button>
                        <button 
                            onClick={handleSaveManualGame}
                            disabled={!manualTitle.trim() || manualCards.filter(c => c.term.trim() && c.definition.trim()).length < 3}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-200 dark:shadow-none"
                        >
                            Salvar Jogo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

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
            type: 'term' as const,
            matched: false,
            originalPairId: `pair-${i}`
        })).sort(() => Math.random() - 0.5);

        const definitions: MatchCard[] = cards.map((c, i) => ({
            id: `def-${i}`,
            text: c.definition,
            type: 'definition' as const,
            matched: false,
            originalPairId: `pair-${i}`
        })).sort(() => Math.random() - 0.5);

        // Collect all unique pair IDs and show only the first MAX_VISIBLE_PAIRS
        const allPairIds = [...new Set(terms.map(t => t.originalPairId))];
        setVisiblePairIds(allPairIds.slice(0, MAX_VISIBLE_PAIRS));

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
            const matchedPairId = draggedItem.originalPairId;

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

            // After a short delay, swap the matched pair for the next queued one
            setTimeout(() => {
                setVisiblePairIds(prev => {
                    const allPairIds = gameItems.terms.map(t => t.originalPairId);
                    const queuedPairIds = allPairIds.filter(id => !prev.includes(id));
                    const nextPairId = queuedPairIds[0];

                    const updated = prev.filter(id => id !== matchedPairId);
                    if (nextPairId) {
                        updated.push(nextPairId);
                    }
                    return updated;
                });
            }, 400);
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

    // Confirm start from setup screen
    const confirmStartGame = async () => {
        if (pendingAction === 'saved' && selectedSavedGame) {
            prepareGame(selectedSavedGame.cards);
            setShowSetup(false);
            setResultSaved(false);
            return;
        }
        if (pendingAction === 'ai') {
            setShowSetup(false);
            await startGame();
            setResultSaved(false);
        }
    };

    // Render Setup Screen
    if (showSetup) {
        const configurations: any[] = [];
        if (pendingAction === 'ai') {
            configurations.push({
                label: 'Pares',
                value: pairCount,
                type: 'select',
                options: [
                    { label: '3 Pares', value: 3 },
                    { label: '6 Pares', value: 6 },
                    { label: '9 Pares', value: 9 },
                    { label: '12 Pares', value: 12 },
                ],
                onChange: (val: any) => setPairCount(Number(val))
            });
            configurations.push({
                label: 'Tempo Limite',
                value: timeLimit,
                type: 'select',
                options: [
                    { label: '60 segundos', value: 60 },
                    { label: '120 segundos', value: 120 },
                    { label: '180 segundos', value: 180 },
                    { label: '300 segundos', value: 300 },
                ],
                onChange: (val: any) => setTimeLimit(Number(val))
            });
        } else if (pendingAction === 'saved' && selectedSavedGame) {
            configurations.push({
                label: 'Pares',
                value: `${selectedSavedGame.cards.length} pares`,
                type: 'readonly'
            });
            configurations.push({
                label: 'Tempo Limite',
                value: timeLimit,
                type: 'select',
                options: [
                    { label: '60 segundos', value: 60 },
                    { label: '120 segundos', value: 120 },
                    { label: '180 segundos', value: 180 },
                    { label: '300 segundos', value: 300 },
                ],
                onChange: (val: any) => setTimeLimit(Number(val))
            });
        }

        return (
            <ExerciseSetup
                title={`Jogo: ${topic}`}
                description="Configure e comece o jogo da memória"
                configurations={configurations}
                onStart={confirmStartGame}
                onBack={() => setShowSetup(false)}
                startLabel={gameState === 'loading' ? "Gerando..." : "Começar"}
            />
        );
    }

    if (gameState === 'setup') {
        if (currentView === 'ai') {
            return renderAIView();
        }

        if (currentView === 'manual') {
            return renderManualCreationView();
        }

        return (
            <div className="w-full max-w-6xl mx-auto p-6">
                 <h2 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">Jogo da Memória</h2>
                 <p className="text-gray-500 dark:text-gray-400 mb-8">Escolha como deseja criar seu jogo.</p>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <button 
                        onClick={() => setCurrentView('ai')}
                        className="p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col items-start text-left gap-4 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all group"
                    >
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl group-hover:scale-110 transition-transform">
                            <Sparkles size={28} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-1">Gerar com IA</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Use o formulário para gerar pares de termos e definições com IA.</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => setCurrentView('manual')}
                        className="p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col items-start text-left gap-4 hover:border-green-400 dark:hover:border-green-500 hover:shadow-md transition-all group"
                    >
                        <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl group-hover:scale-110 transition-transform">
                            <Pencil size={28} className="text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-1">Criar Manualmente</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Crie seus próprios pares de termo e definição.</p>
                        </div>
                    </button>

                    <label 
                        className="p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col items-start text-left gap-4 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md transition-all group cursor-pointer md:col-span-2 lg:col-span-1"
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            accept={getAcceptString()}
                            onChange={handleSpreadsheetImport}
                            className="hidden"
                            disabled={isImporting}
                        />
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl group-hover:scale-110 transition-transform">
                            {isImporting ? (
                                <Loader2 size={28} className="text-purple-600 dark:text-purple-400 animate-spin" />
                            ) : (
                                <FileSpreadsheet size={28} className="text-purple-600 dark:text-purple-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-1">{isImporting ? 'Importando...' : 'Importar Planilha'}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Importe dados de .xlsx, .xls, .csv, .ods ou .xlsm.</p>
                        </div>
                    </label>
                 </div>

                 {importError && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                        {importError}
                    </div>
                 )}

                 <div className="w-full">
                    <ExerciseLists<SavedMatchGame, MatchHistoryItem>
                        savedItems={savedGames}
                        historyItems={history}
                        onPlaySaved={handlePlaySavedGame}
                        onEditSaved={handleEditGame}
                        onDeleteSaved={handleDeleteSavedGame}
                        onDeleteHistory={handleDeleteHistoryItem}
                        getSavedTitle={(item) => item.title}
                        getSavedSubtitle={(item) => `${item.cards.length} pares`}
                        getSavedDate={(item) => item.createdAt}
                        getHistoryTitle={(item) => item.topic}
                        getHistorySubtitle={(item) => `Tempo: ${item.timeTaken}s`}
                        getHistoryDate={(item) => item.date}
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
            <ExerciseCompletion
                score={matches}
                total={gameItems.terms.length}
                onPlayAgain={() => {
                    setGameState('setup');
                    setShowSetup(true);
                    setResultSaved(false);
                }}
                onSave={pendingAction === 'ai' ? () => {
                    const originalCards: FlashcardData[] = [];
                    gameItems.terms.forEach(t => {
                        const def = gameItems.definitions.find(d => d.originalPairId === t.originalPairId);
                        if (def) {
                            originalCards.push({ term: t.text, definition: def.text });
                        }
                    });
                    handleSaveGame(originalCards);
                    setResultSaved(true);
                } : undefined}
                onExit={() => {
                    setGameState('setup');
                    setTopic('');
                    setCurrentView('setup');
                    setResultSaved(false);
                }}
                isSaved={resultSaved}
            />
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
                    {gameItems.terms
                        .filter(item => visiblePairIds.includes(item.originalPairId))
                        .filter(item => !item.matched)
                        .map(item => (
                        <div
                            key={item.id}
                            draggable={!item.matched}
                            onDragStart={() => handleDragStart(item)}
                            className="p-4 rounded-xl shadow-sm border-2 transition-all cursor-grab active:cursor-grabbing text-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md animate-fade-in"
                        >
                            <span className="font-medium text-gray-800 dark:text-gray-200">{item.text}</span>
                        </div>
                    ))}
                </div>

                {/* Definitions Column */}
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                     {gameItems.definitions
                        .filter(item => visiblePairIds.includes(item.originalPairId))
                        .filter(item => !item.matched)
                        .map(item => (
                        <div
                            key={item.id}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(item)}
                            className="p-4 rounded-xl shadow-sm border-2 transition-all text-sm flex items-center min-h-[60px] bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-900 dark:text-blue-100 border-dashed animate-fade-in"
                        >
                            {item.text}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
