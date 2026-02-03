import React from 'react';

export function Library() {
    return (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 min-h-[500px]">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Minha Biblioteca</h1>
            <div className="flex gap-4 border-b border-gray-200 mb-6">
                <button className="px-4 py-2 text-blue-600 border-b-2 border-blue-600 font-medium">Histórico</button>
                <button className="px-4 py-2 text-gray-600 hover:text-gray-800">Soluções Salvas</button>
                <button className="px-4 py-2 text-gray-600 hover:text-gray-800">Meus Cartões</button>
                <button className="px-4 py-2 text-gray-600 hover:text-gray-800">Exercícios Salvos</button>
                <button className="px-4 py-2 text-gray-600 hover:text-gray-800">Relatórios</button>
            </div>
            
            <div className="p-10 text-center text-gray-500 bg-gray-50 rounded-lg">
                <p>Nenhum item encontrado na biblioteca.</p>
            </div>
        </div>
    );
}
