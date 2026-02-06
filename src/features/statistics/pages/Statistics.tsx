import React from 'react';
import { BarChart, Clock, Award, Target, TrendingUp, Flame, BookOpen, Zap, ChevronRight } from 'lucide-react';
import { useAuth } from '../../auth/contexts/AuthContext';
import { useStatistics, ModeStats, DailyActivity, TopicFrequency } from '../hooks/useStatistics';

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

    return <StatisticsContent />;
}

function StatisticsContent() {
    const stats = useStatistics();

    if (stats.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    const hasData = stats.totalExercises > 0;

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

            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Exercícios Resolvidos"
                    value={String(stats.totalExercises)}
                    icon={<Target size={24} />}
                    color="text-blue-600 bg-blue-100 dark:bg-blue-900/30"
                />
                <StatCard
                    title="Precisão Média"
                    value={stats.averageAccuracy > 0 ? `${stats.averageAccuracy.toFixed(1)}%` : '—'}
                    icon={<Award size={24} />}
                    color="text-purple-600 bg-purple-100 dark:bg-purple-900/30"
                />
                <StatCard
                    title="Sequência Atual"
                    value={stats.currentStreak > 0 ? `${stats.currentStreak} dia${stats.currentStreak > 1 ? 's' : ''}` : '0'}
                    subtitle={stats.longestStreak > 0 ? `Recorde: ${stats.longestStreak} dia${stats.longestStreak > 1 ? 's' : ''}` : undefined}
                    icon={<Flame size={24} />}
                    color="text-orange-600 bg-orange-100 dark:bg-orange-900/30"
                />
                <StatCard
                    title="Melhor Precisão"
                    value={stats.bestAccuracy > 0 ? `${stats.bestAccuracy.toFixed(1)}%` : '—'}
                    icon={<TrendingUp size={24} />}
                    color="text-green-600 bg-green-100 dark:bg-green-900/30"
                />
            </div>

            {!hasData ? (
                <EmptyState />
            ) : (
                <>
                    {/* Activity Chart */}
                    <ActivityChart dailyActivity={stats.dailyActivity} />

                    {/* Mode Breakdown + Top Topics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ModeBreakdown modeStats={stats.modeStats} total={stats.totalExercises} />
                        <TopTopics topics={stats.topTopics} />
                    </div>

                    {/* Per-mode details */}
                    <ModeDetailCards modeStats={stats.modeStats} />
                </>
            )}
        </div>
    );
}

// ── Sub-components ──

