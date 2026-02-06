import { useMemo } from 'react';
import { usePersistence } from '../../../hooks/usePersistence';

// ── History item types (mirrored from each feature) ──

interface LearnHistoryItem {
  id: string;
  date: string;
  topic: string;
  score: number;
  total: number;
}

interface TestHistoryItem {
  id: string;
  date: string;
  topic: string;
  score: number;
  total: number;
}

interface MatchHistoryItem {
  id: string;
  date: string;
  topic: string;
  pairs: number;
  timeTaken: number;
  completed: boolean;
}

interface MixedHistoryItem {
  id: string;
  date: string;
  topic: string;
  score: number;
  total: number;
}

interface GuidedHistoryItem {
  id: string;
  date: string;
  problem: string;
}

interface FlashcardHistoryItem {
  id: string;
  setId: string;
  title: string;
  date: string;
  score?: number;
  total?: number;
}

// ── Aggregated types exposed to consumers ──

export interface ModeStats {
  mode: string;
  label: string;
  totalSessions: number;
  averageAccuracy: number | null; // null when accuracy doesn't apply (e.g. guided)
  bestAccuracy: number | null;
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  sessions: number;
}

export interface TopicFrequency {
  topic: string;
  count: number;
}

export interface StatsSummary {
  totalExercises: number;
  averageAccuracy: number; // 0-100
  bestAccuracy: number;    // 0-100
  totalStudyTimeSecs: number;
  currentStreak: number;
  longestStreak: number;
  modeStats: ModeStats[];
  dailyActivity: DailyActivity[];
  topTopics: TopicFrequency[];
  recentDates: string[];
  isLoading: boolean;
}

// ── Helpers ──

