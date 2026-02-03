import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">ScientiaGen Remastered</h1>
            <p className="text-gray-600 mb-6">
                Bem-vindo à nova versão do ScientiaGen, agora com React, Vite e Tailwind CSS!
            </p>
            <div className="flex flex-col gap-4">
                <button 
                    onClick={() => setCount((c) => c + 1)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                    Contador: {count}
                </button>
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded border border-yellow-200 text-sm">
                    <strong>Status da Migração:</strong>
                    <ul className="list-disc ml-5 mt-2">
                        <li>Estrutura de pastas criada (src/)</li>
                        <li>Configuração do Vite e React pronta</li>
                        <li>Tailwind v3 integrado</li>
                        <li>Firebase Client inicializado</li>
                        <li>Código legado preservado em <code>src/legacy/LegacyApp.tsx</code></li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
  );
}

export default App;
