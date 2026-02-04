import React, { useState } from 'react';
import { generateMixedQuiz, checkAnswer, MistoQuestion, QuestionType } from '../services/ai';
import { History, Save, Trash2 } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface MixedHistoryItem {
    id: string;
    date: string;
    topic: string;
    score: number;
    total: number;
}

export function Mixed() {
    const [topic, setTopic] = useState('');
    const [questions, setQuestions] = useState<MistoQuestion[]>([]);
    const [currentStep, setCurrentStep] = useState<'setup' | 'quiz' | 'results'>('setup');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ isCorrect: boolean; feedback: string } | null>(null);
    const [score, setScore] = useState(0);
    const [isChecking, setIsChecking] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const [history, setHistory] = useLocalStorage<MixedHistoryItem[]>('mixedHistory', []);

    const handleSaveHistory = () => {
        const newItem: MixedHistoryItem = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            topic: topic,
            score: score,
            total: questions.length
        };
        setHistory([newItem, ...history]);
        alert('Resultado salvo!');
    };

    const handleDeleteHistoryItem = (id: string) => {
        setHistory(history.filter(item => item.id !== id));
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

    const handleCheckAnswer = async () => {
        if (!userAnswer) return;
        setIsChecking(true);
        const currentQuestion = questions[currentIndex];
        try {
            const result = await checkAnswer(currentQuestion.question, userAnswer, currentQuestion.answer, currentQuestion.type);
            setFeedback(result);
            if (result.isCorrect) {
                setScore(s => s + 1);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsChecking(false);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(c => c + 1);
            setUserAnswer('');
            setFeedback(null);
        } else {
            setCurrentStep('results');
        }
    };

    // Render Setup
    if (currentStep === 'setup') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 max-w-lg mx-auto text-center">
                <div className="space-y-4">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Modo Misto</h1>
                    <p className="text-gray-600 dark:text-gray-300">Um mix desafiador de perguntas de múltipla escolha, preenchimento e abertas.</p>
                </div>

                <div className="w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
                    <label className="block text-sm font-medium mb-4 text-gray-700 dark:text-gray-300">Sobre o que você quer praticar hoje?</label>
                    <textarea 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full p-4 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none h-32 mb-6"
                        placeholder="Ex: Revolução Francesa, Biologia Celular, React Hooks..."
                    />
                    
                    <button 
                        onClick={startQuiz}
                        disabled={!topic || isLoading}
                        className="w-full py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Gerando Quiz...' : 'Iniciar Quiz'}
                    </button>
                </div>

                <button 
                    onClick={() => setShowHistory(!showHistory)} 
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition"
                >
                    <History size={20} /> {showHistory ? 'Ocultar Histórico' : 'Ver Histórico'}
                </button>

                {showHistory && (
                 <div className="w-full bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 mt-4 text-left animate-in slide-in-from-top-4">
                     <h3 className="font-bold text-gray-800 dark:text-white mb-4">Histórico Misto</h3>
                     {history.length === 0 ? (
                         <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum histórico salvo.</p>
                     ) : (
                         <div className="space-y-3">
                             {history.map(item => (
                                 <div key={item.id} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition-all">
                                     <div>
                                         <div className="font-medium text-gray-800 dark:text-gray-200">{item.topic}</div>
                                         <div className="text-xs text-gray-500">
                                            {new Date(item.date).toLocaleDateString()} • Score: {item.score}/{item.total}
                                         </div>
                                     </div>
                                     <button 
                                         onClick={() => handleDeleteHistoryItem(item.id)}
                                         className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                     >
                                         <Trash2 size={16} />
                                     </button>
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>
             )}
            </div>
        );
    }

    // Render Results
    if (currentStep === 'results') {
        return (
             <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 max-w-lg mx-auto text-center animate-in zoom-in duration-300">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Quiz Finalizado!</h1>
                
                <div className="bg-white dark:bg-slate-800 p-10 rounded-full w-48 h-48 flex flex-col items-center justify-center shadow-sm border-4 border-blue-100 dark:border-blue-900">
                    <span className="text-5xl font-bold text-blue-600 dark:text-blue-400">{score}</span>
                    <span className="text-gray-500 dark:text-gray-400">de {questions.length}</span>
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={handleSaveHistory}
                        className="px-8 py-3 bg-green-600 dark:bg-green-500 text-white rounded-xl font-medium hover:bg-green-700 dark:hover:bg-green-600 transition flex items-center gap-2"
                    >
                        <Save size={20} /> Salvar
                    </button>
                    <button 
                        onClick={() => setCurrentStep('setup')}
                        className="px-8 py-3 bg-gray-800 dark:bg-slate-700 text-white rounded-xl font-medium hover:bg-gray-900 dark:hover:bg-slate-600 transition"
                    >
                        Voltar ao Início
                    </button>
                </div>
             </div>
        );
    }

    // Render Quiz Question
    const question = questions[currentIndex];
    return (
        <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto py-10">
            <div className="flex justify-between items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                <span className="uppercase tracking-wider">{question.type.replace('_', ' ')}</span>
                <span>{currentIndex + 1} / {questions.length}</span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 min-h-[200px] flex flex-col justify-center">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white leading-relaxed text-center">
                    {question.question}
                </h2>
            </div>
            
            {/* Input Area based on type (Simplified for demo) */}
            <div className="space-y-4">
                 <input 
                    type="text" 
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={!!feedback || isChecking}
                    className="w-full p-4 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-center text-lg"
                    placeholder="Sua resposta..."
                 />
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
                         disabled={!userAnswer || isChecking}
                         className="px-8 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:opacity-50"
                    >
                        {isChecking ? 'Verificando...' : 'Responder'}
                    </button>
                ) : (
                    <button 
                         onClick={handleNext}
                         className="px-8 py-3 bg-gray-800 dark:bg-slate-700 text-white rounded-xl font-medium hover:bg-gray-900 dark:hover:bg-slate-600 transition"
                    >
                        {currentIndex < questions.length - 1 ? 'Próxima Pergunta' : 'Ver Resultados'}
                    </button>
                )}
            </div>
        </div>
    );
}
