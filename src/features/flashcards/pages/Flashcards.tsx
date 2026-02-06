import React, { useState, useEffect, useRef } from 'react';
import { usePersistence } from '../../../hooks/usePersistence';
import { Card } from '../components/Card';
import { ExerciseLists } from '../../../components/layout/ExerciseLists';
import { generateFlashcards, FlashcardData } from '../../../services/ai';
import { parseSpreadsheet, getAcceptString, isValidSpreadsheetFile } from '../../../utils/spreadsheetParser';
import { ExerciseSetup } from '../../../components/exercises/ExerciseSetup';
import { ExerciseCompletion } from '../../../components/exercises/ExerciseCompletion';
import { ExerciseBackButton } from '../../../components/exercises/ExerciseBackButton';
import { HistoryReportModal } from '../../../components/exercises/HistoryReportModal';
import { 
  Plus, Brain, Loader2, Folder, MoreVertical, 
  Volume2, X, ChevronLeft, ChevronRight, CheckSquare, 
  Square, Eye, Pencil, Trash2, ArrowLeft, FileSpreadsheet, Upload, 
  Sparkles, Timer
} from 'lucide-react';

interface FlashcardSet {
  id: string;
  title: string;
  cards: FlashcardData[];
  createdAt: string;
}

interface HistoryItem {
  id: string;
  setId: string;
  title: string;
  date: string;
  score?: number;
  total?: number;
}

