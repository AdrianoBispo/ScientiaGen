import React from 'react';

export function Guided() {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold text-gray-800">Aprendizagem Guiada</h1>
            <p className="text-gray-600">Envie um problema ou dúvida e receba uma explicação passo a passo.</p>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 min-h-[500px]">
                 <div className="mb-6">
                     <label className="block text-gray-700 font-medium mb-2">Qual seu problema de estudo?</label>
                     <textarea 
                        className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        placeholder="Cole uma questão, descreva um tópico ou envie uma imagem..."
                     ></textarea>
                 </div>
                 <div className="flex justify-end gap-3">
                     <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2">
                         📷 Câmera
                     </button>
                     <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2">
                         📁 Arquivo
                     </button>
                     <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                         Resolver
                     </button>
                 </div>
            </div>
        </div>
    );
}
