import React, { useState, useEffect, useRef } from 'react';
import { generateMixedQuiz, MistoQuestion, QuestionType } from '../../../services/ai';
import { Play, Settings, RefreshCw, CheckCircle, XCircle, History, Trash2, Save, Edit, X, Plus, Brain, ArrowLeft, Sparkles, Pencil, Timer } from 'lucide-react';
import { usePersistence } from '../../../hooks/usePersistence';
import { ExerciseLists } from '../../../components/layout/ExerciseLists';
import { ExerciseSetup } from '../../../components/exercises/ExerciseSetup';
import { ExerciseCompletion } from '../../../components/exercises/ExerciseCompletion';
import { ExerciseBackButton } from '../../../components/exercises/ExerciseBackButton';

interface MixedHistoryItem {
    id: string;
    date: string;
    topic: string;
    score: number;
    total: number;
}

interface SavedMixedQuiz {
    id: string;
    title: string;
    questions: MistoQuestion[];
    createdAt: string;
}

export function Mixed() {
    const [topic, setTopic] = useState('');
    const [questions, setQuestions] = useState<MistoQuestion[]>([]);
    const [currentStep, setCurrentStep] = useState<'setup' | 'quiz' | 'results'>('setup');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState<{ isCorrect: boolean, feedback: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentView, setCurrentView] = useState<'setup' | 'ai' | 'manual'>('setup');
    const [showSetup, setShowSetup] = useState(false);
    const [pendingAction, setPendingAction] = useState<'ai' | 'saved' | null>(null);
    const [selectedSavedQuiz, setSelectedSavedQuiz] = useState<SavedMixedQuiz | null>(null);
    const [questionCount, setQuestionCount] = useState(5);
    const [resultSaved, setResultSaved] = useState(false);
    
    // Manual creation state
    const [manualTitle, setManualTitle] = useState('');
    const [manualQuestions, setManualQuestions] = useState<MistoQuestion[]>([
        { question: '', answer: '', type: QuestionType.OPEN_ENDED }
    ]);
    
    const [history, setHistory] = usePersistence<MixedHistoryItem[]>('mixedHistory', []);
    const [savedQuizzes, setSavedQuizzes] = usePersistence<SavedMixedQuiz[]>('savedMixedQuizzes', []);
    const [editingQuiz, setEditingQuiz] = useState<SavedMixedQuiz | null>(null);

    // Timer state
    const [elapsedTime, setElapsedTime] = useState(0);
    const timerRef = useRef<number | null>(null);

    // Timer effect
    useEffect(() => {
        if (currentStep === 'quiz') {
            timerRef.current = window.setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [currentStep]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startQuiz = async () => {
        if (!topic.trim()) return;
        setIsLoading(true);
        try {
            const generatedQuestions = await generateMixedQuiz(topic, 5);
            if (generatedQuestions.length > 0) {
                setQuestions(generatedQuestions);
                setCurrentStep('quiz');
                setCurrentIndex(0);
                setScore(0);
                setFeedback(null);
                setUserAnswer('');
                setElapsedTime(0);
            } else {
                alert('Não foi possível gerar questões suficientes. Tente outro tópico.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao gerar quiz.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckAnswer = () => {
        const question = questions[currentIndex];
        let isCorrect = false;

        if (question.type === QuestionType.MULTIPLE_CHOICE) {
            isCorrect = userAnswer === question.answer;
        } else {
             // Simple case-insensitive match for strings
             isCorrect = userAnswer.toLowerCase().trim() === question.answer.toLowerCase().trim();
        }

        setFeedback({
            isCorrect,
            feedback: isCorrect ? 'Correto!' : `Incorreto. A resposta era: ${question.answer}`
        });

        if (isCorrect) setScore(score + 1);
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setFeedback(null);
            setUserAnswer('');
        } else {
            setCurrentStep('results');
            // Save history automatically? Or let user do it?
            // Usually valid to save history on finish
            const historyItem: MixedHistoryItem = {
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                topic: topic,
                score: score + (feedback?.isCorrect ? 0 : 0), // Score already updated before handleNext unless last q
                total: questions.length
            };
            setHistory([historyItem, ...history]);
        }
    };

    const handleSaveQuiz = () => {
        const title = prompt("Digite um nome para este quiz:", topic);
        if (!title) return;
        
        const newQuiz: SavedMixedQuiz = {
            id: crypto.randomUUID(),
            title,
            questions,
            createdAt: new Date().toISOString()
        };
        setSavedQuizzes([newQuiz, ...savedQuizzes]);
        alert('Quiz salvo!');
    };

    const handlePlaySavedQuiz = (quiz: SavedMixedQuiz) => {
        setSelectedSavedQuiz(quiz);
        setTopic(quiz.title);
        setPendingAction('saved');
        setShowSetup(true);
    };

    const handleEditSavedQuiz = (quiz: SavedMixedQuiz) => {
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
        const validQuestions = manualQuestions.filter(q => q.question.trim() && q.answer.trim());
        if (validQuestions.length === 0) return;

        const newQuiz: SavedMixedQuiz = {
            id: crypto.randomUUID(),
            title: manualTitle,
            questions: validQuestions.map(q => ({
                ...q,
                options: q.type === QuestionType.MULTIPLE_CHOICE ? (q.options?.filter(o => o.trim()) || []) : undefined
            })),
            createdAt: new Date().toISOString()
        };

        setSavedQuizzes([...savedQuizzes, newQuiz]);
        setManualTitle('');
        setManualQuestions([{ question: '', answer: '', type: QuestionType.OPEN_ENDED }]);
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
                <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">Use o formulário abaixo para enviar um tópico e receber questões mistas geradas pela IA.</p>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 mb-8">
                    <label className="block text-sm font-medium mb-4 text-left text-gray-700 dark:text-gray-300">Tópico do Quiz</label>
                    <textarea 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full p-4 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24 mb-4"
                        placeholder="Ex: Geografia do Brasil, História da Arte..."
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
                        {isLoading ? 'Gerando...' : 'Gerar Quiz'}
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
                <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white text-center">Criar Quiz Misto Manualmente</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">Crie questões de diferentes tipos: múltipla escolha, preencher ou abertas.</p>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 mb-8">
                    <input 
                        type="text" 
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        className="w-full p-4 mb-6 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-lg"
                        placeholder="Título do Quiz (Ex: Geografia do Brasil)"
                    />

                    <div className="space-y-6">
                        {manualQuestions.map((q, idx) => (
                            <div key={idx} className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl border border-gray-100 dark:border-slate-600 relative group animate-fade-in">
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
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase text-gray-500">Questão {idx + 1}</span>
                                        <select 
                                            value={q.type}
                                            onChange={(e) => {
                                                const newQuestions = [...manualQuestions];
                                                const newType = e.target.value as QuestionType;
                                                newQuestions[idx] = { 
                                                    ...q, 
                                                    type: newType,
                                                    options: newType === QuestionType.MULTIPLE_CHOICE ? ['', '', '', ''] : undefined
                                                };
                                                setManualQuestions(newQuestions);
                                            }}
                                            className="text-xs p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg dark:text-white"
                                        >
                                            <option value={QuestionType.OPEN_ENDED}>Aberta</option>
                                            <option value={QuestionType.FILL_IN_BLANK}>Preencher</option>
                                            <option value={QuestionType.MULTIPLE_CHOICE}>Múltipla Escolha</option>
                                        </select>
                                    </div>
                                    
                                    <textarea 
                                        className="w-full p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-800 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none min-h-[60px]"
                                        value={q.question}
                                        onChange={(e) => {
                                            const newQuestions = [...manualQuestions];
                                            newQuestions[idx] = { ...q, question: e.target.value };
                                            setManualQuestions(newQuestions);
                                        }}
                                        placeholder={q.type === QuestionType.FILL_IN_BLANK ? "Use ___ para indicar o espaço em branco" : "Digite a pergunta"}
                                    />
                                    
                                    {q.type === QuestionType.MULTIPLE_CHOICE && (
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-2">Opções</label>
                                            <div className="space-y-2">
                                                {(q.options || ['', '', '', '']).map((opt, optIdx) => (
                                                    <div key={optIdx} className="flex items-center gap-2">
                                                        <input 
                                                            type="radio"
                                                            name={`correct-mixed-${idx}`}
                                                            checked={q.answer === opt && opt !== ''}
                                                            onChange={() => {
                                                                const newQuestions = [...manualQuestions];
                                                                newQuestions[idx] = { ...q, answer: opt };
                                                                setManualQuestions(newQuestions);
                                                            }}
                                                            className="w-4 h-4 text-blue-600"
                                                        />
                                                        <input 
                                                            type="text"
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const newQuestions = [...manualQuestions];
                                                                const newOptions = [...(newQuestions[idx].options || [])];
                                                                const wasCorrect = newQuestions[idx].answer === newOptions[optIdx];
                                                                newOptions[optIdx] = e.target.value;
                                                                if (wasCorrect) {
                                                                    newQuestions[idx].answer = e.target.value;
                                                                }
                                                                newQuestions[idx].options = newOptions;
                                                                setManualQuestions(newQuestions);
                                                            }}
                                                            className="flex-1 p-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg dark:text-white outline-none focus:border-blue-500"
                                                            placeholder={`Opção ${optIdx + 1}`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {q.type !== QuestionType.MULTIPLE_CHOICE && (
                                        <input 
                                            type="text"
                                            className="w-full p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-600 dark:text-gray-300 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                            value={q.answer}
                                            onChange={(e) => {
                                                const newQuestions = [...manualQuestions];
                                                newQuestions[idx] = { ...q, answer: e.target.value };
                                                setManualQuestions(newQuestions);
                                            }}
                                            placeholder="Resposta correta"
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100 dark:border-slate-700">
                        <button 
                            onClick={() => setManualQuestions([...manualQuestions, { question: '', answer: '', type: QuestionType.OPEN_ENDED }])}
                            className="flex items-center justify-center gap-2 px-6 py-3 border border-blue-600 text-blue-600 dark:text-blue-400 rounded-xl font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group"
                        >
                            <Plus size={20} className="group-hover:scale-110 transition-transform"/> Adicionar Questão
                        </button>
                        <button 
                            onClick={handleSaveManualQuiz}
                            disabled={!manualTitle.trim() || !manualQuestions.some(q => q.question.trim() && q.answer.trim())}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-200 dark:shadow-none"
                        >
                            Salvar Quiz
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderEditQuizModal = () => {
        if (!editingQuiz) return null;

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Edit size={20} className="text-blue-500" />
                            Editar Quiz Misto
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
                                Título do Quiz
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
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold uppercase text-gray-500">Questão {idx + 1}</span>
                                            <select 
                                                value={q.type}
                                                onChange={(e) => {
                                                    const newQuestions = [...editingQuiz.questions];
                                                    newQuestions[idx] = { ...q, type: e.target.value as QuestionType };
                                                    setEditingQuiz({...editingQuiz, questions: newQuestions});
                                                }}
                                                className="text-xs p-1 bg-white dark:bg-slate-900 border rounded"
                                            >
                                                <option value={QuestionType.MULTIPLE_CHOICE}>Múltipla Escolha</option>
                                                <option value={QuestionType.FILL_IN_BLANK}>Preencher</option>
                                                <option value={QuestionType.OPEN_ENDED}>Aberta</option>
                                            </select>
                                        </div>

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
                                            <label className="block text-xs text-gray-500 mb-1">Resposta Correta</label>
                                            <input 
                                                type="text"
                                                className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500"
                                                value={q.answer}
                                                onChange={(e) => {
                                                    const newQuestions = [...editingQuiz.questions];
                                                    newQuestions[idx] = { ...q, answer: e.target.value };
                                                    setEditingQuiz({...editingQuiz, questions: newQuestions});
                                                }}
                                            />
                                        </div>

                                        {q.type === QuestionType.MULTIPLE_CHOICE && (
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Opções (separadas por vírgula se não editáveis individualmente, ou use array se suportado)</label>
                                                 {/* Simplification: Just editing Answer for now, usually logic generates options dynamically or we rely on text input for corrections. 
                                                     Ideally we should allow editing options if they exist in MistoQuestion. 
                                                     Let's check if MistoQuestion has options. Yes it does. */}
                                                {(q.options || []).map((opt, optIdx) => (
                                                    <div key={optIdx} className="flex gap-2 mb-1">
                                                        <input 
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const newQuestions = [...editingQuiz.questions];
                                                                if(newQuestions[idx].options) {
                                                                    newQuestions[idx].options![optIdx] = e.target.value;
                                                                    setEditingQuiz({...editingQuiz, questions: newQuestions});
                                                                }
                                                            }}
                                                            className="flex-1 p-2 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg"
                                                            placeholder={`Opção ${optIdx + 1}`}
                                                        />
                                                    </div>
                                                ))}
                                                <button 
                                                    onClick={() => {
                                                        const newQuestions = [...editingQuiz.questions];
                                                        if(!newQuestions[idx].options) newQuestions[idx].options = [];
                                                        newQuestions[idx].options!.push(`Opção ${newQuestions[idx].options!.length + 1}`);
                                                        setEditingQuiz({...editingQuiz, questions: newQuestions});
                                                    }}
                                                    className="text-xs text-blue-500 hover:underline mt-1"
                                                >
                                                    + Adicionar Opção
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex justify-between gap-4">
                        <button 
                            onClick={() => setEditingQuiz({...editingQuiz, questions: [...editingQuiz.questions, { question: '', answer: '', type: QuestionType.OPEN_ENDED }]})}
                            className="px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                        >
                            <Plus size={18} className="inline mr-1" /> Nova Pergunta
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
    const confirmStartQuiz = async () => {
        if (pendingAction === 'saved' && selectedSavedQuiz) {
            setQuestions(selectedSavedQuiz.questions);
            setCurrentStep('quiz');
            setCurrentIndex(0);
            setScore(0);
            setFeedback(null);
            setUserAnswer('');
            setElapsedTime(0);
            setShowSetup(false);
            setResultSaved(false);
            return;
        }
        if (pendingAction === 'ai') {
            setShowSetup(false);
            setResultSaved(false);
            await startQuiz();
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
                title={pendingAction === 'ai' ? `Quiz Misto: ${topic}` : `Quiz: ${topic}`}
                description={pendingAction === 'ai' ? "Configure seu quiz misto gerado por IA" : "Pronto para começar?"}
                configurations={configurations}
                onStart={confirmStartQuiz}
                onBack={() => setShowSetup(false)}
                startLabel={isLoading ? "Gerando..." : "Começar"}
            />
        );
    }

    if (currentStep === 'results') {
        return (
            <ExerciseCompletion
                score={score}
                total={questions.length}
                timeTaken={elapsedTime}
                onPlayAgain={() => {
                    setCurrentStep('setup');
                    setShowSetup(true);
                    setResultSaved(false);
                }}
                onSave={pendingAction === 'ai' ? () => {
                    handleSaveQuiz();
                    setResultSaved(true);
                } : undefined}
                onExit={() => {
                    setCurrentStep('setup');
                    setTopic('');
                    setQuestions([]);
                    setCurrentView('setup');
                    setResultSaved(false);
                }}
                isSaved={resultSaved}
            />
        );
    }

    if (currentStep === 'quiz') {
        const question = questions[currentIndex];
        return (
            <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto py-10">
                <div className="flex justify-between items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    <ExerciseBackButton
                        onConfirm={() => {
                            setCurrentStep('setup');
                            setCurrentIndex(0);
                            setScore(0);
                            setFeedback(null);
                            setUserAnswer('');
                            setQuestions([]);
                        }}
                    />
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 font-mono text-base font-bold text-gray-700 dark:text-gray-300">
                            <Timer size={18} />
                            {formatTime(elapsedTime)}
                        </div>
                        <span>{currentIndex + 1} / {questions.length}</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 min-h-[200px] flex flex-col justify-center">
                    <div className="mb-4 text-xs font-bold text-blue-500 uppercase">{question.type}</div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white leading-relaxed text-center">
                        {question.question}
                    </h2>
                </div>
                
                <div className="space-y-4">
                     {question.type === QuestionType.MULTIPLE_CHOICE && question.options ? (
                         <div className="grid grid-cols-1 gap-3">
                             {question.options.map((opt, i) => (
                                 <button
                                    key={i}
                                    onClick={() => setUserAnswer(opt)}
                                    disabled={!!feedback}
                                    className={`p-4 rounded-xl text-left border transition-all ${userAnswer === opt ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300'}`}
                                 >
                                     {opt}
                                 </button>
                             ))}
                         </div>
                     ) : (
                         <input 
                            type="text" 
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            disabled={!!feedback}
                            className="w-full p-4 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-center text-lg shadow-sm"
                            placeholder="Sua resposta..."
                         />
                     )}
                </div>

                {feedback && (
                    <div className={`p-4 rounded-xl text-center border ${feedback.isCorrect ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'}`}>
                        <p className="font-bold mb-1">{feedback.isCorrect ? 'Correto!' : 'Incorreto'}</p>
                        <p className="text-sm opacity-90">{feedback.feedback}</p>
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    {!feedback ? (
                        <button 
                             onClick={handleCheckAnswer}
                             disabled={!userAnswer}
                             className="px-8 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 shadow-lg shadow-blue-500/20"
                        >
                            Responder
                        </button>
                    ) : (
                        <button 
                             onClick={handleNext}
                             className="px-8 py-3 bg-gray-800 dark:bg-slate-700 text-white rounded-xl font-medium hover:bg-gray-900 dark:hover:bg-slate-600 transition shadow-lg"
                        >
                            {currentIndex < questions.length - 1 ? 'Próxima Pergunta' : 'Ver Resultados'}
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
            <h2 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">Quiz Misto</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Escolha como deseja criar seu quiz.</p>
            
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
                        <p className="text-sm text-gray-500 dark:text-gray-400">Use o formulário para enviar um tópico e receber questões mistas geradas pela IA.</p>
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
                        <p className="text-sm text-gray-500 dark:text-gray-400">Crie seu próprio quiz com diferentes tipos de questões.</p>
                    </div>
                </button>
            </div>

             <div className="w-full">
                <ExerciseLists<SavedMixedQuiz, MixedHistoryItem>
                    savedItems={savedQuizzes}
                    historyItems={history}
                    onPlaySaved={handlePlaySavedQuiz}
                    onEditSaved={handleEditSavedQuiz}
                    onDeleteSaved={handleDeleteSavedQuiz}
                    onDeleteHistory={handleDeleteHistoryItem}
                    getSavedTitle={(item) => item.title}
                    getSavedSubtitle={(item) => `${item.questions.length} questões`}
                    getSavedDate={(item) => item.createdAt}
                    getHistoryTitle={(item) => item.topic}
                    getHistorySubtitle={(item) => `Pontuação: ${item.score}/${item.total}`}
                    getHistoryDate={(item) => item.date}
                />
             </div>
             
             {renderEditQuizModal()}
        </div>
    );
}
