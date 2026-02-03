import React, { useState } from 'react';
import { generateMixedQuiz, checkAnswer, MistoQuestion, QuestionType } from '../services/ai';

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

    const nextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setFeedback(null);
            setUserAnswer('');
        } else {
            setCurrentStep('results');
        }
    };

    const resetQuiz = () => {
        setQuestions([]);
        setCurrentStep('setup');
        setTopic('');
        setFeedback(null);
        setUserAnswer('');
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto p-4">
            <h1 className="text-2xl font-bold text-gray-800">Modo Misto</h1>
            <p className="text-gray-600">Um mix desafiador de perguntas de múltipla escolha, preenchimento e abertas.</p>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
                {currentStep === 'setup' && (
                    <div className="flex flex-col gap-4 items-center justify-center h-full">
                        <h2 className="text-xl font-semibold text-gray-700">Sobre o que você quer praticar hoje?</h2>
                        <textarea
                            className="w-full max-w-md p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            rows={3}
                            placeholder="Ex: Revolução Francesa, Biologia Celular, React Hooks..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                        <button
                            onClick={startQuiz}
                            disabled={isLoading || !topic.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Gerando Quiz...' : 'Iniciar Quiz'}
                        </button>
                    </div>
                )}

                {currentStep === 'quiz' && questions.length > 0 && (
                    <div className="flex flex-col gap-6">
                        <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                            <span>Questão {currentIndex + 1} de {questions.length}</span>
                            <span>Score: {score}</span>
                        </div>

                        <div className="text-lg font-medium text-gray-800">
                            {questions[currentIndex].question}
                        </div>

                        <div className="flex flex-col gap-4">
                            {questions[currentIndex].type === QuestionType.MULTIPLE_CHOICE && (
                                <div className="grid grid-cols-1 gap-3">
                                    {questions[currentIndex].options?.map((option, idx) => (
                                        <label key={idx} className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${userAnswer === option ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'} ${feedback ? 'pointer-events-none opacity-80' : ''}`}>
                                            <input
                                                type="radio"
                                                name="quiz-option"
                                                value={option}
                                                checked={userAnswer === option}
                                                onChange={(e) => setUserAnswer(e.target.value)}
                                                className="w-4 h-4 text-blue-600"
                                                disabled={!!feedback}
                                            />
                                            <span>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {questions[currentIndex].type === QuestionType.FILL_IN_BLANK && (
                                <input
                                    type="text"
                                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Digite a resposta que completa a frase..."
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    disabled={!!feedback}
                                />
                            )}

                            {questions[currentIndex].type === QuestionType.OPEN_ENDED && (
                                <textarea
                                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    rows={4}
                                    placeholder="Digite sua resposta..."
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    disabled={!!feedback}
                                />
                            )}
                        </div>

                        {feedback && (
                            <div className={`p-4 rounded-lg ${feedback.isCorrect ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                                <p className="font-bold mb-1">{feedback.isCorrect ? 'Correto!' : 'Incorreto'}</p>
                                <p>{feedback.feedback}</p>
                            </div>
                        )}

                        <div className="flex justify-end mt-4">
                            {!feedback ? (
                                <button
                                    onClick={handleCheckAnswer}
                                    disabled={!userAnswer || isChecking}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-8 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {isChecking ? 'Verificando...' : 'Responder'}
                                </button>
                            ) : (
                                <button
                                    onClick={nextQuestion}
                                    className="bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-8 rounded-lg transition-colors shadow-sm"
                                >
                                    {currentIndex < questions.length - 1 ? 'Próxima Questão' : 'Ver Resultados'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {currentStep === 'results' && (
                    <div className="flex flex-col items-center justify-center gap-6 text-center h-full py-10">
                        <div className="text-6xl mb-4">
                            {score / questions.length > 0.7 ? '🏆' : '📚'}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Quiz Finalizado!</h2>
                        <div className="text-lg text-gray-600">
                            Você acertou <span className="font-bold text-blue-600">{score}</span> de <span className="font-bold text-gray-800">{questions.length}</span> questões.
                        </div>
                        <button
                            onClick={resetQuiz}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors shadow-sm mt-4"
                        >
                            Praticar Novamente
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
