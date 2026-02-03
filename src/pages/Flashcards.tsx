import React from 'react';
import { Card } from '../components/Card';

export function Flashcards() {
    return (
        <div className="flex flex-col gap-6 items-center">
            <div className="w-full">
                <h1 className="text-2xl font-bold text-gray-800">Cartões de Estudo</h1>
                <p className="text-gray-600">Revise seus conceitos com flashcards.</p>
            </div>
            
            <div className="mt-8">
                <Card 
                    term="React Hooks" 
                    definition="Funções que permitem usar state e outros recursos do React sem escrever uma classe (ex: useState, useEffect)." 
                />
            </div>
            
            <div className="flex gap-4 mt-6">
                 <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 transition-colors">Anterior</button>
                 <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors">Próximo</button>
            </div>
        </div>
    );
}
