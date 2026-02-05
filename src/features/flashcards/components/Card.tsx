import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';

interface CardProps {
  term: string;
  definition: string;
  isFlipped?: boolean;
  onFlip?: () => void;
  className?: string; // Allow passing extra classes for animations
}

export function Card({ term, definition, isFlipped: controlledFlipped, onFlip, className = '' }: CardProps) {
  const [internalFlipped, setInternalFlipped] = useState(false);

  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;

  const handleClick = () => {
    if (onFlip) {
      onFlip();
    } else {
      setInternalFlipped(!internalFlipped);
    }
  };

  const handleSpeech = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div 
      className={`flashcard ${isFlipped ? 'flipped' : ''} ${className}`} 
      onClick={handleClick}
    >
      <div className="flashcard-inner">
        <div className="flashcard-front">
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                   <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-6 select-none leading-tight">{term}</h3>
                   <button 
                      className="mt-2 p-3 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-blue-600 dark:text-gray-500 transition-colors"
                      onClick={(e) => handleSpeech(e, term)}
                      title="Ouvir termo"
                   >
                     <Volume2 size={24} />
                   </button>
            </div>
        </div>
        <div className="flashcard-back">
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                   <p className="text-lg sm:text-xl text-blue-900 dark:text-blue-100 mb-6 select-none font-medium leading-relaxed overflow-y-auto max-h-[80%] custom-scrollbar">{definition}</p>
                   <button 
                      className="mt-2 p-3 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-400 hover:text-blue-700 dark:text-blue-300 transition-colors"
                      onClick={(e) => handleSpeech(e, definition)}
                      title="Ouvir definição"
                   >
                     <Volume2 size={24} />
                   </button>
            </div>
        </div>
      </div>
    </div>
  );
}
