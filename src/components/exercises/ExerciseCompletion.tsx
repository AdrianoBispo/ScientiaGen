import React from 'react';
import { RefreshCw, Save, Home, Trophy, Star, Clock } from 'lucide-react';

interface ExerciseCompletionProps {
  score: number;
  total: number;
  onPlayAgain: () => void;
  onSave?: () => void;
  onExit: () => void;
  isSaved?: boolean;
  timeTaken?: number; // elapsed time in seconds
}

export function ExerciseCompletion({
  score,
  total,
  onPlayAgain,
  onSave,
  onExit,
  isSaved = false,
  timeTaken
}: ExerciseCompletionProps) {
  const percentage = Math.round((score / total) * 100);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${secs}s`;
  };
  
  let message = "Bom esforço!";
  let colorClass = "text-yellow-500";
  
  if (percentage >= 90) {
    message = "Excelente!";
    colorClass = "text-yellow-500";
  } else if (percentage >= 70) {
    message = "Muito bem!";
    colorClass = "text-green-500";
  } else if (percentage < 50) {
    message = "Continue praticando!";
    colorClass = "text-blue-500";
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 animate-in zoom-in duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 p-8 text-center">
        
        <div className="mb-6 relative inline-block">
          <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
            <Trophy className={`w-12 h-12 ${colorClass}`} />
          </div>
          {percentage >= 90 && (
             <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 p-2 rounded-full shadow-lg animate-bounce">
               <Star className="w-5 h-5 fill-current" />
             </div>
          )}
        </div>

        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{message}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
          Você acertou <span className="font-bold text-gray-900 dark:text-white">{score}</span> de <span className="font-bold text-gray-900 dark:text-white">{total}</span>
        </p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 mb-8 overflow-hidden">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Time Taken */}
        {timeTaken !== undefined && (
          <div className="flex items-center justify-center gap-2 mb-8 text-gray-500 dark:text-gray-400">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Tempo: {formatTime(timeTaken)}</span>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={onPlayAgain}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-sm"
          >
            <RefreshCw className="w-5 h-5" />
            Jogar Novamente
          </button>
          
          {onSave && (
            <button
              onClick={onSave}
              disabled={isSaved}
              className={`w-full flex items-center justify-center gap-2 font-semibold py-3 px-6 rounded-lg transition-colors border-2 ${
                isSaved 
                ? 'bg-gray-100 dark:bg-slate-700 border-transparent text-gray-400 cursor-not-allowed' 
                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <Save className="w-5 h-5" />
              {isSaved ? 'Salvo' : 'Salvar Resultado'}
            </button>
          )}

          <button
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white py-2"
          >
            <Home className="w-4 h-4" />
            Voltar ao Menu
          </button>
        </div>
      </div>
    </div>
  );
}