import React from 'react';
import { BarChart, Clock, Award, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Statistics() {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
                <BarChart size={64} className="text-gray-300 dark:text-gray-600" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Acesso Restrito</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                    Você precisa estar logado para visualizar suas estatísticas de progresso.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <BarChart className="text-blue-600" />
                    Estatísticas de Progresso
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Acompanhe sua evolução e desempenho nos exercícios.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Exercícios Resolvidos" 
                    value="0" 
                    icon={<Target size={24} />}
                    color="text-blue-600 bg-blue-100 dark:bg-blue-900/30"
                />
                <StatCard 
                    title="Tempo de Estudo" 
                    value="0h" 
                    icon={<Clock size={24} />}
                    color="text-green-600 bg-green-100 dark:bg-green-900/30"
                />
                <StatCard 
                    title="Precisão Média" 
                    value="0%" 
                    icon={<Award size={24} />}
                    color="text-purple-600 bg-purple-100 dark:bg-purple-900/30"
                />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">
                    Seus relatórios de evolução aparecerão aqui conforme você resolve exercícios.
                </p>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{value}</h3>
            </div>
        </div>
    );
}
