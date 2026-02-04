import React, { useState } from 'react';
import { generateTestQuestions, TestQuestion } from '../services/ai';
import { Loader2, CheckCircle2, XCircle, ChevronRight, RefreshCw, BookOpen } from 'lucide-react';

export function TestMode() {
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [questions, setQuestions] = useState<TestQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isChecked, setIsChecked] = useState(false);
    const [score, setScore] = useState(0);
    const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'finished'>('idle');

    const handleStartGame = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setIsLoading(true);
        try {
            const generatedQuestions = await generateTestQuestions(topic);
            setQuestions(generatedQuestions);
            setGameStatus('playing');
            setCurrentQuestionIndex(0);
            setScore(0);
            resetQuestionState();
        } catch (error) {
            console.error(error);
            // Optionally add toast/error handling here
        } finally {
            setIsLoading(false);
        }
    };

    const resetQuestionState = () => {
        setSelectedOption(null);
        setIsChecked(false);
    };

    const handleOptionSelect = (option: string) => {
        if (!isChecked) {
            setSelectedOption(option);
        }
    };

    const handleCheckAnswer = () => {
        if (!selectedOption) return;

        setIsChecked(true);
        if (selectedOption === questions[currentQuestionIndex].correctAnswer) {
            setScore(prev => prev + 1);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            resetQuestionState();
        } else {
            setGameStatus('finished');
        }
    };

    const handleRestart = () => {
        setGameStatus('idle');
        setTopic('');
        setQuestions([]);
        setScore(0);
    };

    const renderStartScreen = () => (
        <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-xl mx-auto px-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-6">
                <BookOpen size={48} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 text-center">Testes</h1>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
                Teste seus conhecimentos sobre qualquer assunto. O Gemini criará perguntas de múltipla escolha para você praticar.
            </p>

            <form onSubmit={handleStartGame} className="w-full">
                <div className="relative">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Sobre o que você quer ser testado? (ex: História do Brasil, Física Quântica...)"
                        className="w-full p-4 pr-12 text-lg border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        disabled={isLoading}
                    />
                </div>
                
                <button
                    type="submit"
                    disabled={!topic.trim() || isLoading}
                    className="mt-6 w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin" />
                            Gerando Teste...
                        </>
                    ) : (
                        'Iniciar Teste'
                    )}
                </button>
            </form>
        </div>
    );

    const renderGameScreen = () => {
        const currentCheckQuestion = questions[currentQuestionIndex];
        const isCorrect = selectedOption === currentCheckQuestion.correctAnswer;

        return (
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Header / Progress */}
                <div className="flex justify-between items-center mb-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <button onClick={handleRestart} className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                        Cancelar
                    </button>
                    <span>Questão {currentQuestionIndex + 1} de {questions.length}</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-slate-700 h-2 rounded-full mb-8 overflow-hidden">
                    <div 
                        className="bg-blue-600 h-full transition-all duration-300 ease-out"
                        style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    />
                </div>

                {/* Question */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                        {currentCheckQuestion.question}
                    </h2>
                </div>

                {/* Options */}
                <div className="space-y-3 mb-8">
                    {currentCheckQuestion.options.map((option, idx) => {
                        let optionClass = "w-full p-4 text-left rounded-xl border-2 transition-all duration-200 flex items-center justify-between group ";
                        
                        if (isChecked) {
                            if (option === currentCheckQuestion.correctAnswer) {
                                optionClass += "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300";
                            } else if (option === selectedOption) {
                                optionClass += "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";
                            } else {
                                optionClass += "border-gray-200 dark:border-slate-700 opacity-50";
                            }
                        } else {
                            if (selectedOption === option) {
                                optionClass += "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300";
                            } else {
                                optionClass += "border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300";
                            }
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleOptionSelect(option)}
                                disabled={isChecked}
                                className={optionClass}
                            >
                                <span className="font-medium">{option}</span>
                                {isChecked && option === currentCheckQuestion.correctAnswer && (
                                    <CheckCircle2 className="text-green-500" size={20} />
                                )}
                                {isChecked && option === selectedOption && option !== currentCheckQuestion.correctAnswer && (
                                    <XCircle className="text-red-500" size={20} />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Explanation Area */}
                {isChecked && (
                    <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className={`p-4 rounded-xl border ${isCorrect ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'}`}>
                            <p className="font-bold text-gray-900 dark:text-white mb-1">
                                {isCorrect ? 'Excelente!' : 'Resposta Correta:'}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                {currentCheckQuestion.explanation || "Continue assim!"}
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex justify-end pt-4">
                    {!isChecked ? (
                        <button
                            onClick={handleCheckAnswer}
                            disabled={!selectedOption}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-md transition-all flex items-center gap-2"
                        >
                            Verificar
                        </button>
                    ) : (
                        <button
                            onClick={handleNextQuestion}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-all flex items-center gap-2 animate-pulse-once"
                        >
                            {currentQuestionIndex < questions.length - 1 ? (
                                <>Próxima <ChevronRight size={20} /></>
                            ) : (
                                <>Ver Resultado <CheckCircle2 size={20} /></>
                            )}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const renderResultScreen = () => {
        const percentage = Math.round((score / questions.length) * 100);
        
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-xl mx-auto px-4 animate-in zoom-in-95 duration-300">
                <div className="mb-8 text-center">
                    <span className="text-6xl mb-4 block">
                        {percentage >= 80 ? '🏆' : percentage >= 50 ? '👏' : '📚'}
                    </span>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Teste Finalizado!</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Você acertou <strong className="text-blue-600 dark:text-blue-400">{score}</strong> de {questions.length} questões.
                    </p>
                </div>

                <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-2xl p-8 mb-8 flex flex-col items-center">
                    <div className="relative size-32 mb-4">
                         {/* Simple Circle Progress visualization */}
                         <svg className="size-full" viewBox="0 0 36 36">
                            <path
                                className="text-gray-200 dark:text-slate-700"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                            />
                            <path
                                className={`${percentage >= 80 ? 'text-green-500' : percentage >= 50 ? 'text-blue-500' : 'text-orange-500'}`}
                                strokeDasharray={`${percentage}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-3xl font-bold text-gray-900 dark:text-white">{percentage}%</span>
                        </div>
                    </div>
                    <p className="text-center font-medium text-gray-700 dark:text-gray-300">
                        {percentage >= 80 ? 'Excelente desempenho!' : percentage >= 50 ? 'Bom trabalho!' : 'Continue estudando!'}
                    </p>
                </div>

                <button
                    onClick={handleRestart}
                    className="w-full py-4 bg-gray-900 dark:bg-slate-700 hover:bg-gray-800 dark:hover:bg-slate-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                    <RefreshCw size={20} />
                    Novo Teste
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-transparent">
            {gameStatus === 'idle' && renderStartScreen()}
            {gameStatus === 'playing' && renderGameScreen()}
            {gameStatus === 'finished' && renderResultScreen()}
        </div>
    );
}
