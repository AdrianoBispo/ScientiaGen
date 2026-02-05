import React, { useState } from 'react';
import { Play, Edit, Trash2, History, Save, FolderOpen, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

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
    
    getHistoryTitle?: (item: T_History) => string;
    getHistorySubtitle?: (item: T_History) => string;
    getHistoryId?: (item: T_History) => string;
    getHistoryScore?: (item: T_History) => string | number; // Optional score display
}

export function ExerciseLists<T_Saved extends { id: string }, T_History extends { id: string }>({
    savedItems,
    historyItems,
    onPlaySaved,
    onEditSaved,
    onDeleteSaved,
    onDeleteHistory,
    getSavedTitle = (item: any) => item.title || item.topic,
    getSavedSubtitle = (item: any) => new Date(item.createdAt || item.date || Date.now()).toLocaleDateString(),
    getSavedId = (item) => item.id,
    getHistoryTitle = (item: any) => item.topic,
    getHistorySubtitle = (item: any) => new Date(item.date).toLocaleDateString(),
    getHistoryId = (item) => item.id,
    getHistoryScore = (item: any) => item.score !== undefined ? `${item.score}/${item.total}` : ''
}: SharedListProps<T_Saved, T_History>) {
    const [activeTab, setActiveTab] = useState<'saved' | 'history'>('saved');

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
                    Exercícios Salvos ({savedItems.length})
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
                    Histórico ({historyItems.length})
                </button>
            </div>

            {/* List Content */}
            <div className="max-h-[500px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {activeTab === 'saved' ? (
                    savedItems.length > 0 ? (
                        savedItems.map((item) => (
                            <div key={getSavedId(item)} className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600 transition-all">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800 dark:text-white mb-1">{getSavedTitle(item)}</h4>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {getSavedSubtitle(item)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onPlaySaved(item)}
                                        title="Jogar Novamente"
                                        className="p-2 text-green-600 bg-green-100 dark:bg-green-900/30 rounded-full hover:bg-green-200 dark:hover:bg-green-900/50 transition"
                                    >
                                        <Play size={16} />
                                    </button>
                                    <button
                                        onClick={() => onEditSaved(item)}
                                        title="Editar"
                                        className="p-2 text-blue-600 bg-blue-100 dark:bg-blue-900/30 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if(window.confirm('Tem certeza que deseja excluir?')) {
                                                onDeleteSaved(getSavedId(item));
                                            }
                                        }}
                                        title="Excluir"
                                        className="p-2 text-red-600 bg-red-100 dark:bg-red-900/30 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
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
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {getHistorySubtitle(item)}
                                        </span>
                                        {getHistoryScore(item) && (
                                            <span className="flex items-center gap-1 font-medium bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                                Pontuação: {getHistoryScore(item)}
                                            </span>
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
        </div>
    );
}