function StatCard({ title, value, subtitle, icon, color }: {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
}) {
    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 flex items-center gap-4 transition-transform hover:scale-[1.02]">
            <div className={`p-3 rounded-lg ${color}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{value}</h3>
                {subtitle && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>
                )}
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-12 text-center flex flex-col items-center justify-center gap-4 min-h-75">
            <BookOpen size={48} className="text-gray-300 dark:text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Nenhuma atividade registrada</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
                Seus relatórios de evolução aparecerão aqui conforme você resolve exercícios nos diferentes modos de estudo.
            </p>
        </div>
    );
}

function ActivityChart({ dailyActivity }: { dailyActivity: DailyActivity[] }) {
    if (dailyActivity.length === 0) return null;

    // Show the last 30 days (fill gaps with 0)
    const today = new Date();
    const days: { date: string; sessions: number }[] = [];
    const activityMap = new Map(dailyActivity.map(d => [d.date, d.sessions]));

    for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        days.push({ date: key, sessions: activityMap.get(key) || 0 });
    }

    const maxSessions = Math.max(...days.map(d => d.sessions), 1);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Clock size={20} className="text-blue-500" />
                Atividade dos Últimos 30 Dias
            </h2>
            <div className="flex items-end gap-0.75 h-32">
                {days.map((day) => {
                    const height = day.sessions > 0
                        ? Math.max((day.sessions / maxSessions) * 100, 8)
                        : 4;
                    const dateObj = new Date(day.date + 'T12:00:00');
                    const label = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

                    return (
                        <div
                            key={day.date}
                            className="group relative flex-1 flex flex-col items-center justify-end"
                        >
                            {/* Tooltip */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                {label}: {day.sessions} sessão{day.sessions !== 1 ? 'ões' : ''}
                            </div>
                            <div
                                className={`w-full rounded-t transition-all ${
                                    day.sessions > 0
                                        ? 'bg-blue-500 dark:bg-blue-400 hover:bg-blue-600 dark:hover:bg-blue-300'
                                        : 'bg-gray-200 dark:bg-slate-700'
                                }`}
                                style={{ height: `${height}%` }}
                            />
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400 dark:text-gray-500">
                <span>30 dias atrás</span>
                <span>Hoje</span>
            </div>
        </div>
    );
}

function ModeBreakdown({ modeStats, total }: { modeStats: ModeStats[]; total: number }) {
    // Sort by sessions descending
    const sorted = [...modeStats].sort((a, b) => b.totalSessions - a.totalSessions);

    const modeColors: Record<string, string> = {
        learn: 'bg-blue-500',
        test: 'bg-red-500',
        match: 'bg-yellow-500',
        mixed: 'bg-indigo-500',
        guided: 'bg-emerald-500',
        flashcards: 'bg-pink-500',
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Zap size={20} className="text-yellow-500" />
                Distribuição por Modo
            </h2>
            <div className="space-y-3">
                {sorted.map((mode) => {
                    const pct = total > 0 ? (mode.totalSessions / total) * 100 : 0;
                    return (
                        <div key={mode.mode}>
                            <div className="flex items-center justify-between text-sm mb-1">
                                <span className="font-medium text-gray-700 dark:text-gray-300">{mode.label}</span>
                                <span className="text-gray-500 dark:text-gray-400">
                                    {mode.totalSessions} ({pct.toFixed(0)}%)
                                </span>
                            </div>
                            <div className="w-full h-2.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${modeColors[mode.mode] || 'bg-gray-500'}`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function TopTopics({ topics }: { topics: TopicFrequency[] }) {
    if (topics.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-emerald-500" />
                Tópicos Mais Estudados
            </h2>
            <ul className="space-y-2">
                {topics.map((t, i) => (
                    <li
                        key={t.topic}
                        className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                        <span className="text-sm font-bold text-gray-400 dark:text-gray-500 w-5 text-right">
                            {i + 1}.
                        </span>
                        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate" title={t.topic}>
                            {t.topic}
                        </span>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                            {t.count}x
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function ModeDetailCards({ modeStats }: { modeStats: ModeStats[] }) {
    const activeModes = modeStats.filter(m => m.totalSessions > 0);
    if (activeModes.length === 0) return null;

    const modeIcons: Record<string, React.ReactNode> = {
        learn: <BookOpen size={18} />,
        test: <Target size={18} />,
        match: <Zap size={18} />,
        mixed: <BarChart size={18} />,
        guided: <ChevronRight size={18} />,
        flashcards: <Award size={18} />,
    };

    const modeColors: Record<string, string> = {
        learn: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
        test: 'text-red-600 bg-red-100 dark:bg-red-900/30',
        match: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
        mixed: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30',
        guided: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
        flashcards: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30',
    };

    return (
        <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-purple-500" />
                Detalhes por Modo
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeModes.map((mode) => (
                    <div
                        key={mode.mode}
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-5"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-lg ${modeColors[mode.mode] || ''}`}>
                                {modeIcons[mode.mode]}
                            </div>
                            <h3 className="font-semibold text-gray-800 dark:text-white">{mode.label}</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <DetailRow label="Sessões" value={String(mode.totalSessions)} />
                            {mode.averageAccuracy !== null && (
                                <DetailRow
                                    label="Precisão Média"
                                    value={`${mode.averageAccuracy.toFixed(1)}%`}
                                    accent={mode.averageAccuracy >= 70 ? 'green' : mode.averageAccuracy >= 40 ? 'yellow' : 'red'}
                                />
                            )}
                            {mode.bestAccuracy !== null && (
                                <DetailRow label="Melhor Resultado" value={`${mode.bestAccuracy.toFixed(1)}%`} />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function DetailRow({ label, value, accent }: { label: string; value: string; accent?: 'green' | 'yellow' | 'red' }) {
    const accentClasses = {
        green: 'text-green-600 dark:text-green-400',
        yellow: 'text-yellow-600 dark:text-yellow-400',
        red: 'text-red-600 dark:text-red-400',
    };

    return (
        <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{label}</span>
            <span className={`font-medium ${accent ? accentClasses[accent] : 'text-gray-800 dark:text-white'}`}>
                {value}
            </span>
        </div>
    );
}
