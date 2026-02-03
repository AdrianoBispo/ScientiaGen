import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';

interface CardProps {
  term: string;
  definition: string;
}

export function Card({ term, definition }: CardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

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
      className={`flashcard ${isFlipped ? 'flipped' : ''}`} 
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className="flashcard-inner">
        <div className="flashcard-front">
            <div className="term">
                <div className="speech-text-wrapper">
                   <div className="text-to-speak">{term}</div>
                   <button 
                      className="speech-btn" 
                      onClick={(e) => handleSpeech(e, term)}
                      title="Ouvir termo"
                   >
                     <Volume2 size={24} />
                   </button>
                </div>
            </div>
        </div>
        <div className="flashcard-back">
            <div className="definition">
                <div className="speech-text-wrapper">
                   <div className="text-to-speak">{definition}</div>
                   <button 
                      className="speech-btn" 
                      onClick={(e) => handleSpeech(e, definition)}
                      title="Ouvir definição"
                   >
                     <Volume2 size={24} />
                   </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
