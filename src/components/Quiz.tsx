import React, { useState } from 'react';

export function Quiz() {
    const [answer, setAnswer] = useState('');

    return (
        <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto p-4">
             {/* Learn Header */}
             <div id="learnHeader" className="flex justify-between w-full mb-5 text-lg font-medium">
                 <div id="learnTimer" className="text-gray-700">00:00</div>
                 <div id="learnProgress" className="text-gray-700">1 / 10</div>
             </div>

             {/* Question Area */}
             <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                 <p id="questionText" className="text-xl text-gray-800 mb-4 leading-relaxed">
                     Pergunta de exemplo para visualização do componente.
                 </p>
                 
                 <textarea 
                    id="learnAnswerInput" 
                    className="w-full min-h-[100px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y text-base"
                    placeholder="Digite sua resposta aqui..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                 ></textarea>
             </div>

             {/* Actions */}
             <div className="flex justify-end gap-3">
                 <button 
                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                 >
                     Pular
                 </button>
                 <button 
                    id="submitLearnAnswerBtn"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-8 rounded-lg transition-colors shadow-sm"
                 >
                     Responder
                 </button>
             </div>
             
             {/* Feedback Area */}
             <div id="learnFeedback" className="hidden mt-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
             </div>
        </div>
    );
}
