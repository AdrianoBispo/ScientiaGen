import React, { useState, useEffect } from 'react';

interface QuizProps {
    currentStep: number;
    totalSteps: number;
    question: string;
    onAnswer: (answer: string, timeTaken: number) => void;
    onSkip?: () => void;
    isEvaluating?: boolean;
    feedback?: { isCorrect: boolean; text: string } | null;
    onNext?: () => void;
}

export function Quiz({ 
    currentStep, 
    totalSteps, 
    question, 
    onAnswer, 
    onSkip, 
    isEvaluating, 
    feedback, 
    onNext 
}: QuizProps) {
    const [answer, setAnswer] = useState('');
    const [startTime, setStartTime] = useState<number>(Date.now());

    // Reset answer and timer when question changes
    useEffect(() => {
        setAnswer('');
        setStartTime(Date.now());
    }, [question]);

    const handleSubmit = () => {
        if (answer.trim()) {
            const timeTaken = (Date.now() - startTime) / 1000;
            onAnswer(answer, timeTaken);
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto p-4">
             {/* Learn Header */}
             <div className="flex justify-between w-full mb-5 text-lg font-medium">
                 {/* Timer placeholder */}
                 <div className="text-gray-700 dark:text-gray-300"></div> 
                 <div className="text-gray-700 dark:text-gray-300">{currentStep} / {totalSteps}</div>
             </div>

             {/* Question Area */}
             <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
                 <p className="text-xl text-gray-800 dark:text-gray-100 mb-4 leading-relaxed">
                     {question}
                 </p>
                 
                 <textarea 
                    className="w-full min-h-[100px] p-4 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y text-base"
                    placeholder="Digite sua resposta aqui..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={isEvaluating || !!feedback}
                 ></textarea>
             </div>

             {/* Feedback Area */}
             {feedback && (
                <div className={`p-4 rounded-lg border ${feedback.isCorrect ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'}`}>
                    <p className="font-bold mb-1">{feedback.isCorrect ? 'Correto!' : 'Incorreto'}</p>
                    <p className="text-gray-700 dark:text-gray-300">{feedback.text}</p>
                </div>
             )}

             {/* Actions */}
             <div className="flex justify-end gap-3">
                {!feedback ? (
                    <>
                         <button 
                            onClick={onSkip}
                            className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors"
                            disabled={isEvaluating}
                         >
                             Pular
                         </button>
                         <button 
                            onClick={handleSubmit}
                            disabled={isEvaluating || !answer.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-8 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                         >
                             {isEvaluating ? 'Verificando...' : 'Responder'}
                         </button>
                    </>
                ) : (
                    <button 
                        onClick={onNext}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-8 rounded-lg transition-colors shadow-sm"
                    >
                        Próxima
                    </button>
                )}
             </div>
        </div>
    );
}
