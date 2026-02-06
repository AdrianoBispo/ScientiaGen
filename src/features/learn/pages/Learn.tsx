import React, { useState } from 'react';
import { Quiz } from '../components/Quiz';
import { generateLearnQuestions, checkAnswer, QuizQuestion, QuestionType } from '../../../services/ai';
import { ArrowLeft, Save, Play, Trash2, Edit, X, Plus, Brain, Sparkles, Pencil } from 'lucide-react';
import { usePersistence } from '../../../hooks/usePersistence';
import { ExerciseLists } from '../../../components/layout/ExerciseLists';
import { ExerciseSetup } from '../../../components/exercises/ExerciseSetup';
import { ExerciseCompletion } from '../../../components/exercises/ExerciseCompletion';

interface LearnHistoryItem {
    id: string;
    date: string;
    topic: string;
    score: number;
    total: number;
}

interface SavedLearnQuiz {
    id: string;
    title: string;
    questions: QuizQuestion[];
    createdAt: string;
}

export function Learn() {
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
    const [score, setScore] = useState(0);
    const [quizStarted, setQuizStarted] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [error, setError] = useState('');
    const [currentView, setCurrentView] = useState<'setup' | 'ai' | 'manual'>('setup');
    const [showSetup, setShowSetup] = useState(false);
    const [questionCount, setQuestionCount] = useState(5);
    const [pendingAction, setPendingAction] = useState<'ai' | 'saved' | null>(null);
    const [selectedSavedQuiz, setSelectedSavedQuiz] = useState<SavedLearnQuiz | null>(null);

    // Manual creation state
    const [manualTitle, setManualTitle] = useState('');
    const [manualQuestions, setManualQuestions] = useState<QuizQuestion[]>([{ question: '', answer: '' }]);

    const [history, setHistory] = usePersistence<LearnHistoryItem[]>('learnHistory', []);
    const [savedQuizzes, setSavedQuizzes] = usePersistence<SavedLearnQuiz[]>('savedLearnQuizzes', []);
    const [editingQuiz, setEditingQuiz] = useState<SavedLearnQuiz | null>(null);

    const handleSaveHistory = () => {
        const newItem: LearnHistoryItem = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            topic: topic,
            score: score,
            total: questions.length
        };
        setHistory([newItem, ...history]);
    };

    const handleSaveQuiz = () => {
         const newQuiz: SavedLearnQuiz = {
             id: crypto.randomUUID(),
             title: topic,
             questions: questions,
             createdAt: new Date().toISOString()
         };
         setSavedQuizzes([...savedQuizzes, newQuiz]);
         alert('Questionário salvo com sucesso!');
    };

    const handleDeleteHistoryItem = (id: string) => {
        setHistory(history.filter(item => item.id !== id));
    };

    const handleDeleteSavedQuiz = (id: string) => {
        setSavedQuizzes(savedQuizzes.filter(q => q.id !== id));
    };
    
    const handlePlaySavedQuiz = (quiz: SavedLearnQuiz) => {
        setSelectedSavedQuiz(quiz);
        setTopic(quiz.title);
        setPendingAction('saved');
        setShowSetup(true);
    };

    const handleEditSavedQuiz = (quiz: SavedLearnQuiz) => {
        setEditingQuiz(quiz);
    };

    const saveEditedQuiz = () => {
        if (!editingQuiz || !editingQuiz.title.trim()) return;
        setSavedQuizzes(savedQuizzes.map(q => q.id === editingQuiz.id ? editingQuiz : q));
        setEditingQuiz(null);
    };

    const handleSaveManualQuiz = () => {
        if (!manualTitle.trim()) return;
        const validQuestions = manualQuestions.filter(q => q.question.trim() && q.answer.trim());
        if (validQuestions.length === 0) return;

        const newQuiz: SavedLearnQuiz = {
            id: crypto.randomUUID(),
            title: manualTitle,
            questions: validQuestions,
            createdAt: new Date().toISOString()
        };

        setSavedQuizzes([...savedQuizzes, newQuiz]);
        setManualTitle('');
        setManualQuestions([{ question: '', answer: '' }]);
        setCurrentView('setup');
    };

    const renderAIView = () => (
        <div className="w-full max-w-4xl mx-auto p-3 sm:p-6">
            <button 
                onClick={() => setCurrentView('setup')} 
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:hover:text-white mb-4 sm:mb-6 transition"
            >
                <ArrowLeft size={20} /> Voltar
            </button>

            <div className="flex flex-col h-full">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800 dark:text-white text-center">Gerar com IA</h1>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 text-center">Use o formulário abaixo para enviar um tópico e receber exercícios gerados pela IA.</p>

                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 mb-6 sm:mb-8">
                    <label className="block text-sm font-medium mb-4 text-left text-gray-700 dark:text-gray-300">Tópico do Exercício</label>
                    <textarea 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full p-4 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24 mb-4"
                        placeholder="Ex: Revolução Francesa, Física Quântica..."
                    />
                    
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                    <button 
                        onClick={handleStartQuiz}
                        disabled={!topic || isLoading}
                        className="w-full py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Sparkles size={20} />
                        {isLoading ? 'Gerando...' : 'Gerar Exercícios'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderManualCreationView = () => (
        <div className="w-full max-w-4xl mx-auto p-3 sm:p-6">
            <button 
                onClick={() => setCurrentView('setup')} 
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:hover:text-white mb-4 sm:mb-6 transition"
            >
                <ArrowLeft size={20} /> Voltar
            </button>

            <div className="flex flex-col h-full">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800 dark:text-white text-center">Criar Manualmente</h1>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 text-center">Crie suas próprias perguntas e respostas.</p>

                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 mb-6 sm:mb-8">
                    <input 
                        type="text" 
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        className="w-full p-4 mb-6 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-lg"
                        placeholder="Título do Exercício (Ex: Biologia)"
                    />

                    <div className="space-y-4">
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
                                <div className="space-y-3 pr-6">
                                    <textarea 
                                        className="w-full p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-800 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none min-h-[60px]"
                                        value={q.question}
                                        onChange={(e) => {
                                            const newQuestions = [...manualQuestions];
                                            newQuestions[idx] = { ...q, question: e.target.value };
                                            setManualQuestions(newQuestions);
                                        }}
                                        placeholder="Pergunta"
                                    />
                                    <textarea 
                                        className="w-full p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-600 dark:text-gray-300 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none min-h-[60px] transition"
                                        value={q.answer}
                                        onChange={(e) => {
                                            const newQuestions = [...manualQuestions];
                                            newQuestions[idx] = { ...q, answer: e.target.value };
                                            setManualQuestions(newQuestions);
                                        }}
                                        placeholder="Resposta esperada"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100 dark:border-slate-700">
                        <button 
                            onClick={() => setManualQuestions([...manualQuestions, { question: '', answer: '' }])}
                            className="flex items-center justify-center gap-2 px-6 py-3 border border-blue-600 text-blue-600 dark:text-blue-400 rounded-xl font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group"
                        >
                            <Plus size={20} className="group-hover:scale-110 transition-transform"/> Adicionar Pergunta
                        </button>
                        <button 
                            onClick={handleSaveManualQuiz}
                            disabled={!manualTitle.trim() || !manualQuestions.some(q => q.question.trim() && q.answer.trim())}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-200 dark:shadow-none"
                        >
                            Salvar Exercício
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderEditQuizModal = () => {
        if (!editingQuiz) return null;
        
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-slate-700">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Editar Exercício</h2>
                        <button onClick={() => setEditingQuiz(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <X size={24} />
                        </button>
                    </div>
                     <div className="p-4 sm:p-6 overflow-y-auto bg-gray-50 dark:bg-slate-900/50 flex-1">
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Título do Exercício</label>
                        <input 
                            type="text" 
                            value={editingQuiz.title}
                            onChange={(e) => setEditingQuiz({...editingQuiz, title: e.target.value})}
                            className="w-full p-4 mb-6 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Nome do Exercício"
                        />
                        
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Perguntas</h3>
                        <div className="space-y-4">
                            {editingQuiz.questions.map((q, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 relative group">
                                     <button 
                                        onClick={() => {
                                            const newQuestions = editingQuiz.questions.filter((_, i) => i !== idx);
                                            setEditingQuiz({...editingQuiz, questions: newQuestions});
                                        }}
                                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                        title="Remover Pergunta"
                                    >
                                        <X size={16} />
                                    </button>
                                     <div className="space-y-3 pr-6">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Pergunta</label>
                                            <textarea
                                                className="w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-lg text-sm text-gray-800 dark:text-white outline-none focus:border-blue-500 resize-none min-h-[50px]"
                                                value={q.question}
                                                onChange={(e) => {
                                                    const newQuestions = [...editingQuiz.questions];
                                                    newQuestions[idx] = { ...q, question: e.target.value };
                                                    setEditingQuiz({...editingQuiz, questions: newQuestions});
                                                }}
                                                placeholder="Sua pergunta..."
                                            />
                                        </div>
                                         <div>
                                            <label className="block text-xs text-gray-500 mb-1">Resposta Esperada</label>
                                            <textarea
                                                className="w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 outline-none focus:border-blue-500 resize-none min-h-[50px]"
                                                value={q.answer}
                                                onChange={(e) => {
                                                    const newQuestions = [...editingQuiz.questions];
                                                    newQuestions[idx] = { ...q, answer: e.target.value };
                                                    setEditingQuiz({...editingQuiz, questions: newQuestions});
                                                }}
                                                placeholder="A resposta correta..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                     <div className="p-4 sm:p-6 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
                        <button 
                            onClick={() => setEditingQuiz({...editingQuiz, questions: [...editingQuiz.questions, { question: '', answer: '' }]})}
                            className="px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                        >
                            Adicionar Nova Pergunta
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



    const handleOpenAiSetup = () => {
        if (!topic.trim()) {
            setError('Por favor, insira um tópico.');
            return;
        }
        setError('');
        setPendingAction('ai');
        setShowSetup(true);
    };

    const confirmStartQuiz = async () => {
        if (pendingAction === 'saved' && selectedSavedQuiz) {
            setQuestions(selectedSavedQuiz.questions);
            setQuizStarted(true);
            setQuizFinished(false);
            setCurrentQuestionIndex(0);
            setScore(0);
            setFeedback(null);
            setShowSetup(false);
            return;
        }

        if (pendingAction === 'ai') {
            setIsLoading(true);
            setError('');
            // Close setup immediately implies loading is shown somewhere else?
            // Or keep setup open with loading state?
            // ExerciseSetup doesn't have loading prop yet. I should add it or just rely on isLoading state if passed to Start button
            
            try {
                const generatedQuestions = await generateLearnQuestions(topic, questionCount);
                if (generatedQuestions && generatedQuestions.length > 0) {
                    setQuestions(generatedQuestions);
                    setQuizStarted(true);
                    setQuizFinished(false);
                    setCurrentQuestionIndex(0);
                    setScore(0);
                    setFeedback(null);
                    setShowSetup(false);
                } else {
                    setError('Não foi possível gerar perguntas sobre este tópico. Tente outro.');
                    setShowSetup(false);
                }
            } catch (err) {
                setError('Erro ao gerar quiz. Tente novamente.');
                console.error(err);
                setShowSetup(false);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Kept for compatibility if any other call uses it, but redirected
    const handleStartQuiz = handleOpenAiSetup;


    const handleAnswer = async (userAnswer: string, timeTaken: number) => {
        const currentQuestion = questions[currentQuestionIndex];
        setIsEvaluating(true);
        try {
            const evaluation = await checkAnswer(
                currentQuestion.question,
                userAnswer,
                currentQuestion.answer,
                QuestionType.OPEN_ENDED
            );
            
            setFeedback({
                isCorrect: evaluation.isCorrect,
                text: evaluation.feedback
            });

            if (evaluation.isCorrect) {
                setScore(score + 1);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleNext = () => {
        setFeedback(null);
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            handleSaveHistory();
            setQuizFinished(true);
        }
    };

    const handleSkip = () => {
        setFeedback({
            isCorrect: false,
            text: `A resposta correta era: ${questions[currentQuestionIndex].answer}`
        });
    };

    if (showSetup) {
        const configurations = [];
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
                title={pendingAction === 'ai' ? `Gerar Quiz: ${topic}` : `Quiz: ${topic}`}
                description={pendingAction === 'ai' ? "Configure seu exercício gerado por IA" : "Pronto para começar?"}
                configurations={configurations as any}
                onStart={confirmStartQuiz}
                onBack={() => setShowSetup(false)}
                startLabel={isLoading ? "Gerando..." : "Começar"}
            />
        );
    }

    if (quizFinished) {
        return (
            <ExerciseCompletion
                score={score}
                total={questions.length}
                onPlayAgain={() => {
                    setQuizStarted(false);
                    setQuizFinished(false);
                    setShowSetup(true);
                }}
                onSave={pendingAction === 'ai' ? handleSaveQuiz : undefined}
                onExit={() => {
                    setQuizStarted(false);
                    setQuizFinished(false);
                    setTopic('');
                    setQuestions([]);
                    setCurrentView('setup');
                }}
                isSaved={savedQuizzes.some(sq => sq.title === topic && sq.questions.length === questions.length)}
            />
        );
    }

    if (quizStarted) {
        return (
            <div className="w-full max-w-4xl mx-auto">
                <button 
                    onClick={() => setQuizStarted(false)} 
                    className="mb-6 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                >
                    <ArrowLeft size={20} className="mr-2" /> Voltar
                </button>
                <Quiz 
                    currentStep={currentQuestionIndex + 1}
                    totalSteps={questions.length}
                    question={questions[currentQuestionIndex].question}
                    onAnswer={handleAnswer}
                    onSkip={handleSkip}
                    isEvaluating={isEvaluating}
                    feedback={feedback}
                    onNext={handleNext}
                />
            </div>
        );
    }

    if (currentView === 'ai') {
        return renderAIView();
    }

    if (currentView === 'manual') {
        return renderManualCreationView();
    }

    return (
        <div className="w-full max-w-6xl mx-auto p-3 sm:p-6">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800 dark:text-white">Modo Aprender</h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 sm:mb-8">Escolha como deseja criar seus exercícios.</p>
            
            {/* Create Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <button 
                    onClick={() => setCurrentView('ai')}
                    className="p-5 sm:p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col items-start text-left gap-3 sm:gap-4 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all group"
                >
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl group-hover:scale-110 transition-transform">
                        <Sparkles size={28} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-1">Gerar com IA</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Use o formulário para enviar um tópico e receber exercícios gerados pela IA.</p>
                    </div>
                </button>
                
                <button 
                    onClick={() => setCurrentView('manual')}
                    className="p-5 sm:p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col items-start text-left gap-3 sm:gap-4 hover:border-green-400 dark:hover:border-green-500 hover:shadow-md transition-all group"
                >
                    <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl group-hover:scale-110 transition-transform">
                        <Pencil size={28} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-1">Criar Manualmente</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Crie seus próprios exercícios passo a passo manualmente.</p>
                    </div>
                </button>
            </div>

             <div className="w-full">
                <ExerciseLists<SavedLearnQuiz, LearnHistoryItem>
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
                    getHistoryDate={(item) => item.date}
                />
             </div>
             
             {renderEditQuizModal()}
        </div>
    );
}
