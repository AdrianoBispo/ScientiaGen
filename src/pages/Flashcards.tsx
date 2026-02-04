import React, { useState } from 'react';
import { Card } from '../components/Card';
import { generateFlashcards, FlashcardData } from '../services/ai';
import { Plus, Brain, LayoutGrid, Loader2 } from 'lucide-react';

export function Flashcards() {
  const [cards, setCards] = useState<FlashcardData[]>([
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
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Cartões de Estudo</h1>
            <p className="text-gray-600 dark:text-gray-300">Crie, gere e estude seus flashcards para melhorar seu aprendizado.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 flex-wrap justify-center w-full">
            <button 
                onClick={() => setMode('study')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm ${mode === 'study' ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'}`}
            >
                <LayoutGrid size={20} />
                Estudar ({cards.length})
            </button>
            <button 
                onClick={() => setMode('manual')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm ${mode === 'manual' ? 'bg-green-600 text-white ring-2 ring-green-600 ring-offset-2' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'}`}
            >
                <Plus size={20} />
                Criar Manualmente
            </button>
            <button 
                onClick={() => setMode('ai')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm ${mode === 'ai' ? 'bg-purple-600 text-white ring-2 ring-purple-600 ring-offset-2' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'}`}
            >
                <Brain size={20} />
                Gerar com IA
            </button>
        </div>

        {/* Content Area */}
        <div className="w-full flex-1 min-h-[400px]">
            {mode === 'manual' && (
                <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
                        <Plus className="text-green-500" /> Novo Card
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Termo / Pergunta</label>
                            <input 
                                value={manualTerm}
                                onChange={(e) => setManualTerm(e.target.value)}
                                className="w-full p-3 border dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-green-500 outline-none transition-all" 
                                placeholder="Ex: React"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Definição / Resposta</label>
                            <textarea 
                                value={manualDef}
                                onChange={(e) => setManualDef(e.target.value)}
                                className="w-full p-3 border dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-green-500 outline-none transition-all min-h-[120px]" 
                                placeholder="Ex: Biblioteca JavaScript para construir interfaces..."
                            />
                        </div>
                        <button 
                            onClick={handleManualAdd}
                            disabled={!manualTerm || !manualDef}
                            className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Adicionar Card
                        </button>
                    </div>
                </div>
            )}

            {mode === 'ai' && (
                <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
                        <Brain className="text-purple-500" /> Gerar com IA
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Tópico de Estudo</label>
                            <input 
                                value={aiTopic}
                                onChange={(e) => setAiTopic(e.target.value)}
                                className="w-full p-3 border dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all" 
                                placeholder="Ex: História do Brasil, Biologia Celular, React Hooks..."
                                autoFocus
                            />
                        </div>
                        <div>
                             <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Quantidade de Cards: {aiCount}</label>
                             <input 
                                type="range"
                                min="1"
                                max="100"
                                value={aiCount}
                                onChange={(e) => setAiCount(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                             />
                        </div>
                        <button 
                            onClick={handleAiGenerate}
                            disabled={!aiTopic || isGenerating}
                            className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="animate-spin" /> Gerando...
                                </>
                            ) : (
                                'Gerar Flashcards'
                            )}
                        </button>
                    </div>
                </div>
            )}

            {mode === 'study' && (
                <div className="flex flex-col items-center justify-center h-full gap-8 py-10">
                    {cards.length > 0 ? (
                        <>
                           <div className="relative group perspective-1000">
                                <Card term={cards[0].term} definition={cards[0].definition} />
                                {/* Stack effect cards behind */}
                                <div className="absolute top-2 left-2 w-full h-full bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl -z-10 shadow-sm transform rotate-1 scale-[0.98] transition-all"></div>
                                <div className="absolute top-4 left-4 w-full h-full bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl -z-20 shadow-sm transform rotate-2 scale-[0.96] transition-all"></div>
                           </div>
                           
                           <div className="flex gap-4">
                                <button 
                                    className="p-4 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition shadow-sm"
                                    onClick={() => {
                                        // Logic to move card to end or discard
                                        const [first, ...rest] = cards;
                                        setCards([...rest, first]);
                                    }}
                                >
                                    Difícil
                                </button>
                                <button 
                                    className="p-4 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition shadow-sm"
                                    onClick={() => {
                                        // Logic to remove card (mastered)
                                         const [first, ...rest] = cards;
                                         setCards([...rest, first]); // For demo, just cycling
                                    }}
                                >
                                    Fácil
                                </button>
                           </div>
                           <p className="text-gray-500 dark:text-gray-400 text-sm">Clique no cartão para ver a resposta</p>
                        </>
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400">
                            Nenhum cartão para estudar. Crie novos ou gere com IA!
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
}
