import React, { useState } from 'react';
import { Card } from '../components/Card';
import { generateFlashcards, FlashcardData } from '../services/ai';
import { Plus, Brain, LayoutGrid, Loader2 } from 'lucide-react';

export function Flashcards() {
  const [cards, setCards] = useState<FlashcardData[]>([
    { 
        term: "React Hooks", 
        definition: "Funções que permitem usar state e outros recursos do React sem escrever uma classe (ex: useState, useEffect)." 
    }
  ]);
  
  const [mode, setMode] = useState<'study' | 'manual' | 'ai'>('study');
  
  // Manual Form State
  const [manualTerm, setManualTerm] = useState('');
  const [manualDef, setManualDef] = useState('');
  
  // AI Form State
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiCount, setAiCount] = useState(5);

  const handleManualAdd = () => {
    if (manualTerm && manualDef) {
        setCards([...cards, { term: manualTerm, definition: manualDef }]);
        setManualTerm('');
        setManualDef('');
        setMode('study');
    }
  };

  const handleAiGenerate = async () => {
    if (!aiTopic) return;
    setIsGenerating(true);
    try {
        const newCards = await generateFlashcards(aiTopic, aiCount);
        setCards([...cards, ...newCards]);
        setMode('study');
    } catch (error) {
        console.error(error);
        alert("Erro ao gerar cards. Verifique o console para mais detalhes ou tente novamente.");
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 items-center p-6 w-full max-w-6xl mx-auto">
        <div className="w-full text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-800">Cartões de Estudo</h1>
            <p className="text-gray-600">Crie, gere e estude seus flashcards para melhorar seu aprendizado.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 flex-wrap justify-center w-full">
            <button 
                onClick={() => setMode('study')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm ${mode === 'study' ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
            >
                <LayoutGrid size={20} />
                Estudar ({cards.length})
            </button>
            <button 
                onClick={() => setMode('manual')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm ${mode === 'manual' ? 'bg-green-600 text-white ring-2 ring-green-600 ring-offset-2' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
            >
                <Plus size={20} />
                Criar Manualmente
            </button>
            <button 
                onClick={() => setMode('ai')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm ${mode === 'ai' ? 'bg-purple-600 text-white ring-2 ring-purple-600 ring-offset-2' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
            >
                <Brain size={20} />
                Gerar com IA
            </button>
        </div>

        {/* Content Area */}
        <div className="w-full flex-1 min-h-[400px]">
            {mode === 'manual' && (
                <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl border border-gray-200">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                        <Plus className="text-green-500" /> Novo Card
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Termo / Pergunta</label>
                            <input 
                                value={manualTerm}
                                onChange={(e) => setManualTerm(e.target.value)}
                                className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none transition-all" 
                                placeholder="Ex: React"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Definição / Resposta</label>
                            <textarea 
                                value={manualDef}
                                onChange={(e) => setManualDef(e.target.value)}
                                className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none transition-all resize-none" 
                                rows={4}
                                placeholder="Ex: Uma biblioteca para criar interfaces..."
                            />
                        </div>
                        <div className="pt-2">
                            <button 
                                onClick={handleManualAdd}
                                disabled={!manualTerm || !manualDef}
                                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-transform active:scale-[0.98]"
                            >
                                Adicionar Card
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {mode === 'ai' && (
                <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl border border-gray-200">
                     <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                        <Brain className="text-purple-500" /> Gerar com Gemini
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Sobre o que você quer estudar?</label>
                            <input 
                                value={aiTopic}
                                onChange={(e) => setAiTopic(e.target.value)}
                                className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none transition-all" 
                                placeholder="Ex: História do Brasil, Física Quântica, Verbos em Inglês..."
                                autoFocus
                            />
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">Quantidade de Cards</label>
                                <span className="font-bold text-purple-600">{aiCount} cards</span>
                            </div>
                            <input 
                                type="range"
                                min="1" max="10"
                                value={aiCount}
                                onChange={(e) => setAiCount(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>1</span>
                                <span>10</span>
                            </div>
                        </div>
                        <div className="pt-2">
                            <button 
                                onClick={handleAiGenerate}
                                disabled={isGenerating || !aiTopic}
                                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-transform active:scale-[0.98] flex justify-center items-center gap-2"
                            >
                                {isGenerating ? <Loader2 className="animate-spin" /> : <Brain size={20} />}
                                {isGenerating ? 'Gerando Conteúdo...' : 'Gerar Cards Automaticamente'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {mode === 'study' && (
                <div className="w-full">
                     {cards.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                             <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                <LayoutGrid size={40} className="text-gray-400" />
                             </div>
                            <h3 className="text-xl font-semibold text-gray-700">Nenhum card disponível</h3>
                            <p className="text-gray-500 mt-2 max-w-sm text-center">Comece criando um novo card manualmente ou deixe a IA gerar para você!</p>
                            <div className="flex gap-4 mt-6">
                                <button onClick={() => setMode('manual')} className="text-blue-600 hover:underline">Criar Manual</button>
                                <span className="text-gray-300">|</span>
                                <button onClick={() => setMode('ai')} className="text-purple-600 hover:underline">Gerar com IA</button>
                            </div>
                        </div>
                     ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center pb-10">
                            {cards.map((card, idx) => (
                                <div key={idx} className="relative group">
                                     {/* Add delete button logic here later if needed */}
                                    <Card term={card.term} definition={card.definition} />
                                </div>
                            ))}
                        </div>
                     )}
                </div>
            )}
        </div>
    </div>
  );
}
