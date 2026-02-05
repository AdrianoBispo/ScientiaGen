import React, { useState } from 'react';
import { Quiz } from '../components/Quiz';
import { generateLearnQuestions, checkAnswer, QuizQuestion, QuestionType } from '../../../services/ai';
import { ArrowLeft, Save, Play, Trash2, Edit, X } from 'lucide-react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { ExerciseLists } from '../../../components/layout/ExerciseLists';

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

    const [history, setHistory] = useLocalStorage<LearnHistoryItem[]>('learnHistory', []);
    const [savedQuizzes, setSavedQuizzes] = useLocalStorage<SavedLearnQuiz[]>('savedLearnQuizzes', []);
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
        setTopic(quiz.title);
        setQuestions(quiz.questions);
        setQuizStarted(true);
        setQuizFinished(false);
        setCurrentQuestionIndex(0);
        setScore(0);
        setFeedback(null);
    };

    const handleEditSavedQuiz = (quiz: SavedLearnQuiz) => {
        setEditingQuiz(quiz);
    };

    const saveEditedQuiz = () => {
        if (!editingQuiz || !editingQuiz.title.trim()) return;
        setSavedQuizzes(savedQuizzes.map(q => q.id === editingQuiz.id ? editingQuiz : q));
        setEditingQuiz(null);
    };

    const renderEditQuizModal = () => {
        if (!editingQuiz) return null;
        
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Editar Exercício</h2>
                        <button onClick={() => setEditingQuiz(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <X size={24} />
                        </button>
                    </div>
                     <div className="p-6 overflow-y-auto bg-gray-50 dark:bg-slate-900/50 flex-1">
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
                     <div className="p-6 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex justify-between gap-4">
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



    const handleStartQuiz = async () => {
        if (!topic.trim()) return;
        setIsLoading(true);
        setError('');
        try {
            const generatedQuestions = await generateLearnQuestions(topic);
            if (generatedQuestions && generatedQuestions.length > 0) {
                setQuestions(generatedQuestions);
                setQuizStarted(true);
                setCurrentQuestionIndex(0);
                setScore(0);
                setQuizFinished(false);
            } else {
                setError('Não foi possível gerar perguntas sobre este tópico. Tente outro.');
            }
        } catch (err) {
            setError('Erro ao gerar quiz. Tente novamente.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

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
            setQuizFinished(true);
        }
    };

    const handleSkip = () => {
        setFeedback({
            isCorrect: false,
            text: `A resposta correta era: ${questions[currentQuestionIndex].answer}`
        });
    };

    if (quizFinished) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in zoom-in duration-300">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Quiz Finalizado!</h2>
                <div className="text-xl text-gray-600 dark:text-gray-300">
                    Sua pontuação final: <span className="font-bold text-blue-600 dark:text-blue-400">{score}</span> de {questions.length}
                </div>
             {renderEditQuizModal()}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
                    <button 
                        onClick={handleSaveHistory}
                        className="px-6 py-3 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition flex items-center gap-2"
                    >
                        <Save size={20} /> Salvar Resultado
                    </button>
                    <button 
                        onClick={handleSaveQuiz}
                        className="px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition flex items-center gap-2"
                    >
                        <Save size={20} /> Salvar Exercício
                    </button>
                    <button 
                        onClick={() => {
                            setQuizStarted(false);
                            setTopic('');
                            setQuestions([]);
                        }}
                        className="px-6 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                    >
                        Voltar ao Início
                    </button>
                </div>
            </div>
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

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 max-w-lg mx-auto text-center">
             <div className="space-y-4">
                 <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Modo Aprender</h1>
                 <p className="text-gray-600 dark:text-gray-300">Responda às perguntas e receba feedback instantâneo da IA.</p>
             </div>

             <div className="w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
                 <label className="block text-sm font-medium mb-4 text-left text-gray-700 dark:text-gray-300">Sobre o que você quer aprender?</label>
                 <textarea 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full p-4 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none h-32 mb-6"
                    placeholder="Ex: Revolução Francesa, Física Quântica, Verbos em Inglês..."
                 />
                 
                 {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                 <button 
                    onClick={handleStartQuiz}
                    disabled={!topic || isLoading}
                    className="w-full py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                     {isLoading ? 'Iniciando...' : 'Começar a Aprender'}
                 </button>
             </div>

             <div className="w-full max-w-lg mx-auto">
                <ExerciseLists<SavedLearnQuiz, LearnHistoryItem>
                    savedItems={savedQuizzes}
                    historyItems={history}
                    onPlaySaved={handlePlaySavedQuiz}
                    onEditSaved={handleEditSavedQuiz}
                    onDeleteSaved={handleDeleteSavedQuiz}
                    onDeleteHistory={handleDeleteHistoryItem}
                    getSavedTitle={(item) => item.title}
                    getSavedSubtitle={(item) => `${item.questions.length} questões • ${new Date(item.createdAt).toLocaleDateString()}`}
                />
             </div>
             
             {renderEditQuizModal()}
        </div>
    );
}
