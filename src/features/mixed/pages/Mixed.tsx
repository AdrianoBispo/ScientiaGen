import React, { useState } from 'react';
import { generateMixedQuiz, MistoQuestion, QuestionType } from '../../../services/ai';
import { Play, Settings, RefreshCw, CheckCircle, XCircle, History, Trash2, Save, Edit, X, Plus } from 'lucide-react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { ExerciseLists } from '../../../components/layout/ExerciseLists';

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
    
    const [history, setHistory] = useLocalStorage<MixedHistoryItem[]>('mixedHistory', []);
    const [savedQuizzes, setSavedQuizzes] = useLocalStorage<SavedMixedQuiz[]>('savedMixedQuizzes', []);
    const [editingQuiz, setEditingQuiz] = useState<SavedMixedQuiz | null>(null);

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
        setQuestions(quiz.questions);
        setTopic(quiz.title);
        setCurrentStep('quiz');
        setCurrentIndex(0);
        setScore(0);
        setFeedback(null);
        setUserAnswer('');
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

    if (currentStep === 'results') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in zoom-in duration-300">
                <div className="mb-6 flex flex-col items-center">
                    <CheckCircle size={80} className="text-green-500 mb-4" />
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Quiz Finalizado!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Você acertou {score} de {questions.length} questões.
                    </p>
                </div>

                <div className="flex gap-4 w-full max-w-md">
                     <button 
                        onClick={() => setCurrentStep('setup')}
                        className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                    >
                        Voltar
                    </button>
                    <button 
                        onClick={handleSaveQuiz}
                        className="flex-1 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition flex items-center justify-center gap-2"
                    >
                        <Save size={18} /> Salvar Quiz
                    </button>
                </div>
            </div>
        );
    }

    if (currentStep === 'quiz') {
        const question = questions[currentIndex];
        return (
            <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto py-10">
                <div className="flex justify-between items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    <span className="uppercase tracking-wider">Questão {currentIndex + 1}</span>
                    <span>{currentIndex + 1} / {questions.length}</span>
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
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 max-w-lg mx-auto text-center">
             <div className="space-y-4">
                 <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Quiz Misto</h1>
                 <p className="text-gray-600 dark:text-gray-300">Questões de múltipla escolha, preencher lacunas e abertas.</p>
             </div>

             <div className="w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
                 <label className="block text-sm font-medium mb-4 text-left text-gray-700 dark:text-gray-300">Tópico do Quiz</label>
                 <textarea 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full p-4 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none h-32 mb-6"
                    placeholder="Ex: Geografia do Brasil, História da Arte..."
                 />

                 <button 
                    onClick={startQuiz}
                    disabled={!topic || isLoading}
                    className="w-full py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                 >
                     {isLoading && <RefreshCw className="animate-spin" size={20} />}
                     {isLoading ? 'Gerando...' : 'Iniciar Quiz'}
                 </button>
             </div>

             <div className="w-full max-w-lg mx-auto">
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
