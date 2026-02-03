import React, { useState } from 'react';
import { Quiz } from '../components/Quiz';
import { generateLearnQuestions, checkAnswer, QuizQuestion, QuestionType } from '../services/ai';
import { ArrowLeft } from 'lucide-react';

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
                setScore(prev => prev + 1);
            }
        } catch (err) {
            console.error(err);
             setFeedback({
                isCorrect: false,
                text: "Erro ao avaliar resposta."
            });
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleNext = () => {
        setFeedback(null);
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setQuizFinished(true);
        }
    };
    
    const handleSkip = () => {
         setFeedback({
             isCorrect: false,
             text: `Pulada. A resposta sugerida era: ${questions[currentQuestionIndex].answer}`
         });
    };

    const restartQuiz = () => {
        setTopic('');
        setQuestions([]);
        setQuizStarted(false);
        setQuizFinished(false);
        setFeedback(null);
        setScore(0);
    };

    if (quizFinished) {
         return (
             <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800">Resultado do Quiz</h1>
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
                    <p className="text-xl mb-4">Você acertou {score} de {questions.length} questões!</p>
                    <button 
                        onClick={restartQuiz}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-8 rounded-lg transition-colors"
                    >
                        Novo Quiz
                    </button>
                </div>
             </div>
         );
    }

    if (quizStarted) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                     <button onClick={restartQuiz} className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
                        <ArrowLeft size={20} /> Voltar
                     </button>
                     <h1 className="text-2xl font-bold text-gray-800">Modo Aprender: {topic}</h1>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
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
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800">Modo Aprender</h1>
            <p className="text-gray-600">Responda às perguntas e receba feedback instantâneo da IA.</p>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col gap-4">
                    <label className="text-sm font-medium text-gray-700">Sobre o que você quer aprender?</label>
                    <textarea 
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                        rows={3}
                        placeholder="Ex: Revolução Francesa, Física Quântica, Verbos em Inglês..."
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        disabled={isLoading}
                    />
                    
                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button 
                        onClick={handleStartQuiz}
                        disabled={!topic.trim() || isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors shadow-sm disabled:opacity-50 mt-2 flex justify-center items-center"
                    >
                        {isLoading ? 'Gerando Perguntas...' : 'Começar a Aprender'}
                    </button>
                </div>
            </div>
        </div>
    );
}
