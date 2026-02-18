import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Team = 'turkis' | 'oransje' | 'grønn' | 'svart' | 'rød' | 'blå';

interface TeamConfig {
  name: string;
  color: string;
}

const TEAMS: Record<Team, TeamConfig> = {
  turkis: { name: 'Turkis', color: '#06b6d4' },
  oransje: { name: 'Oransje', color: '#f97316' },
  grønn: { name: 'Grønn', color: '#22c55e' },
  svart: { name: 'Svart', color: '#1f2937' },
  rød: { name: 'Rød', color: '#ef4444' },
  blå: { name: 'Blå', color: '#3b82f6' },
};

interface Match {
  date: string;
  winner: Team;
  loser: Team;
  winnerScore: number;
  loserScore: number;
  duration: number;
}

interface TeamStats {
  wins: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  matchesPlayed: number;
}

type TabType = 'idag' | 'alt';

export default function StatistikkPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('idag');
  const [teamStats, setTeamStats] = useState<Record<Team, TeamStats>>({
    turkis: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
    oransje: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
    grønn: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
    svart: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
    rød: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
    blå: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
  });
  const [todayStats, setTodayStats] = useState<Record<Team, TeamStats>>({
    turkis: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
    oransje: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
    grønn: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
    svart: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
    rød: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
    blå: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
  });

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, [])
  );

  useEffect(() => {
    calculateStats(matches);
    calculateTodayStats(matches);
  }, [matches]);

  const loadMatches = async () => {
    try {
      const saved = await AsyncStorage.getItem('match_history');
      if (saved) {
        setMatches(JSON.parse(saved));
      } else {
        setMatches([]);
      }
    } catch (error) {
      console.error('Kunne ikke laste historikk:', error);
    }
  };

  const buildStats = (matchList: Match[]): Record<Team, TeamStats> => {
    const stats: Record<Team, TeamStats> = {
      turkis: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
      oransje: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
      grønn: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
      svart: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
      rød: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
      blå: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
    };
    matchList.forEach((match) => {
      if (stats[match.winner]) {
        stats[match.winner].wins++;
        stats[match.winner].goalsFor += match.winnerScore;
        stats[match.winner].goalsAgainst += match.loserScore;
        stats[match.winner].matchesPlayed++;
      }
      if (stats[match.loser]) {
        stats[match.loser].losses++;
        stats[match.loser].goalsFor += match.loserScore;
        stats[match.loser].goalsAgainst += match.winnerScore;
        stats[match.loser].matchesPlayed++;
      }
    });
    return stats;
  };

  const calculateStats = (matchList: Match[]) => {
    setTeamStats(buildStats(matchList));
  };

  const calculateTodayStats = (matchList: Match[]) => {
    const today = new Date().toDateString();
    const todayMatches = matchList.filter(
      (m) => new Date(m.date).toDateString() === today
    );
    setTodayStats(buildStats(todayMatches));
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem('match_history');
      setMatches([]);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Kunne ikke slette historikk:', error);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Nullstill all historikk?',
      'Alle kamper og statistikk vil slettes. Dette kan ikke angres.',
      [
        { text: 'Avbryt', style: 'cancel' },
        { text: 'Nullstill', style: 'destructive', onPress: clearHistory },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `I går ${date.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' });
    }
  };

  const getWinRate = (stats: TeamStats) => {
    if (stats.matchesPlayed === 0) return 0;
    return Math.round((stats.wins / stats.matchesPlayed) * 100);
  };

  const getSortedTeams = (stats: Record<Team, TeamStats>) =>
    (Object.keys(stats) as Team[])
      .filter((t) => stats[t].matchesPlayed > 0)
      .sort((a, b) => {
        if (stats[b].wins !== stats[a].wins) return stats[b].wins - stats[a].wins;
        const goalDiffA = stats[a].goalsFor - stats[a].goalsAgainst;
        const goalDiffB = stats[b].goalsFor - stats[b].goalsAgainst;
        return goalDiffB - goalDiffA;
      });

  const todaySortedTeams = getSortedTeams(todayStats);
  const allSortedTeams = getSortedTeams(teamStats);

  const todayMatches = matches.filter(
    (m) => new Date(m.date).toDateString() === new Date().toDateString()
  );

  const displayStats = activeTab === 'idag' ? todayStats : teamStats;
  const displaySorted = activeTab === 'idag' ? todaySortedTeams : allSortedTeams;
  const displayMatches = activeTab === 'idag' ? todayMatches : matches;
  const hasData = displayMatches.length > 0;

  // Today's leader
  const leader = todaySortedTeams[0];
  const leaderStats = leader ? todayStats[leader] : null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>

        {/* Today's Leader Banner */}
        {leader && leaderStats && leaderStats.wins > 0 ? (
          <View style={[styles.leaderBanner, { backgroundColor: TEAMS[leader].color }]}>
            <View style={styles.leaderLeft}>
              <Text style={styles.leaderLabel}>DAGENS LEDER 🏆</Text>
              <Text style={styles.leaderName}>{TEAMS[leader].name}</Text>
            </View>
            <View style={styles.leaderRight}>
              <Text style={styles.leaderStat}>{leaderStats.wins}</Text>
              <Text style={styles.leaderStatLabel}>seire i dag</Text>
            </View>
          </View>
        ) : (
          <View style={styles.noLeaderBanner}>
            <Text style={styles.noLeaderText}>⚽ Ingen kamper spilt i dag ennå</Text>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'idag' && styles.tabActive]}
            onPress={() => setActiveTab('idag')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'idag' && styles.tabTextActive]}>
              I dag
            </Text>
            {todayMatches.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{todayMatches.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'alt' && styles.tabActive]}
            onPress={() => setActiveTab('alt')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'alt' && styles.tabTextActive]}>
              Alt
            </Text>
            {matches.length > 0 && (
              <View style={[styles.tabBadge, activeTab === 'alt' && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === 'alt' && styles.tabBadgeTextActive]}>
                  {matches.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {!hasData ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'idag' ? 'Ingen kamper i dag' : 'Ingen kamper ennå'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'idag'
                ? 'Spill noen kamper, så vises statistikk her!'
                : 'Spill en kamp for å se statistikk'}
            </Text>
          </View>
        ) : (
          <>
            {/* Standings table */}
            {displaySorted.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Stillingstabell</Text>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, { width: 28 }]}>#</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>Lag</Text>
                    <Text style={[styles.tableHeaderText, styles.colCenter, { width: 36 }]}>K</Text>
                    <Text style={[styles.tableHeaderText, styles.colCenter, { width: 36 }]}>S</Text>
                    <Text style={[styles.tableHeaderText, styles.colCenter, { width: 36 }]}>T</Text>
                    <Text style={[styles.tableHeaderText, styles.colCenter, { width: 52 }]}>Mål</Text>
                    <Text style={[styles.tableHeaderText, styles.colRight, { width: 48 }]}>%</Text>
                  </View>
                  {displaySorted.map((team, index) => {
                    const stats = displayStats[team];
                    const winRate = getWinRate(stats);
                    const isFirst = index === 0;
                    return (
                      <View
                        key={team}
                        style={[styles.tableRow, isFirst && styles.tableRowFirst]}
                      >
                        <View style={[styles.rankBadge, isFirst && { backgroundColor: TEAMS[team].color }]}>
                          <Text style={[styles.rankText, isFirst && styles.rankTextFirst]}>
                            {index + 1}
                          </Text>
                        </View>
                        <View style={styles.teamCell}>
                          <View style={[styles.teamDot, { backgroundColor: TEAMS[team].color }]} />
                          <Text style={styles.teamName}>{TEAMS[team].name}</Text>
                        </View>
                        <Text style={[styles.cellText, styles.colCenter, { width: 36 }]}>{stats.matchesPlayed}</Text>
                        <Text style={[styles.cellText, styles.colCenter, { width: 36, color: '#22c55e', fontWeight: '700' }]}>{stats.wins}</Text>
                        <Text style={[styles.cellText, styles.colCenter, { width: 36, color: '#ef4444', fontWeight: '700' }]}>{stats.losses}</Text>
                        <Text style={[styles.cellText, styles.colCenter, { width: 52 }]}>
                          {stats.goalsFor}-{stats.goalsAgainst}
                        </Text>
                        <Text style={[
                          styles.cellText,
                          styles.colRight,
                          { width: 48, fontWeight: '700' },
                          winRate >= 60 ? { color: '#22c55e' } : winRate < 40 ? { color: '#ef4444' } : { color: '#f97316' },
                        ]}>
                          {winRate}%
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Match list */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {activeTab === 'idag' ? 'Dagens kamper' : 'Alle kamper'}
                </Text>
                {activeTab === 'alt' && (
                  <TouchableOpacity style={styles.resetButton} onPress={handleClearHistory}>
                    <Text style={styles.resetButtonText}>🗑 Nullstill</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.matchList}>
                {displayMatches.map((match, index) => (
                  <View key={index} style={styles.matchCard}>
                    {/* Winner row */}
                    <View style={styles.matchRow}>
                      <View style={[styles.matchColorBar, { backgroundColor: TEAMS[match.winner]?.color || '#ccc' }]} />
                      <Text style={styles.matchTeamText}>{TEAMS[match.winner]?.name || match.winner}</Text>
                      <View style={styles.matchScoreBadge}>
                        <Text style={styles.matchScoreText}>{match.winnerScore}</Text>
                      </View>
                      <View style={styles.winBadge}>
                        <Text style={styles.winBadgeText}>W</Text>
                      </View>
                    </View>

                    <View style={styles.matchDivider} />

                    {/* Loser row */}
                    <View style={styles.matchRow}>
                      <View style={[styles.matchColorBar, { backgroundColor: TEAMS[match.loser]?.color || '#ccc' }]} />
                      <Text style={[styles.matchTeamText, styles.matchTeamLoser]}>{TEAMS[match.loser]?.name || match.loser}</Text>
                      <View style={[styles.matchScoreBadge, styles.matchScoreBadgeLoser]}>
                        <Text style={[styles.matchScoreText, styles.matchScoreTextLoser]}>{match.loserScore}</Text>
                      </View>
                      <View style={styles.lossBadge}>
                        <Text style={styles.lossBadgeText}>T</Text>
                      </View>
                    </View>

                    <View style={styles.matchMeta}>
                      <Text style={styles.matchMetaText}>{formatDate(match.date)}</Text>
                      <Text style={styles.matchMetaText}>{match.duration} min</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  content: {
    padding: 16,
    paddingBottom: 48,
    gap: 16,
  },

  // Leader banner
  leaderBanner: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  leaderLeft: {},
  leaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  leaderName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  leaderRight: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  leaderStat: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 40,
  },
  leaderStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  noLeaderBanner: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  noLeaderText: {
    fontSize: 16,
    color: '#8e8e93',
    fontWeight: '500',
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#e5e5ea',
    borderRadius: 12,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8e8e93',
  },
  tabTextActive: {
    color: '#1d1d1f',
  },
  tabBadge: {
    backgroundColor: '#8e8e93',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tabBadgeActive: {
    backgroundColor: '#007aff',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  tabBadgeTextActive: {
    color: '#fff',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#8e8e93',
    textAlign: 'center',
  },

  // Section
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  resetButton: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Table
  table: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f5f5f7',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
    gap: 4,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8e8e93',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f7',
    gap: 4,
  },
  tableRowFirst: {
    backgroundColor: '#fafafa',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e5ea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6e6e73',
  },
  rankTextFirst: {
    color: '#fff',
  },
  teamCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  teamDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  cellText: {
    fontSize: 15,
    color: '#1d1d1f',
  },
  colCenter: {
    textAlign: 'center',
  },
  colRight: {
    textAlign: 'right',
  },

  // Match cards
  matchList: {
    gap: 10,
  },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  matchColorBar: {
    width: 6,
    height: 36,
    borderRadius: 3,
  },
  matchTeamText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  matchTeamLoser: {
    color: '#6e6e73',
    fontWeight: '500',
  },
  matchScoreBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1d1d1f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchScoreBadgeLoser: {
    backgroundColor: '#e5e5ea',
  },
  matchScoreText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  matchScoreTextLoser: {
    color: '#6e6e73',
  },
  winBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  winBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#22c55e',
  },
  lossBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lossBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ef4444',
  },
  matchDivider: {
    height: 1,
    backgroundColor: '#f5f5f7',
    marginHorizontal: 14,
  },
  matchMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fafafa',
    borderTopWidth: 1,
    borderTopColor: '#f5f5f7',
  },
  matchMetaText: {
    fontSize: 13,
    color: '#8e8e93',
    fontWeight: '500',
  },
});