function toDateKey(dateStr: string): string {
  try {
    return new Date(dateStr).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function computeStreak(sortedDates: string[]): { current: number; longest: number } {
  if (sortedDates.length === 0) return { current: 0, longest: 0 };

  const uniqueDays = [...new Set(sortedDates.map(toDateKey).filter(Boolean))].sort();

  if (uniqueDays.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let current = 1;

  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  // Check if the streak is still active (last activity is today or yesterday)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDay = new Date(uniqueDays[uniqueDays.length - 1]);
  lastDay.setHours(0, 0, 0, 0);
  const daysSinceLast = (today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceLast > 1) {
    current = 0; // streak broken
  }

  return { current, longest };
}

function buildDailyActivity(allDates: string[]): DailyActivity[] {
  const counts = new Map<string, number>();

  for (const d of allDates) {
    const key = toDateKey(d);
    if (key) counts.set(key, (counts.get(key) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([date, sessions]) => ({ date, sessions }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function buildTopTopics(allTopics: string[], limit = 10): TopicFrequency[] {
  const counts = new Map<string, number>();
  for (const t of allTopics) {
    if (t) counts.set(t, (counts.get(t) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ── Main hook ──

export function useStatistics(): StatsSummary {
  const [learnHistory, , learnLoading] = usePersistence<LearnHistoryItem[]>('learnHistory', []);
  const [testHistory, , testLoading] = usePersistence<TestHistoryItem[]>('testHistory', []);
  const [matchHistory, , matchLoading] = usePersistence<MatchHistoryItem[]>('matchHistory', []);
  const [mixedHistory, , mixedLoading] = usePersistence<MixedHistoryItem[]>('mixedHistory', []);
  const [guidedHistory, , guidedLoading] = usePersistence<GuidedHistoryItem[]>('guidedHistory', []);
  const [flashcardHistory, , flashcardLoading] = usePersistence<FlashcardHistoryItem[]>('flashcardHistory', []);

  const isLoading = learnLoading || testLoading || matchLoading || mixedLoading || guidedLoading || flashcardLoading;

  return useMemo(() => {
    // ── Per-mode stats ──

    const scoredModes: { items: { score: number; total: number; date: string; topic: string }[]; mode: string; label: string }[] = [
      {
        mode: 'learn',
        label: 'Aprender',
        items: (learnHistory || []).map(h => ({ score: h.score, total: h.total, date: h.date, topic: h.topic })),
      },
      {
        mode: 'test',
        label: 'Teste',
        items: (testHistory || []).map(h => ({ score: h.score, total: h.total, date: h.date, topic: h.topic })),
      },
      {
        mode: 'mixed',
        label: 'Misto',
        items: (mixedHistory || []).map(h => ({ score: h.score, total: h.total, date: h.date, topic: h.topic })),
      },
      {
        mode: 'flashcards',
        label: 'Flashcards',
        items: (flashcardHistory || [])
          .filter(h => h.score != null && h.total != null && h.total > 0)
          .map(h => ({ score: h.score!, total: h.total!, date: h.date, topic: h.title })),
      },
    ];

    const modeStats: ModeStats[] = [];

    // Scored modes
    for (const { mode, label, items } of scoredModes) {
      const accuracies = items.filter(i => i.total > 0).map(i => (i.score / i.total) * 100);
      modeStats.push({
        mode,
        label,
        totalSessions: items.length,
        averageAccuracy: accuracies.length > 0 ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length : null,
        bestAccuracy: accuracies.length > 0 ? Math.max(...accuracies) : null,
      });
    }

    // Match mode (accuracy = completion rate)
    const matchItems = matchHistory || [];
    const matchCompletedCount = matchItems.filter(m => m.completed).length;
    modeStats.push({
      mode: 'match',
      label: 'Combinar',
      totalSessions: matchItems.length,
      averageAccuracy: matchItems.length > 0 ? (matchCompletedCount / matchItems.length) * 100 : null,
      bestAccuracy: null,
    });

    // Guided mode (no accuracy concept)
    const guidedItems = guidedHistory || [];
    modeStats.push({
      mode: 'guided',
      label: 'Guiado',
      totalSessions: guidedItems.length,
      averageAccuracy: null,
      bestAccuracy: null,
    });

    // ── Global aggregates ──

    const totalExercises = modeStats.reduce((sum, m) => sum + m.totalSessions, 0);

    // Average accuracy across all scored modes
    const allAccuracies = scoredModes.flatMap(m =>
      m.items.filter(i => i.total > 0).map(i => (i.score / i.total) * 100)
    );
    const averageAccuracy = allAccuracies.length > 0
      ? allAccuracies.reduce((a, b) => a + b, 0) / allAccuracies.length
      : 0;
    const bestAccuracy = allAccuracies.length > 0 ? Math.max(...allAccuracies) : 0;

    // Study time from match mode (only mode that tracks time)
    const totalStudyTimeSecs = matchItems.reduce((sum, m) => sum + (m.timeTaken || 0), 0);

    // Collect all dates and topics
    const allDates: string[] = [
      ...(learnHistory || []).map(h => h.date),
      ...(testHistory || []).map(h => h.date),
      ...(matchHistory || []).map(h => h.date),
      ...(mixedHistory || []).map(h => h.date),
      ...(guidedHistory || []).map(h => h.date),
      ...(flashcardHistory || []).map(h => h.date),
    ];

    const allTopics: string[] = [
      ...(learnHistory || []).map(h => h.topic),
      ...(testHistory || []).map(h => h.topic),
      ...(matchHistory || []).map(h => h.topic),
      ...(mixedHistory || []).map(h => h.topic),
      ...(guidedHistory || []).map(h => h.problem),
      ...(flashcardHistory || []).map(h => h.title),
    ];

    const { current: currentStreak, longest: longestStreak } = computeStreak(allDates);
    const dailyActivity = buildDailyActivity(allDates);
    const topTopics = buildTopTopics(allTopics);

    // Last 30 unique dates for chart display
    const recentDates = [...new Set(allDates.map(toDateKey).filter(Boolean))]
      .sort()
      .slice(-30);

    return {
      totalExercises,
      averageAccuracy,
      bestAccuracy,
      totalStudyTimeSecs,
      currentStreak,
      longestStreak,
      modeStats,
      dailyActivity,
      topTopics,
      recentDates,
      isLoading,
    };
  }, [learnHistory, testHistory, matchHistory, mixedHistory, guidedHistory, flashcardHistory, isLoading]);
}
