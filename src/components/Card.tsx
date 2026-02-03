import React, { useState } from 'react';

interface CardProps {
  term: string;
  definition: string;
}

const SpeechIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
);

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
                     <SpeechIcon />
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
                     <SpeechIcon />
                   </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
