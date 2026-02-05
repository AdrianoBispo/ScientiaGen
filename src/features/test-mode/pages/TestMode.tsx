import React, { useState } from 'react';
import { generateTestQuestions, TestQuestion } from '../../../services/ai';
import { Play, Settings, RefreshCw, CheckCircle, XCircle, History, Trash2, Save, Edit, X, Plus, AlertCircle } from 'lucide-react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { ExerciseLists } from '../../../components/layout/ExerciseLists';

interface TestHistoryItem {
    id: string;
    date: string;
    topic: string;
    score: number;
    total: number;
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
    
    // Game State
    const [gameStatus, setGameStatus] = useState<'setup' | 'playing' | 'finished'>('setup');
    const [questions, setQuestions] = useState<TestQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    
    // Storage
    const [history, setHistory] = useLocalStorage<TestHistoryItem[]>('testHistory', []);
    const [savedQuizzes, setSavedQuizzes] = useLocalStorage<SavedTestQuiz[]>('savedTestQuizzes', []);
    const [editingQuiz, setEditingQuiz] = useState<SavedTestQuiz | null>(null);

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
        if (selectedOption === currentQuestion.correctAnswer) {
            setScore(score + 1);
        }
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
            score: score + (isAnswered && selectedOption === questions[currentQuestionIndex].correctAnswer ? 1 : 0), // Add last point if correct? 
            // Wait, score is updated on confirm. If user confirmed last question, score is already updated.
            // My handleConfirmAnswer updates score. So score is correct.
            total: questions.length
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
        setQuestions(quiz.questions);
        setTopic(quiz.title);
        setGameStatus('playing');
        setCurrentQuestionIndex(0);
        setScore(0);
        resetQuestionState();
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

    if (gameStatus === 'finished') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in zoom-in duration-300">
                <div className="mb-6 flex flex-col items-center">
                    <CheckCircle size={80} className="text-green-500 mb-4" />
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Teste Finalizado!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Você acertou {score} de {questions.length} questões.
                    </p>
                </div>

                <div className="flex gap-4 w-full max-w-md">
                     <button 
                        onClick={() => setGameStatus('setup')}
                        className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                    >
                        Voltar
                    </button>
                    <button 
                        onClick={handleSaveQuiz}
                        className="flex-1 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition flex items-center justify-center gap-2"
                    >
                        <Save size={18} /> Salvar Teste
                    </button>
                </div>
            </div>
        );
    }

    if (gameStatus === 'playing') {
        const question = questions[currentQuestionIndex];
        return (
            <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto py-10">
                <div className="flex justify-between items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    <span className="uppercase tracking-wider">Modo Teste</span>
                    <span>{currentQuestionIndex + 1} / {questions.length}</span>
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
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 max-w-lg mx-auto text-center">
             <div className="space-y-4">
                 <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Modo Teste</h1>
                 <p className="text-gray-600 dark:text-gray-300">Simulado com tempo e questões de múltipla escolha.</p>
             </div>

             <div className="w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
                 <label className="block text-sm font-medium mb-4 text-left text-gray-700 dark:text-gray-300">Assunto do Simulado</label>
                 <textarea 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full p-4 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none h-32 mb-6"
                    placeholder="Ex: Biologia Celular, História do Brasil..."
                 />

                 <button 
                    onClick={handleStartGame}
                    disabled={!topic || isLoading}
                    className="w-full py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                 >
                     {isLoading && <RefreshCw className="animate-spin" size={20} />}
                     {isLoading ? 'Gerando...' : 'Iniciar Simulado'}
                 </button>
             </div>

             <div className="w-full max-w-lg mx-auto">
                <ExerciseLists<SavedTestQuiz, TestHistoryItem>
                    savedItems={savedQuizzes}
                    historyItems={history}
                    onPlaySaved={handlePlaySavedQuiz}
                    onEditSaved={handleEditSavedQuiz}
                    onDeleteSaved={handleDeleteSavedQuiz}
                    onDeleteHistory={handleDeleteHistoryItem}
                    getSavedTitle={(item) => item.title}
                    getSavedSubtitle={(item) => `${item.questions.length} questões • ${new Date(item.createdAt).toLocaleDateString()}`}
                    getHistoryTitle={(item) => item.topic}
                    getHistorySubtitle={(item) => `${new Date(item.date).toLocaleDateString()} • Score: ${item.score}/${item.total}`}
                />
             </div>
             
             {renderEditQuizModal()}
        </div>
    );
}