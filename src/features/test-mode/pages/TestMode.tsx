import React, { useState, useEffect, useRef } from 'react';
import { generateTestQuestions, TestQuestion } from '../../../services/ai';
import { Play, Settings, RefreshCw, CheckCircle, XCircle, History, Trash2, Save, Edit, X, Plus, AlertCircle, Brain, ArrowLeft, Sparkles, Pencil, Timer } from 'lucide-react';
import { HistoryReportModal, QuestionResult } from '../../../components/exercises/HistoryReportModal';
import { usePersistence } from '../../../hooks/usePersistence';
import { ExerciseLists } from '../../../components/layout/ExerciseLists';
import { ExerciseSetup } from '../../../components/exercises/ExerciseSetup';
import { ExerciseCompletion } from '../../../components/exercises/ExerciseCompletion';
import { ExerciseBackButton } from '../../../components/exercises/ExerciseBackButton';

interface TestHistoryItem {
    id: string;
    date: string;
    topic: string;
    score: number;
    total: number;
    questionResults?: QuestionResult[];
    timeTaken?: number;
}

interface SavedTestQuiz {
    id: string;
    title: string;
    questions: TestQuestion[];
    createdAt: string;
}

export function TestMode() {
    // Config State
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentView, setCurrentView] = useState<'setup' | 'ai' | 'manual'>('setup');
    const [showSetup, setShowSetup] = useState(false);
    const [pendingAction, setPendingAction] = useState<'ai' | 'saved' | null>(null);
    const [selectedSavedQuiz, setSelectedSavedQuiz] = useState<SavedTestQuiz | null>(null);
    const [questionCount, setQuestionCount] = useState(5);
    const [resultSaved, setResultSaved] = useState(false);
    
    // Game State
    const [gameStatus, setGameStatus] = useState<'setup' | 'playing' | 'finished'>('setup');
    const [questions, setQuestions] = useState<TestQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    
    // Manual creation state
    const [manualTitle, setManualTitle] = useState('');
    const [manualQuestions, setManualQuestions] = useState<TestQuestion[]>([
        { id: crypto.randomUUID(), question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '' }
    ]);
    
    // Storage
    const [history, setHistory] = usePersistence<TestHistoryItem[]>('testHistory', []);
    const [savedQuizzes, setSavedQuizzes] = usePersistence<SavedTestQuiz[]>('savedTestQuizzes', []);
    const [editingQuiz, setEditingQuiz] = useState<SavedTestQuiz | null>(null);
    const [answeredResults, setAnsweredResults] = useState<QuestionResult[]>([]);
    const [viewingReport, setViewingReport] = useState<TestHistoryItem | null>(null);

    // Timer state
    const [elapsedTime, setElapsedTime] = useState(0);
    const timerRef = useRef<number | null>(null);

    // Timer effect
    useEffect(() => {
        if (gameStatus === 'playing') {
            timerRef.current = window.setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameStatus]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartGame = async () => {
        if (!topic.trim()) return;
        setIsLoading(true);
        try {
            const generatedQuestions = await generateTestQuestions(topic);
            if (generatedQuestions.length > 0) {
                setQuestions(generatedQuestions);
                setGameStatus('playing');
                setCurrentQuestionIndex(0);
                setScore(0);
                setElapsedTime(0);
                setAnsweredResults([]);
                resetQuestionState();
            } else {
                alert('Não foi possível gerar questões. Tente outro tópico.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao gerar teste.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetQuestionState = () => {
        setSelectedOption(null);
        setIsAnswered(false);
    };

    const handleOptionSelect = (option: string) => {
        if (isAnswered) return;
        setSelectedOption(option);
    };

    const handleConfirmAnswer = () => {
        if (!selectedOption || isAnswered) return;
        
        setIsAnswered(true);
        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = selectedOption === currentQuestion.correctAnswer;
        if (isCorrect) {
            setScore(score + 1);
        }

        setAnsweredResults(prev => [...prev, {
            question: currentQuestion.question,
            userAnswer: selectedOption,
            correctAnswer: currentQuestion.correctAnswer,
            isCorrect
        }]);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            resetQuestionState();
        } else {
            finishGame();
        }
    };

    const finishGame = () => {
        setGameStatus('finished');
        
        const historyItem: TestHistoryItem = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            topic: topic,
            score: score + (isAnswered && selectedOption === questions[currentQuestionIndex].correctAnswer ? 1 : 0),
            total: questions.length,
            questionResults: [...answeredResults],
            timeTaken: elapsedTime
        };
        // Verify if confirm was called for last question
        // If finishGame called from handleNextQuestion, confirm was already done.
        
        setHistory([historyItem, ...history]);
    };

    const handleSaveQuiz = () => {
        const title = prompt("Digite um nome para este teste:", topic);
        if (!title) return;
        
        const newQuiz: SavedTestQuiz = {
            id: crypto.randomUUID(),
            title,
            questions,
            createdAt: new Date().toISOString()
        };
        setSavedQuizzes([newQuiz, ...savedQuizzes]);
        alert('Teste salvo com sucesso!');
    };

    const handlePlaySavedQuiz = (quiz: SavedTestQuiz) => {
        setSelectedSavedQuiz(quiz);
        setTopic(quiz.title);
        setPendingAction('saved');
        setShowSetup(true);
    };

    const handleEditSavedQuiz = (quiz: SavedTestQuiz) => {
        setEditingQuiz(quiz);
    };

    const saveEditedQuiz = () => {
        if (!editingQuiz || !editingQuiz.title.trim()) return;
        setSavedQuizzes(savedQuizzes.map(q => q.id === editingQuiz.id ? editingQuiz : q));
        setEditingQuiz(null);
    };

    const handleDeleteSavedQuiz = (id: string) => {
        setSavedQuizzes(savedQuizzes.filter(q => q.id !== id));
    };

    const handleDeleteHistoryItem = (id: string) => {
        setHistory(history.filter(h => h.id !== id));
    };

    const handleSaveManualQuiz = () => {
        if (!manualTitle.trim()) return;
        const validQuestions = manualQuestions.filter(q => 
            q.question.trim() && 
            q.correctAnswer.trim() && 
            q.options.filter(o => o.trim()).length >= 2
        );
        if (validQuestions.length === 0) return;

        const newQuiz: SavedTestQuiz = {
            id: crypto.randomUUID(),
            title: manualTitle,
            questions: validQuestions.map(q => ({
                ...q,
                id: crypto.randomUUID(),
                options: q.options.filter(o => o.trim())
            })),
            createdAt: new Date().toISOString()
        };

        setSavedQuizzes([...savedQuizzes, newQuiz]);
        setManualTitle('');
        setManualQuestions([
            { id: crypto.randomUUID(), question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '' }
        ]);
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
                <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">Use o formulário abaixo para enviar um tópico e receber questões de teste geradas pela IA.</p>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 mb-8">
                    <label className="block text-sm font-medium mb-4 text-left text-gray-700 dark:text-gray-300">Tópico do Teste</label>
                    <textarea 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full p-4 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24 mb-4"
                        placeholder="Ex: Biologia Celular, História do Brasil..."
                    />

                    <button 
                        onClick={() => {
                            if (!topic.trim()) return;
                            setPendingAction('ai');
                            setShowSetup(true);
                        }}
                        disabled={!topic || isLoading}
                        className="w-full py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading && <RefreshCw className="animate-spin" size={20} />}
                        <Sparkles size={20} />
                        {isLoading ? 'Gerando...' : 'Gerar Teste'}
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
                <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white text-center">Criar Teste Manualmente</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">Crie questões de múltipla escolha personalizadas.</p>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 mb-8">
                    <input 
                        type="text" 
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        className="w-full p-4 mb-6 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-lg"
                        placeholder="Título do Teste (Ex: Biologia Celular)"
                    />

                    <div className="space-y-6">
                        {manualQuestions.map((q, idx) => (
                            <div key={q.id} className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl border border-gray-100 dark:border-slate-600 relative group animate-fade-in">
                                <button 
                                    onClick={() => {
                                        if (manualQuestions.length > 1) {
                                            setManualQuestions(manualQuestions.filter((_, i) => i !== idx));
                                        }
                                    }}
                                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition opacity-0 group-hover:opacity-100"
                                    disabled={manualQuestions.length === 1}
                                >
                                    <X size={16} />
                                </button>
                                
                                <div className="space-y-4 pr-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold uppercase text-gray-500">Questão {idx + 1}</span>
                                    </div>
                                    
                                    <textarea 
                                        className="w-full p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-800 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none min-h-[60px]"
                                        value={q.question}
                                        onChange={(e) => {
                                            const newQuestions = [...manualQuestions];
                                            newQuestions[idx] = { ...q, question: e.target.value };
                                            setManualQuestions(newQuestions);
                                        }}
                                        placeholder="Digite a pergunta"
                                    />
                                    
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-2">Opções (marque a correta)</label>
                                        <div className="space-y-2">
                                            {q.options.map((opt, optIdx) => (
                                                <div key={optIdx} className="flex items-center gap-2">
                                                    <input 
                                                        type="radio"
                                                        name={`correct-manual-${idx}`}
                                                        checked={q.correctAnswer === opt && opt !== ''}
                                                        onChange={() => {
                                                            const newQuestions = [...manualQuestions];
                                                            newQuestions[idx] = { ...q, correctAnswer: opt };
                                                            setManualQuestions(newQuestions);
                                                        }}
                                                        className="w-4 h-4 text-blue-600"
                                                    />
                                                    <input 
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const newQuestions = [...manualQuestions];
                                                            const wasCorrect = newQuestions[idx].correctAnswer === newQuestions[idx].options[optIdx];
                                                            newQuestions[idx].options[optIdx] = e.target.value;
                                                            if (wasCorrect) {
                                                                newQuestions[idx].correctAnswer = e.target.value;
                                                            }
                                                            setManualQuestions(newQuestions);
                                                        }}
                                                        className="flex-1 p-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg dark:text-white outline-none focus:border-blue-500"
                                                        placeholder={`Opção ${optIdx + 1}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <textarea 
                                        className="w-full p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-600 dark:text-gray-300 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none min-h-[50px] transition"
                                        value={q.explanation || ''}
                                        onChange={(e) => {
                                            const newQuestions = [...manualQuestions];
                                            newQuestions[idx] = { ...q, explanation: e.target.value };
                                            setManualQuestions(newQuestions);
                                        }}
                                        placeholder="Explicação da resposta correta (opcional)"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100 dark:border-slate-700">
                        <button 
                            onClick={() => setManualQuestions([...manualQuestions, 
                                { id: crypto.randomUUID(), question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '' }
                            ])}
                            className="flex items-center justify-center gap-2 px-6 py-3 border border-blue-600 text-blue-600 dark:text-blue-400 rounded-xl font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group"
                        >
                            <Plus size={20} className="group-hover:scale-110 transition-transform"/> Adicionar Questão
                        </button>
                        <button 
                            onClick={handleSaveManualQuiz}
                            disabled={!manualTitle.trim() || !manualQuestions.some(q => q.question.trim() && q.correctAnswer.trim() && q.options.filter(o => o.trim()).length >= 2)}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-200 dark:shadow-none"
                        >
                            Salvar Teste
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderEditQuizModal = () => {
        if (!editingQuiz) return null;

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 text-left">
                <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Edit size={20} className="text-blue-500" />
                            Editar Teste
                        </h3>
                        <button 
                            onClick={() => setEditingQuiz(null)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"
                        >
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Título do Teste
                            </label>
                            <input 
                                type="text"
                                value={editingQuiz.title}
                                onChange={(e) => setEditingQuiz({...editingQuiz, title: e.target.value})}
                                className="w-full p-3 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="space-y-6">
                            {editingQuiz.questions.map((q, idx) => (
                                <div key={idx} className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl relative group border border-gray-100 dark:border-slate-700">
                                     <button 
                                        onClick={() => {
                                            const newQuestions = editingQuiz.questions.filter((_, i) => i !== idx);
                                            setEditingQuiz({...editingQuiz, questions: newQuestions});
                                        }}
                                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <X size={16} />
                                    </button>
                                    
                                    <div className="space-y-4">
                                        <span className="text-xs font-bold uppercase text-gray-500">Questão {idx + 1}</span>
                                        
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Enunciado</label>
                                            <textarea 
                                                className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500 resize-y min-h-[60px]"
                                                value={q.question}
                                                onChange={(e) => {
                                                    const newQuestions = [...editingQuiz.questions];
                                                    newQuestions[idx] = { ...q, question: e.target.value };
                                                    setEditingQuiz({...editingQuiz, questions: newQuestions});
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs text-gray-500 mb-2">Opções (Selecione a correta)</label>
                                            <div className="space-y-2">
                                                {q.options.map((opt, optIdx) => (
                                                    <div key={optIdx} className="flex items-center gap-2">
                                                        <input 
                                                            type="radio"
                                                            name={`correct-${idx}`}
                                                            checked={q.correctAnswer === opt && opt !== ''} 
                                                            // Logic flaw: if options text is duplicate, this fails. But usually ok.
                                                            // Better: compare index? No, correctAnswer stores the string.
                                                            // Ideally we update correctAnswer when radio changes.
                                                            onChange={() => {
                                                                const newQuestions = [...editingQuiz.questions];
                                                                newQuestions[idx] = { ...q, correctAnswer: opt };
                                                                setEditingQuiz({...editingQuiz, questions: newQuestions});
                                                            }}
                                                            className="w-4 h-4 text-blue-600"
                                                        />
                                                        <input 
                                                            type="text"
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const newQuestions = [...editingQuiz.questions];
                                                                // If this option was the correct answer, update correctAnswer too
                                                                const wasCorrect = newQuestions[idx].correctAnswer === newQuestions[idx].options[optIdx];
                                                                newQuestions[idx].options[optIdx] = e.target.value;
                                                                if (wasCorrect) {
                                                                    newQuestions[idx].correctAnswer = e.target.value;
                                                                }
                                                                setEditingQuiz({...editingQuiz, questions: newQuestions});
                                                            }}
                                                            className="flex-1 p-2 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg"
                                                            placeholder={`Opção ${optIdx + 1}`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Explicação</label>
                                            <textarea 
                                                className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500 resize-y min-h-[40px]"
                                                value={q.explanation || ''}
                                                onChange={(e) => {
                                                    const newQuestions = [...editingQuiz.questions];
                                                    newQuestions[idx] = { ...q, explanation: e.target.value };
                                                    setEditingQuiz({...editingQuiz, questions: newQuestions});
                                                }}
                                                placeholder="Explicação da resposta correta (opcional)"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex justify-between gap-4">
                        <button 
                            onClick={() => setEditingQuiz({...editingQuiz, questions: [...editingQuiz.questions, { id: crypto.randomUUID(), question: '', options: ['','','',''], correctAnswer: '', explanation: '' }]})}
                            className="px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                        >
                            <Plus size={18} className="inline mr-1" /> Nova Questão
                        </button>
                        <button 
                            onClick={saveEditedQuiz}
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
        if (pendingAction === 'saved' && selectedSavedQuiz) {
            setQuestions(selectedSavedQuiz.questions);
            setGameStatus('playing');
            setCurrentQuestionIndex(0);
            setScore(0);
            setElapsedTime(0);
            setAnsweredResults([]);
            resetQuestionState();
            setShowSetup(false);
            setResultSaved(false);
            return;
        }
        if (pendingAction === 'ai') {
            setShowSetup(false);
            setResultSaved(false);
            await handleStartGame();
        }
    };

    if (showSetup) {
        const configurations: any[] = [];
        if (pendingAction === 'ai') {
            configurations.push({
                label: 'Número de Questões',
                value: questionCount,
                type: 'select',
                options: [
                    { label: '3 Questões', value: 3 },
                    { label: '5 Questões', value: 5 },
                    { label: '10 Questões', value: 10 },
                ],
                onChange: (val: any) => setQuestionCount(Number(val))
            });
        } else if (pendingAction === 'saved' && selectedSavedQuiz) {
            configurations.push({
                label: 'Questões',
                value: `${selectedSavedQuiz.questions.length} questões`,
                type: 'readonly'
            });
        }

        return (
            <ExerciseSetup
                title={pendingAction === 'ai' ? `Teste: ${topic}` : `Teste: ${topic}`}
                description={pendingAction === 'ai' ? "Configure seu teste gerado por IA" : "Pronto para começar?"}
                configurations={configurations}
                onStart={confirmStartGame}
                onBack={() => setShowSetup(false)}
                startLabel={isLoading ? "Gerando..." : "Começar"}
            />
        );
    }

    if (gameStatus === 'finished') {
        return (
            <ExerciseCompletion
                score={score}
                total={questions.length}
                timeTaken={elapsedTime}
                onPlayAgain={() => {
                    setGameStatus('setup');
                    setShowSetup(true);
                    setResultSaved(false);
                }}
                onSave={pendingAction === 'ai' ? () => {
                    handleSaveQuiz();
                    setResultSaved(true);
                } : undefined}
                onExit={() => {
                    setGameStatus('setup');
                    setTopic('');
                    setQuestions([]);
                    setCurrentView('setup');
                    setResultSaved(false);
                }}
                isSaved={resultSaved}
            />
        );
    }

    if (gameStatus === 'playing') {
        const question = questions[currentQuestionIndex];
        return (
            <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto py-10">
                <div className="flex justify-between items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    <ExerciseBackButton
                        onConfirm={() => {
                            setGameStatus('setup');
                            setCurrentQuestionIndex(0);
                            setScore(0);
                            resetQuestionState();
                            setQuestions([]);
                        }}
                    />
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 font-mono text-base font-bold text-gray-700 dark:text-gray-300">
                            <Timer size={18} />
                            {formatTime(elapsedTime)}
                        </div>
                        <span>{currentQuestionIndex + 1} / {questions.length}</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 min-h-[160px] flex flex-col justify-center">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white leading-relaxed text-center">
                        {question.question}
                    </h2>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                    {question.options.map((option, idx) => {
                        let buttonStyle = "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300";
                        if (selectedOption === option) {
                            buttonStyle = "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500";
                        }
                        if (isAnswered) {
                            if (option === question.correctAnswer) {
                                buttonStyle = "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300";
                            } else if (selectedOption === option && option !== question.correctAnswer) {
                                buttonStyle = "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";
                            } else {
                                buttonStyle = "opacity-50 border-gray-200 dark:border-slate-700";
                            }
                        }

                        return (
                             <button
                                key={idx}
                                onClick={() => handleOptionSelect(option)}
                                disabled={isAnswered}
                                className={`p-4 rounded-xl text-left border transition-all ${buttonStyle}`}
                             >
                                 <div className="flex justify-between items-center">
                                     <span>{option}</span>
                                     {isAnswered && option === question.correctAnswer && <CheckCircle size={18} className="text-green-500" />}
                                     {isAnswered && selectedOption === option && option !== question.correctAnswer && <XCircle size={18} className="text-red-500" />}
                                 </div>
                             </button>
                        );
                    })}
                </div>

                {isAnswered && question.explanation && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl text-blue-800 dark:text-blue-200 text-sm animate-in fade-in">
                        <div className="flex items-center gap-2 font-bold mb-1">
                            <AlertCircle size={16} /> Explicação
                        </div>
                        {question.explanation}
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    {!isAnswered ? (
                        <button 
                             onClick={handleConfirmAnswer}
                             disabled={!selectedOption}
                             className="px-8 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 shadow-lg shadow-blue-500/20"
                        >
                            Confirmar
                        </button>
                    ) : (
                        <button 
                             onClick={handleNextQuestion}
                             className="px-8 py-3 bg-gray-800 dark:bg-slate-700 text-white rounded-xl font-medium hover:bg-gray-900 dark:hover:bg-slate-600 transition shadow-lg"
                        >
                            {currentQuestionIndex < questions.length - 1 ? 'Próxima Questão' : 'Ver Resultados'}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // SETUP VIEW
    if (currentView === 'ai') {
        return renderAIView();
    }

    if (currentView === 'manual') {
        return renderManualCreationView();
    }

    return (
        <div className="w-full max-w-6xl mx-auto p-6">
            <h2 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">Modo Teste</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Escolha como deseja criar seus testes.</p>
            
            {/* Create Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <button 
                    onClick={() => setCurrentView('ai')}
                    className="p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col items-start text-left gap-4 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all group"
                >
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl group-hover:scale-110 transition-transform">
                        <Sparkles size={28} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-1">Gerar com IA</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Use o formulário para enviar um tópico e receber questões de teste geradas pela IA.</p>
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
                        <p className="text-sm text-gray-500 dark:text-gray-400">Crie seus próprios testes de múltipla escolha manualmente.</p>
                    </div>
                </button>
            </div>

             <div className="w-full">
                <ExerciseLists<SavedTestQuiz, TestHistoryItem>
                    savedItems={savedQuizzes}
                    historyItems={history}
                    onPlaySaved={handlePlaySavedQuiz}
                    onEditSaved={handleEditSavedQuiz}
                    onDeleteSaved={handleDeleteSavedQuiz}
                    onDeleteHistory={handleDeleteHistoryItem}
                    onClickHistory={(item) => setViewingReport(item)}
                    getSavedTitle={(item) => item.title}
                    getSavedSubtitle={(item) => `${item.questions.length} questões`}
                    getSavedDate={(item) => item.createdAt}
                    getHistoryTitle={(item) => item.topic}
                    getHistorySubtitle={(item) => `Pontuação: ${item.score}/${item.total}`}
                    getHistoryDate={(item) => item.date}
                />
             </div>
             
             {renderEditQuizModal()}

             <HistoryReportModal
                isOpen={!!viewingReport}
                onClose={() => setViewingReport(null)}
                title={viewingReport?.topic || ''}
                date={viewingReport?.date || ''}
                score={viewingReport?.score}
                total={viewingReport?.total}
                timeTaken={viewingReport?.timeTaken}
                questionResults={viewingReport?.questionResults}
             />
        </div>
    );
}