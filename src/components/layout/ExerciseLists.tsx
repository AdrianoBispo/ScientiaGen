import React, { useState } from 'react';
import { Play, Edit, Trash2, History, FolderOpen, Calendar, MoreVertical, X, Eye } from 'lucide-react';

// Função para calcular tempo relativo
function getRelativeTime(dateString: string | Date): string {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
        return diffInSeconds === 1 ? 'Criado há 1 segundo' : `Criado há ${diffInSeconds} segundos`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return diffInMinutes === 1 ? 'Criado há 1 minuto' : `Criado há ${diffInMinutes} minutos`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return diffInHours === 1 ? 'Criado há 1 hora' : `Criado há ${diffInHours} horas`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return diffInDays === 1 ? 'Criado há 1 dia' : `Criado há ${diffInDays} dias`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return diffInMonths === 1 ? 'Criado há 1 mês' : `Criado há ${diffInMonths} meses`;
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return diffInYears === 1 ? 'Criado há 1 ano' : `Criado há ${diffInYears} anos`;
}

interface SharedListProps<T_Saved, T_History> {
    savedItems: T_Saved[];
    historyItems: T_History[];
    onPlaySaved: (item: T_Saved) => void;
    onEditSaved: (item: T_Saved) => void;
    onDeleteSaved: (id: string) => void;
    onDeleteHistory: (id: string) => void;
    
    // Optional standard mappers if T_Saved/T_History don't allow direct property access
    getSavedTitle?: (item: T_Saved) => string;
    getSavedSubtitle?: (item: T_Saved) => string;
    getSavedId?: (item: T_Saved) => string;
    getSavedDate?: (item: T_Saved) => string;
    
    getHistoryTitle?: (item: T_History) => string;
    getHistorySubtitle?: (item: T_History) => string;
    getHistoryId?: (item: T_History) => string;
    getHistoryDate?: (item: T_History) => string;
    getHistoryScore?: (item: T_History) => string | number; // Optional score display
    
    savedTabLabel?: string;
    historyTabLabel?: string;
}