export function Flashcards() {
  // Global State
  const [sets, setSets] = usePersistence<FlashcardSet[]>('flashcardSets', []);
  const [history, setHistory] = usePersistence<HistoryItem[]>('flashcardHistory', []);
  const [currentView, setCurrentView] = useState<'sets' | 'generator' | 'study' | 'manual'>('sets');
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [showStudySetup, setShowStudySetup] = useState(false);
  const [pendingStudySetId, setPendingStudySetId] = useState<string | null>(null);

  // Generator State
  const [genTopic, setGenTopic] = useState('');
  const [generatedCards, setGeneratedCards] = useState<FlashcardData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Modals & Edit State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSetActionsModal, setShowSetActionsModal] = useState<string | null>(null);
  
  // Edit Set State
  const [editingSet, setEditingSet] = useState<FlashcardSet | null>(null);
  const [viewingReport, setViewingReport] = useState<HistoryItem | null>(null);

  // Save Modal State
  const [saveSetName, setSaveSetName] = useState('');
  const [selectedCardsIndices, setSelectedCardsIndices] = useState<number[]>([]);

  // View Modal State
  const [viewCardIndex, setViewCardIndex] = useState(0);

  // Study Mode State
  const [isStudyCardFlipped, setIsStudyCardFlipped] = useState(false);
  const [swipeAnimation, setSwipeAnimation] = useState<'left' | 'right' | null>(null);
  const touchStartX = useRef<number | null>(null);
  const mouseStartX = useRef<number | null>(null);
  const [studyScore, setStudyScore] = useState(0);

  // Manual Creation State
  const [manualSetName, setManualSetName] = useState('');
  const [manualCards, setManualCards] = useState<FlashcardData[]>([{ term: '', definition: '' }]);

  // Spreadsheet Import State
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Timer state
  const [studyElapsedTime, setStudyElapsedTime] = useState(0);
  const studyTimerRef = useRef<number | null>(null);

  // Timer effect for study mode
  useEffect(() => {
      if (currentView === 'study' && activeSetId) {
          const activeSet = sets.find(s => s.id === activeSetId);
          if (activeSet && viewCardIndex < activeSet.cards.length) {
              studyTimerRef.current = window.setInterval(() => {
                  setStudyElapsedTime(prev => prev + 1);
              }, 1000);
          } else {
              if (studyTimerRef.current) clearInterval(studyTimerRef.current);
          }
      } else {
          if (studyTimerRef.current) clearInterval(studyTimerRef.current);
      }
      return () => {
          if (studyTimerRef.current) clearInterval(studyTimerRef.current);
      };
  }, [currentView, activeSetId, viewCardIndex, sets]);

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handlers
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
      
      if (result.success && result.data.length > 0) {
        // Pre-fill the manual creation form with imported data
        setManualSetName(file.name.replace(/\.[^/.]+$/, '')); // Remove extension
        setManualCards(result.data.map(row => ({ term: row.term, definition: row.definition })));
        setCurrentView('manual');
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

  const handleGenerate = async () => {
    if (!genTopic.trim()) return;
    setIsGenerating(true);
    try {
      const cards = await generateFlashcards(genTopic, 6);
      setGeneratedCards(cards);
      setSaveSetName(`Cartões: ${genTopic}`);
      setSelectedCardsIndices(cards.map((_, i) => i)); 
      setHasUnsavedChanges(true);
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar cartões. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveSet = () => {
    if (!saveSetName.trim()) return;
    const cardsToSave = generatedCards.filter((_, i) => selectedCardsIndices.includes(i));
    
    const newSet: FlashcardSet = {
      id: crypto.randomUUID(),
      title: saveSetName,
      cards: cardsToSave,
      createdAt: new Date().toISOString()
    };

    setSets([...sets, newSet]);
    setShowSaveModal(false);
    setHasUnsavedChanges(false);
    setGeneratedCards([]);
    setGenTopic('');
    setCurrentView('sets');
  };

  const handleSaveManualSet = () => {
    if (!manualSetName.trim()) return;
    const validCards = manualCards.filter(c => c.term.trim() && c.definition.trim());
    if (validCards.length === 0) return;

    const newSet: FlashcardSet = {
      id: crypto.randomUUID(),
      title: manualSetName,
      cards: validCards,
      createdAt: new Date().toISOString()
    };

    setSets([...sets, newSet]);
    setManualSetName('');
    setManualCards([{ term: '', definition: '' }]);
    setCurrentView('sets');
  };

  const addToHistory = (set: FlashcardSet, finalScore: number) => {
    const historyItem: HistoryItem = {
        id: crypto.randomUUID(),
        setId: set.id,
        title: set.title,
        date: new Date().toISOString(),
        score: finalScore,
        total: set.cards.length
    };
    setHistory(prev => [historyItem, ...prev]);
  };

  const handleUpdateSet = () => {
      if (!editingSet || !editingSet.title.trim()) return;
      setSets(sets.map(s => s.id === editingSet.id ? editingSet : s));
      setEditingSet(null);
  };

  const handleSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStudyNextCard = (direction: 'left' | 'right') => {
      setSwipeAnimation(direction === 'right' ? 'slide-out-right' : 'slide-out-left');
      
      const isCorrect = direction === 'right';
      const newScore = isCorrect ? studyScore + 1 : studyScore;
      setStudyScore(newScore);

      setTimeout(() => {
          setSwipeAnimation(null);
          setIsStudyCardFlipped(false);
          
          const currentSet = sets.find(s => s.id === activeSetId);
          if (currentSet && viewCardIndex < currentSet.cards.length) {
             if (viewCardIndex === currentSet.cards.length - 1) {
                 addToHistory(currentSet, newScore);
             }
             setViewCardIndex(prev => prev + 1);
          }
      }, 300); 
  };
             

  useEffect(() => {
      if (currentView !== 'study') return;

      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.code === 'Space') {
            e.preventDefault(); 
            setIsStudyCardFlipped(prev => !prev);
          } else if (e.code === 'ArrowRight') {
               const currentSet = sets.find(s => s.id === activeSetId);
               if (currentSet && viewCardIndex < currentSet.cards.length)
                    handleStudyNextCard('right');
          } else if (e.code === 'ArrowLeft') {
               const currentSet = sets.find(s => s.id === activeSetId);
               if (currentSet && viewCardIndex < currentSet.cards.length)
                    handleStudyNextCard('left');
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, activeSetId, viewCardIndex, sets]);

  // --- Render Functions ---

  const renderSetsView = () => (
    <div className="w-full max-w-6xl mx-auto p-6">
      
      {/* Create Buttons */}
      <h2 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">Cartões</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Escolha como deseja criar seus cartões.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <button 
          onClick={() => setCurrentView('generator')}
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
      
      <ExerciseLists
        savedItems={sets}
        historyItems={history}
        savedTabLabel="Lista de Cartões"
        historyTabLabel="Histórico"
        onPlaySaved={(set) => { 
            setPendingStudySetId(set.id);
            setShowStudySetup(true);
        }}
        onEditSaved={(set) => setEditingSet(set)}
        onDeleteSaved={(id) => setSets(sets.filter(s => s.id !== id))}
        onDeleteHistory={(id) => setHistory(history.filter(h => h.id !== id))}
        onClickHistory={(item) => setViewingReport(item)}
        getSavedTitle={(set) => set.title}
        getSavedSubtitle={(set) => `${set.cards.length} cartões`}
        getSavedDate={(set) => set.createdAt}
        getHistoryTitle={(item) => item.title}
        getHistorySubtitle={(item) => item.score !== undefined && item.total ? `Pontuação: ${item.score}/${item.total}` : ''}
        getHistoryDate={(item) => item.date}
      />

      <HistoryReportModal
        isOpen={!!viewingReport}
        onClose={() => setViewingReport(null)}
        title={viewingReport?.title || ''}
        date={viewingReport?.date || ''}
        score={viewingReport?.score}
        total={viewingReport?.total}
      />
    </div>
  );

  const renderGeneratorView = () => (
    <div className="w-full max-w-4xl mx-auto p-6 flex flex-col h-full">
        {/* Header / Back */}
        <div className="mb-6">
            <button 
                onClick={() => {
                    if (hasUnsavedChanges) setShowExitModal(true);
                    else setCurrentView('sets');
                }}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:hover:text-white transition"
            >
                <ArrowLeft size={20} /> Voltar
            </button>
        </div>

        <div className="flex-1 flex flex-col items-center w-full">
            <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white text-center">Gerador de Flashcards</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">Insira um tópico ou uma lista de termos e definições para gerar flashcards.</p>

            <div className="w-full bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 mb-8 max-w-2xl">
                <textarea 
                    value={genTopic}
                    onChange={(e) => setGenTopic(e.target.value)}
                    placeholder="Ex: Roma Antiga"
                    className="w-full p-4 min-h-[120px] bg-transparent outline-none text-gray-800 dark:text-white resize-none"
                    disabled={isGenerating}
                />
                <div className="flex justify-end p-2 border-t border-gray-100 dark:border-slate-700">
                    <button 
                        onClick={handleGenerate}
                        disabled={!genTopic || isGenerating}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
                    >
                        {isGenerating && <Loader2 className="animate-spin" size={18} />}
                        {generatedCards.length > 0 ? 'Gerar' : 'Gerar'}
                    </button>
                </div>
            </div>

            {generatedCards.length > 0 && (
                <div className="w-full animate-fade-in">
                    <div className="flex justify-center gap-4 mb-8">
                        <button 
                            onClick={() => { setViewCardIndex(0); setShowViewModal(true); }}
                            className="px-6 py-2 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition font-medium"
                        >
                            Exibir
                        </button>
                        <button 
                            onClick={() => setShowSaveModal(true)}
                            className="px-6 py-2 border border-blue-600 bg-white dark:bg-slate-800 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition font-medium"
                        >
                            Salvar Cartões
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
                        {generatedCards.map((card, idx) => (
                            <div key={idx} className="bg-blue-50 dark:bg-slate-800/50 p-6 rounded-xl border border-blue-100 dark:border-slate-700 flex items-center justify-between group hover:border-blue-300 dark:hover:border-slate-600 transition">
                                <span className="font-medium text-gray-800 dark:text-white line-clamp-2">{card.term}</span>
                                <button 
                                    onClick={() => handleSpeech(card.term)}
                                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                                >
                                    <Volume2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
  );

  // --- Modals ---

  const renderSaveModal = () => {
    if (!showSaveModal) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Salvar Flashcards</h2>
                    <button onClick={() => setShowSaveModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <p className="text-sm text-gray-500 mb-4 text-center">Dê um nome à sua pasta e selecione os cartões que deseja salvar.</p>
                    
                    <input 
                        type="text" 
                        value={saveSetName}
                        onChange={(e) => setSaveSetName(e.target.value)}
                        className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 dark:text-white mb-6 focus:ring-2 focus:ring-blue-500 outline-none"
                    />

                    <div className="space-y-3">
                        {generatedCards.map((card, idx) => {
                            const isSelected = selectedCardsIndices.includes(idx);
                            return (
                                <div key={idx} 
                                     className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition select-none"
                                     onClick={() => {
                                         if (isSelected) setSelectedCardsIndices(prev => prev.filter(i => i !== idx));
                                         else setSelectedCardsIndices(prev => [...prev, idx]);
                                     }}
                                >
                                    <div className={`mt-1 ${isSelected ? 'text-blue-600' : 'text-gray-300'}`}>
                                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-800 dark:text-white text-sm">{card.term}</h4>
                                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 line-clamp-2">{card.definition}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-6 pt-0">
                    <button 
                        onClick={handleSaveSet}
                        disabled={!saveSetName || selectedCardsIndices.length === 0}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
  };

  const renderEditSetModal = () => {
      if (!editingSet) return null;

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Editar Conjunto de Cartões</h2>
                    <button onClick={() => setEditingSet(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto bg-gray-50 dark:bg-slate-900/50 flex-1">
                    <input 
                        type="text" 
                        value={editingSet.title}
                        onChange={(e) => setEditingSet({...editingSet, title: e.target.value})}
                        className="w-full p-4 mb-6 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Nome do Conjunto"
                    />

                    <div className="space-y-4">
                        {editingSet.cards.map((card, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 relative group">
                                <button 
                                    onClick={() => {
                                        const newCards = editingSet.cards.filter((_, i) => i !== idx);
                                        setEditingSet({...editingSet, cards: newCards});
                                    }}
                                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                >
                                    <X size={16} />
                                </button>
                                <div className="space-y-3 pr-6">
                                    <input 
                                        className="w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-lg text-sm text-gray-800 dark:text-white outline-none focus:border-blue-500"
                                        value={card.term}
                                        onChange={(e) => {
                                            const newCards = [...editingSet.cards];
                                            newCards[idx] = { ...card, term: e.target.value };
                                            setEditingSet({...editingSet, cards: newCards});
                                        }}
                                        placeholder="Termo"
                                    />
                                    <textarea 
                                        className="w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 outline-none focus:border-blue-500 resize-none min-h-[60px]"
                                        value={card.definition}
                                        onChange={(e) => {
                                            const newCards = [...editingSet.cards];
                                            newCards[idx] = { ...card, definition: e.target.value };
                                            setEditingSet({...editingSet, cards: newCards});
                                        }}
                                        placeholder="Definição"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex justify-between gap-4">
                    <button 
                        onClick={() => setEditingSet({...editingSet, cards: [...editingSet.cards, { term: '', definition: '' }]})}
                        className="px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                    >
                        Adicionar Novo Cartão
                    </button>
                    <button 
                        onClick={handleUpdateSet}
                        className="flex-1 max-w-xs py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                        Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
      );
  };

  const renderViewModal = () => {
    if (!showViewModal || generatedCards.length === 0) return null;
    const card = generatedCards[viewCardIndex];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Visualizador de Cartões</h2>
                    <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-12 flex flex-col items-center justify-center min-h-[300px] bg-gray-50 dark:bg-slate-900/50">
                    <Card term={card.term} definition={card.definition} />
                    <span className="mt-4 text-sm text-gray-500 dark:text-gray-400 font-medium">{viewCardIndex + 1} / {generatedCards.length}</span>
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-slate-700 flex justify-between">
                     <button 
                        onClick={() => setViewCardIndex(prev => Math.max(0, prev - 1))}
                        disabled={viewCardIndex === 0}
                        className="flex items-center gap-2 px-4 py-2 text-blue-600 font-medium disabled:opacity-50 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                     >
                        <ChevronLeft size={20} /> Voltar
                     </button>
                     <button 
                        onClick={() => setViewCardIndex(prev => Math.min(generatedCards.length - 1, prev + 1))}
                        disabled={viewCardIndex === generatedCards.length - 1}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:bg-gray-400"
                     >
                        Próximo <ChevronRight size={20} />
                     </button>
                </div>
            </div>
        </div>
    );
  };

  const renderExitModal = () => {
    if (!showExitModal) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
             <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl p-8 text-center">
                 <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Sair da Página</h3>
                 <p className="text-gray-500 mb-8">Você tem conteúdo não salvo. O que gostaria de fazer?</p>
                 <div className="flex gap-3">
                     <button 
                        onClick={() => {
                            setShowExitModal(false);
                            setHasUnsavedChanges(false);
                            setGeneratedCards([]);
                            setGenTopic('');
                            setCurrentView('sets');
                        }}
                        className="flex-1 py-3 px-4 border border-blue-200 text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition"
                     >
                        Sair e Descartar
                     </button>
                     <button 
                        onClick={() => setShowExitModal(false)}
                        className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
                     >
                        Voltar e Manter
                     </button>
                 </div>
             </div>
        </div>
    );
  };

  const renderSetActionsModal = () => {
      if (!showSetActionsModal) return null;
      const set = sets.find(s => s.id === showSetActionsModal);
      if (!set) return null;

      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]" 
               onClick={() => setShowSetActionsModal(null)}>
              <div 
                  className="bg-white dark:bg-slate-800 w-80 rounded-2xl shadow-xl overflow-hidden animate-fade-in" 
                  onClick={e => e.stopPropagation()}
              >
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                        <h4 className="font-bold text-gray-800 dark:text-white">Ações dos Cartões</h4>
                        <button onClick={() => setShowSetActionsModal(null)} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-2">
                        <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 text-gray-700 dark:text-gray-200 transition"
                            onClick={() => { setPendingStudySetId(set.id); setShowStudySetup(true); setShowSetActionsModal(null); }}>
                            <Eye size={20} className="text-blue-500" /> 
                            <span className="font-medium">Exibir</span>
                        </button>
                        <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 text-gray-700 dark:text-gray-200 transition"
                            onClick={() => {
                                setEditingSet({ ...set }); // Clone set for editing
                                setShowSetActionsModal(null);
                            }}>
                            <Pencil size={20} className="text-orange-500" />
                            <span className="font-medium">Editar</span>
                        </button>
                        <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3 text-red-600 transition"
                            onClick={() => {
                                setSets(sets.filter(s => s.id !== set.id));
                                setShowSetActionsModal(null);
                            }}>
                            <Trash2 size={20} />
                            <span className="font-medium">Excluir</span>
                        </button>
                    </div>
              </div>
          </div>
      );
  };

  // --- Main Render ---

  if (showStudySetup && pendingStudySetId) {
      const pendingSet = sets.find(s => s.id === pendingStudySetId);
      if (pendingSet) {
          return (
              <ExerciseSetup
                  title={`Estudar: ${pendingSet.title}`}
                  description="Revise seus flashcards"
                  configurations={[{
                      label: 'Cartões',
                      value: `${pendingSet.cards.length} cartões`,
                      type: 'readonly' as const
                  }]}
                  onStart={() => {
                      setActiveSetId(pendingStudySetId);
                      setCurrentView('study');
                      setViewCardIndex(0);
                      setStudyScore(0);
                      setStudyElapsedTime(0);
                      setIsStudyCardFlipped(false);
                      setShowStudySetup(false);
                  }}
                  onBack={() => { setShowStudySetup(false); setPendingStudySetId(null); }}
                  startLabel="Começar Estudo"
              />
          );
      }
  }

  if (currentView === 'generator') {
      return (
          <>
            {renderGeneratorView()}
            {renderSaveModal()}
            {renderViewModal()}
            {renderExitModal()}
          </>
      );
  }

  if (currentView === 'study' && activeSetId) {
      const activeSet = sets.find(s => s.id === activeSetId);
      if (activeSet) {
          return (
              <div className="w-full h-full flex flex-col items-center p-6">
                   <div className="w-full max-w-6xl mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <ExerciseBackButton
                                onConfirm={() => {
                                    setCurrentView('sets');
                                    setActiveSetId(null);
                                    setStudyScore(0);
                                    setViewCardIndex(0);
                                    setIsStudyCardFlipped(false);
                                }}
                            />
                            <div className="flex items-center gap-2 font-mono text-lg font-bold text-gray-700 dark:text-gray-300">
                                <Timer size={20} />
                                {formatTime(studyElapsedTime)}
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{activeSet.title}</h1>
                   </div>
                   
                   <div className="flex-1 flex flex-col items-center justify-center w-full pb-20 overflow-hidden">
                        {viewCardIndex >= activeSet.cards.length ? (
                            <ExerciseCompletion
                                score={studyScore}
                                total={activeSet.cards.length}
                                timeTaken={studyElapsedTime}
                                onPlayAgain={() => {
                                    setViewCardIndex(0);
                                    setIsStudyCardFlipped(false);
                                    setStudyScore(0);
                                    setShowStudySetup(true);
                                    setPendingStudySetId(activeSetId);
                                    setCurrentView('sets');
                                }}
                                onExit={() => {
                                    setCurrentView('sets');
                                    setActiveSetId(null);
                                    setStudyScore(0);
                                }}
                            />
                        ) : activeSet.cards.length > 0 ? (
                           <>
                            <div 
                                className={`relative group perspective-1000 w-full max-w-xl ${swipeAnimation ? swipeAnimation : ''}`}
                                onTouchStart={e => touchStartX.current = e.touches[0].clientX}
                                onTouchEnd={e => {
                                    if (touchStartX.current === null) return;
                                    const diff = e.changedTouches[0].clientX - touchStartX.current;
                                    if (Math.abs(diff) > 50) { 
                                         const currentSet = sets.find(s => s.id === activeSetId);
                                         if (currentSet && viewCardIndex < currentSet.cards.length) {
                                              handleStudyNextCard(diff > 0 ? 'right' : 'left');
                                         }
                                    }
                                    touchStartX.current = null;
                                }}
                                onMouseDown={e => mouseStartX.current = e.clientX}
                                onMouseUp={e => {
                                    if (mouseStartX.current === null) return;
                                    const diff = e.clientX - mouseStartX.current;
                                    if (Math.abs(diff) > 50) { 
                                         const currentSet = sets.find(s => s.id === activeSetId);
                                         if (currentSet && viewCardIndex < currentSet.cards.length) {
                                              handleStudyNextCard(diff > 0 ? 'right' : 'left');
                                         }
                                    }
                                    mouseStartX.current = null;
                                }}
                                onMouseLeave={() => mouseStartX.current = null}
                            >
                                <Card 
                                    term={activeSet.cards[viewCardIndex].term} 
                                    definition={activeSet.cards[viewCardIndex].definition} 
                                    isFlipped={isStudyCardFlipped}
                                    onFlip={() => setIsStudyCardFlipped(!isStudyCardFlipped)}
                                />
                            </div>

                            <div className="flex items-center gap-6 mt-8">
                                <button 
                                    onClick={() => {
                                        if (viewCardIndex > 0) {
                                            setViewCardIndex(prev => prev - 1);
                                            setIsStudyCardFlipped(false);
                                        }
                                    }}
                                    disabled={viewCardIndex === 0}
                                    className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 disabled:opacity-30 transition"
                                >
                                    <ChevronLeft size={32} />
                                </button>
                                <span className="text-gray-500 dark:text-gray-400 font-medium">
                                    {viewCardIndex + 1} / {activeSet.cards.length}
                                </span>
                                <button 
                                    onClick={() => {
                                         if (viewCardIndex < activeSet.cards.length - 1) {
                                             setViewCardIndex(prev => prev + 1);
                                             setIsStudyCardFlipped(false);
                                         } else if (viewCardIndex === activeSet.cards.length - 1) {
                                              addToHistory(activeSet, studyScore); // Assumes button click is neutral/skip if logic isn't changed. OR treat as correct? 
                                              // If we want the button to count as correct, we should update studyScore here too.
                                              // Assuming "CheckSquare" (Finish) means done. The user reported scoring issues.
                                              // If user clicks "Next" without swiping, the score doesn't increase. 
                                              // Let's assume Check = Done with current score.
                                              // But wait, the user said "answer always given as if all were correct".
                                              // That was because I was passing set.cards.length.
                                              // Now I'm passing studyScore. If user only clicks "Next", score remains 0.
                                              // That is technically correct if they didn't "swipe right".
                                              // But users might expect "Next" button to just move forward.
                                              // Let's leave it as is: user must swipe or use arrows to score. 
                                              // Or should I add Explicit Correct/Incorrect buttons?
                                              // The user said "dragging left and right is not working". I should focus on fixing drag.
                                              setViewCardIndex(prev => prev + 1); // Finish
                                         }
                                    }}
                                    className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition"
                                >
                                   {viewCardIndex === activeSet.cards.length - 1 ? <CheckSquare size={32} className="text-green-600" /> : <ChevronRight size={32} />}
                                </button>
                            </div>
                            
                            <div className="mt-4 text-sm text-gray-400">
                                <p>Espaço para virar • Setas ou arrastar para avaliar</p>
                            </div>
                           </>
                        ) : (
                            <p className="text-gray-500">Pasta vazia.</p>
                        )}
                   </div>
              </div>
          );
      }
  }

  // Manual Creation View
  if (currentView === 'manual') {
      return (
         <div className="w-full max-w-4xl mx-auto p-6">
             <button 
                onClick={() => setCurrentView('sets')} 
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:hover:text-white mb-6 transition"
             >
                <ArrowLeft size={20} /> Voltar
             </button>

             <div className="flex flex-col h-full">
                 <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white text-center">Criar Manualmente</h1>
                 <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">Crie seus próprios flashcards personalizados.</p>

                 <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 mb-8">
                      <input 
                          type="text" 
                          value={manualSetName}
                          onChange={(e) => setManualSetName(e.target.value)}
                          className="w-full p-4 mb-6 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-green-500 outline-none font-medium text-lg"
                          placeholder="Nome do Conjunto (Ex: Biologia)"
                      />

                      <div className="space-y-4">
                          {manualCards.map((card, idx) => (
                              <div key={idx} className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl border border-gray-100 dark:border-slate-600 relative group animate-fade-in">
                                  <button 
                                      onClick={() => {
                                          if (manualCards.length > 1) {
                                              const newCards = manualCards.filter((_, i) => i !== idx);
                                              setManualCards(newCards);
                                          }
                                      }}
                                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition opacity-0 group-hover:opacity-100"
                                      disabled={manualCards.length === 1}
                                  >
                                      <X size={16} />
                                  </button>
                                  <div className="space-y-3 pr-6">
                                      <input 
                                          className="w-full p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-800 dark:text-white outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                                          value={card.term}
                                          onChange={(e) => {
                                              const newCards = [...manualCards];
                                              newCards[idx] = { ...card, term: e.target.value };
                                              setManualCards(newCards);
                                          }}
                                          placeholder="Termo / Pergunta"
                                      />
                                      <textarea 
                                          className="w-full p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-600 dark:text-gray-300 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none min-h-[80px] transition"
                                          value={card.definition}
                                          onChange={(e) => {
                                              const newCards = [...manualCards];
                                              newCards[idx] = { ...card, definition: e.target.value };
                                              setManualCards(newCards);
                                          }}
                                          placeholder="Definição / Resposta"
                                      />
                                  </div>
                              </div>
                          ))}
                      </div>

                      <div className="mt-6 flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100 dark:border-slate-700">
                          <button 
                              onClick={() => setManualCards([...manualCards, { term: '', definition: '' }])}
                              className="flex items-center justify-center gap-2 px-6 py-3 border border-green-600 text-green-600 dark:text-green-400 rounded-xl font-medium hover:bg-green-50 dark:hover:bg-green-900/20 transition group"
                          >
                              <Plus size={20} className="group-hover:scale-110 transition-transform"/> Adicionar Cartão
                          </button>
                          <button 
                              onClick={handleSaveManualSet}
                              disabled={!manualSetName.trim() || !manualCards.some(c => c.term.trim() && c.definition.trim())}
                              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-green-200 dark:shadow-none"
                          >
                              Salvar Conjunto
                          </button>
                      </div>
                 </div>
             </div>
         </div>
      );
  }

  return (
      <>
        {renderSetsView()}
        {renderSetActionsModal()}
        {renderEditSetModal()}
      </>
  );
}
