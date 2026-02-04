import React, { useState } from 'react';
import { Quiz } from '../components/Quiz';
import { generateLearnQuestions, checkAnswer, QuizQuestion, QuestionType } from '../services/ai';
import { ArrowLeft, History, Trash2, Save } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface LearnHistoryItem {
    id: string;
    date: string;
    topic: string;
    score: number;
    total: number;
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
    const [showHistory, setShowHistory] = useState(false);

    const [history, setHistory] = useLocalStorage<LearnHistoryItem[]>('learnHistory', []);

    const handleSaveHistory = () => {
        const newItem: LearnHistoryItem = {
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


    const handleStartQuiz = async () => {
        if (!topic.trim()) return;
        setIsLoading(true);
        setError('');
        try {
            const generatedQuestions = await generateLearnQuestions(topic);
            if (generatedQuestions.length > 0) {
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
                <div className="flex gap-4 mt-4">
                    <button 
                        onClick={handleSaveHistory}
                        className="px-6 py-3 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition flex items-center gap-2"
                    >
                        <Save size={20} /> Salvar
                    </button>
                    <button 
                        onClick={() => {
                            setQuizStarted(false);
                            setTopic('');
                            setQuestions([]);
                        }}
                        className="px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
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

             <button 
                onClick={() => setShowHistory(!showHistory)} 
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition"
            >
                <History size={20} /> {showHistory ? 'Ocultar Histórico' : 'Ver Histórico'}
             </button>

             {showHistory && (
                 <div className="w-full bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 mt-4 text-left animate-in slide-in-from-top-4">
                     <h3 className="font-bold text-gray-800 dark:text-white mb-4">Histórico de Aprendizado</h3>
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