export function ExerciseLists<T_Saved extends { id: string }, T_History extends { id: string }>({
    savedItems,
    historyItems,
    onPlaySaved,
    onEditSaved,
    onDeleteSaved,
    onDeleteHistory,
    getSavedTitle = (item: any) => item.title || item.topic,
    getSavedSubtitle = (item: any) => {
        const count = item.cards?.length || item.questions?.length || 0;
        const type = item.cards ? 'cartões' : 'questões';
        return count > 0 ? `${count} ${type}` : '';
    },
    getSavedId = (item) => item.id,
    getSavedDate = (item: any) => item.createdAt || item.date || new Date().toISOString(),
    getHistoryTitle = (item: any) => item.topic || item.title,
    getHistorySubtitle = (item: any) => {
        const score = item.score !== undefined && item.total !== undefined ? `Pontuação: ${item.score}/${item.total}` : '';
        return score;
    },
    getHistoryId = (item) => item.id,
    getHistoryDate = (item: any) => item.date || new Date().toISOString(),
    getHistoryScore = (item: any) => item.score !== undefined ? `${item.score}/${item.total}` : '',
    savedTabLabel = 'Exercícios Salvos',
    historyTabLabel = 'Histórico'
}: SharedListProps<T_Saved, T_History>) {
    const [activeTab, setActiveTab] = useState<'saved' | 'history'>('saved');
    const [showActionsModal, setShowActionsModal] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<T_Saved | null>(null);

    const handleOpenActionsModal = (item: T_Saved) => {
        setSelectedItem(item);
        setShowActionsModal(getSavedId(item));
    };

    const handleCloseActionsModal = () => {
        setShowActionsModal(null);
        setSelectedItem(null);
    };

    return (
        <div className="w-full mt-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            {/* Tabs Header */}
            <div className="flex border-b border-gray-200 dark:border-slate-700">
                <button
                    onClick={() => setActiveTab('saved')}
                    className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2
                        ${activeTab === 'saved' 
                            ? 'bg-blue-50 dark:bg-slate-700/50 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                            : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/30'
                        }`}
                >
                    <FolderOpen size={18} />
                    {savedTabLabel} ({savedItems.length})
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2
                        ${activeTab === 'history' 
                            ? 'bg-purple-50 dark:bg-slate-700/50 text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400' 
                            : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/30'
                        }`}
                >
                    <History size={18} />
                    {historyTabLabel} ({historyItems.length})
                </button>
            </div>

            {/* List Content */}
            <div className="max-h-[500px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {activeTab === 'saved' ? (
                    savedItems.length > 0 ? (
                        savedItems.map((item) => (
                            <div 
                                key={getSavedId(item)} 
                                className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600 transition-all cursor-pointer"
                                onClick={() => handleOpenActionsModal(item)}
                            >
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800 dark:text-white mb-1">{getSavedTitle(item)}</h4>
                                    <p className="text-xs text-gray-500 flex items-center gap-2">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {getSavedSubtitle(item)}
                                        </span>
                                        <span className="text-gray-400">•</span>
                                        <span>{getRelativeTime(getSavedDate(item))}</span>
                                    </p>
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenActionsModal(item);
                                    }}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition"
                                >
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-400">
                            <FolderOpen size={48} className="mx-auto mb-3 opacity-20" />
                            <p>Nenhum exercício salvo ainda.</p>
                        </div>
                    )
                ) : (
                    historyItems.length > 0 ? (
                        historyItems.map((item) => (
                            <div key={getHistoryId(item)} className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700">
                                <div>
                                    <h4 className="font-semibold text-gray-800 dark:text-white mb-1">{getHistoryTitle(item)}</h4>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span>{getRelativeTime(getHistoryDate(item))}</span>
                                        {getHistorySubtitle(item) && (
                                            <>
                                                <span className="text-gray-400">•</span>
                                                <span className="font-medium bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                                    {getHistorySubtitle(item)}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        if(window.confirm('Excluir este item do histórico?')) {
                                            onDeleteHistory(getHistoryId(item));
                                        }
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-400">
                            <History size={48} className="mx-auto mb-3 opacity-20" />
                            <p>Histórico vazio.</p>
                        </div>
                    )
                )}
            </div>

            {/* Actions Modal */}
            {showActionsModal && selectedItem && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]" 
                    onClick={handleCloseActionsModal}
                >
                    <div 
                        className="bg-white dark:bg-slate-800 w-80 rounded-2xl shadow-xl overflow-hidden animate-fade-in" 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                            <h4 className="font-bold text-gray-800 dark:text-white truncate pr-4">
                                {getSavedTitle(selectedItem)}
                            </h4>
                            <button 
                                onClick={handleCloseActionsModal} 
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-2">
                            <button 
                                className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 text-gray-700 dark:text-gray-200 transition"
                                onClick={() => {
                                    onPlaySaved(selectedItem);
                                    handleCloseActionsModal();
                                }}
                            >
                                <Eye size={20} className="text-blue-500" /> 
                                <span className="font-medium">Exibir</span>
                            </button>
                            <button 
                                className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 text-gray-700 dark:text-gray-200 transition"
                                onClick={() => {
                                    onEditSaved(selectedItem);
                                    handleCloseActionsModal();
                                }}
                            >
                                <Edit size={20} className="text-orange-500" />
                                <span className="font-medium">Editar</span>
                            </button>
                            <button 
                                className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3 text-red-600 transition"
                                onClick={() => {
                                    if(window.confirm('Tem certeza que deseja excluir?')) {
                                        onDeleteSaved(getSavedId(selectedItem));
                                        handleCloseActionsModal();
                                    }
                                }}
                            >
                                <Trash2 size={20} />
                                <span className="font-medium">Excluir</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
