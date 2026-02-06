import React from 'react';
import { X, CheckCircle, XCircle, Trophy, Clock, Target, Calendar, Layers } from 'lucide-react';

export interface QuestionResult {
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
}

interface HistoryReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    date: string;
    score?: number;
    total?: number;
    timeTaken?: number;
    // Match-specific
    pairs?: number;
    completed?: boolean;
    // Detailed question results
    questionResults?: QuestionResult[];
}

function formatTimestamp(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getPerformanceInfo(percentage: number) {
    if (percentage >= 90) return { emoji: '🏆', message: 'Excelente!', color: 'text-yellow-600 dark:text-yellow-400' };
    if (percentage >= 70) return { emoji: '🎉', message: 'Muito bem!', color: 'text-green-600 dark:text-green-400' };
    if (percentage >= 50) return { emoji: '👍', message: 'Bom trabalho!', color: 'text-blue-600 dark:text-blue-400' };
    return { emoji: '💪', message: 'Continue praticando!', color: 'text-orange-600 dark:text-orange-400' };
}

export function HistoryReportModal({
    isOpen,
    onClose,
    title,
    date,
    score,
    total,
    timeTaken,
    pairs,
    completed,
    questionResults
}: HistoryReportModalProps) {
    if (!isOpen) return null;

    const percentage = score !== undefined && total ? Math.round((score / total) * 100) : null;
    const performance = percentage !== null ? getPerformanceInfo(percentage) : null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-slate-800 w-full max-w-lg max-h-[85vh] rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">{title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                            <Calendar size={12} />
                            {formatTimestamp(date)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    {/* Score Summary */}
                    {percentage !== null && performance && (
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700">
                            <div className="text-center mb-4">
                                <span className="text-4xl">{performance.emoji}</span>
                                <p className={`text-lg font-bold mt-1 ${performance.color}`}>{performance.message}</p>
                            </div>

                            <div className="flex items-center justify-center gap-6">
                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <Target size={18} className="text-blue-500" />
                                    <span className="text-sm font-medium">{score}/{total}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <Trophy size={18} className="text-yellow-500" />
                                    <span className="text-sm font-medium">{percentage}%</span>
                                </div>
                                {timeTaken !== undefined && (
                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                        <Clock size={18} className="text-purple-500" />
                                        <span className="text-sm font-medium">{formatTime(timeTaken)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-4 h-2.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${
                                        percentage >= 70 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Match-specific info */}
                    {pairs !== undefined && (
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700">
                            <div className="text-center mb-3">
                                <span className="text-4xl">{completed ? '🏆' : '⏱️'}</span>
                                <p className={`text-lg font-bold mt-1 ${completed ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                    {completed ? 'Completado!' : 'Tempo esgotado'}
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-6">
                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                    <Layers size={18} className="text-blue-500" />
                                    <span className="text-sm font-medium">{pairs} pares</span>
                                </div>
                                {timeTaken !== undefined && (
                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                        <Clock size={18} className="text-purple-500" />
                                        <span className="text-sm font-medium">{formatTime(timeTaken)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Question Results */}
                    {questionResults && questionResults.length > 0 && (
                        <div className="px-6 py-4">
                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                Detalhes por questão
                            </h4>
                            <div className="space-y-3">
                                {questionResults.map((result, index) => (
                                    <div
                                        key={index}
                                        className={`p-3 rounded-xl border ${
                                            result.isCorrect
                                                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30'
                                                : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30'
                                        }`}
                                    >
                                        <div className="flex items-start gap-2.5">
                                            <div className="mt-0.5 shrink-0">
                                                {result.isCorrect ? (
                                                    <CheckCircle size={18} className="text-green-500" />
                                                ) : (
                                                    <XCircle size={18} className="text-red-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 dark:text-white mb-1.5">
                                                    {index + 1}. {result.question}
                                                </p>
                                                <div className="space-y-1">
                                                    <p className={`text-xs ${result.isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                                        <span className="font-medium">Sua resposta:</span>{' '}
                                                        {result.userAnswer || <span className="italic text-gray-400">Não respondida</span>}
                                                    </p>
                                                    {!result.isCorrect && (
                                                        <p className="text-xs text-green-700 dark:text-green-400">
                                                            <span className="font-medium">Resposta correta:</span>{' '}
                                                            {result.correctAnswer}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Fallback if no detailed results */}
                    {(!questionResults || questionResults.length === 0) && percentage === null && pairs === undefined && (
                        <div className="px-6 py-8 text-center text-gray-400">
                            <p>Nenhum detalhe disponível para este registro.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
