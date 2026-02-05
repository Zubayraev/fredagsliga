import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
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

export default function StatistikkPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teamStats, setTeamStats] = useState<Record<Team, TeamStats>>({
    turkis: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
    oransje: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
    grønn: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
    svart: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
    rød: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
    blå: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
  });
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    loadMatches();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [matches]);

  const loadMatches = async () => {
    try {
      const saved = await AsyncStorage.getItem('match_history');
      if (saved) {
        setMatches(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Kunne ikke laste historikk:', error);
    }
  };

  const calculateStats = () => {
    const stats: Record<Team, TeamStats> = {
      turkis: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
      oransje: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
      grønn: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
      svart: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
      rød: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
      blå: { wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, matchesPlayed: 0 },
    };

    matches.forEach((match) => {
      // Winner stats
      if (stats[match.winner]) {
        stats[match.winner].wins++;
        stats[match.winner].goalsFor += match.winnerScore;
        stats[match.winner].goalsAgainst += match.loserScore;
        stats[match.winner].matchesPlayed++;
      }

      // Loser stats
      if (stats[match.loser]) {
        stats[match.loser].losses++;
        stats[match.loser].goalsFor += match.loserScore;
        stats[match.loser].goalsAgainst += match.winnerScore;
        stats[match.loser].matchesPlayed++;
      }
    });

    setTeamStats(stats);
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem('match_history');
      setMatches([]);
      setShowConfirm(false);
      
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Kunne ikke slette historikk:', error);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Slett all historikk?',
      'Dette kan ikke angres',
      [
        {
          text: 'Avbryt',
          style: 'cancel',
        },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: clearHistory,
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      const time = date.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
      return `I dag kl. ${time}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      const time = date.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
      return `I går kl. ${time}`;
    } else {
      return date.toLocaleDateString('nb-NO', { 
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getWinRate = (team: Team) => {
    const stats = teamStats[team];
    if (stats.matchesPlayed === 0) return 0;
    return Math.round((stats.wins / stats.matchesPlayed) * 100);
  };

  const sortedTeams = (Object.keys(teamStats) as Team[])
    .filter(team => teamStats[team].matchesPlayed > 0)
    .sort((a, b) => {
      const winRateA = getWinRate(a);
      const winRateB = getWinRate(b);
      if (winRateB !== winRateA) return winRateB - winRateA;
      return teamStats[b].wins - teamStats[a].wins;
    });

  if (matches.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📊</Text>
        <Text style={styles.emptyTitle}>Ingen kamper ennå</Text>
        <Text style={styles.emptyText}>
          Spill noen kamper så vises statistikk her!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Oversikt */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Oversikt</Text>
          <View style={styles.overviewCards}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewNumber}>{matches.length}</Text>
              <Text style={styles.overviewLabel}>Kamper spilt</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewNumber}>
                {Math.round(matches.reduce((sum, m) => sum + m.duration, 0) / matches.length)}
              </Text>
              <Text style={styles.overviewLabel}>Ø minutter</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewNumber}>
                {Math.round(
                  matches.reduce((sum, m) => sum + m.winnerScore + m.loserScore, 0) / matches.length
                )}
              </Text>
              <Text style={styles.overviewLabel}>Ø mål</Text>
            </View>
          </View>
        </View>

        {/* Lagstatistikk */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lagstatistikk</Text>
          
          <View style={styles.statsTable}>
            {sortedTeams.map((team, index) => {
              const stats = teamStats[team];
              const winRate = getWinRate(team);
              
              return (
                <View key={team} style={styles.statsRow}>
                  <View style={styles.statsRank}>
                    <Text style={styles.statsRankText}>{index + 1}</Text>
                  </View>
                  
                  <View style={[styles.statsTeamColor, { backgroundColor: TEAMS[team].color }]} />
                  
                  <Text style={styles.statsTeamName}>{TEAMS[team].name}</Text>
                  
                  <View style={styles.statsNumbers}>
                    <View style={styles.statsItem}>
                      <Text style={styles.statsValue}>{stats.wins}S</Text>
                    </View>
                    <View style={styles.statsItem}>
                      <Text style={styles.statsValue}>{stats.losses}T</Text>
                    </View>
                    <View style={styles.statsItem}>
                      <Text style={styles.statsValue}>{stats.goalsFor}-{stats.goalsAgainst}</Text>
                    </View>
                    <View style={styles.statsWinRate}>
                      <Text style={[
                        styles.statsWinRateText,
                        winRate >= 70 && styles.statsWinRateHigh,
                        winRate < 40 && styles.statsWinRateLow,
                      ]}>
                        {winRate}%
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Kamper */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Alle kamper</Text>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearHistory}
            >
              <Text style={styles.clearButtonText}>Slett alt</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.matchList}>
            {matches.map((match, index) => (
              <View key={index} style={styles.matchCard}>
                <View style={styles.matchHeader}>
                  <Text style={styles.matchDate}>{formatDate(match.date)}</Text>
                  <Text style={styles.matchDuration}>{match.duration} min</Text>
                </View>
                
                <View style={styles.matchTeams}>
                  <View style={styles.matchTeam}>
                    <View style={[
                      styles.matchTeamColor,
                      { backgroundColor: TEAMS[match.winner]?.color || '#666' }
                    ]} />
                    <Text style={styles.matchTeamName}>
                      {TEAMS[match.winner]?.name || match.winner}
                    </Text>
                    <Text style={styles.matchScore}>{match.winnerScore}</Text>
                  </View>
                  
                  <Text style={styles.matchVs}>-</Text>
                  
                  <View style={styles.matchTeam}>
                    <View style={[
                      styles.matchTeamColor,
                      { backgroundColor: TEAMS[match.loser]?.color || '#666' }
                    ]} />
                    <Text style={styles.matchTeamName}>
                      {TEAMS[match.loser]?.name || match.loser}
                    </Text>
                    <Text style={styles.matchScore}>{match.loserScore}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
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
    padding: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f5f5f7',
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 17,
    color: '#6e6e73',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 16,
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#ff3b30',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  overviewCards: {
    flexDirection: 'row',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  overviewNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#007aff',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 13,
    color: '#6e6e73',
    fontWeight: '500',
  },
  statsTable: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f7',
  },
  statsRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statsRankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  statsTeamColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statsTeamName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1d1d1f',
    flex: 1,
  },
  statsNumbers: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  statsItem: {
    minWidth: 32,
  },
  statsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6e6e73',
    textAlign: 'right',
  },
  statsWinRate: {
    minWidth: 48,
  },
  statsWinRateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6e6e73',
    textAlign: 'right',
  },
  statsWinRateHigh: {
    color: '#34c759',
  },
  statsWinRateLow: {
    color: '#ff3b30',
  },
  matchList: {
    gap: 12,
  },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  matchDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  matchDuration: {
    fontSize: 14,
    color: '#6e6e73',
    fontWeight: '500',
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchTeam: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  matchTeamColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  matchTeamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
    flex: 1,
  },
  matchScore: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  matchVs: {
    fontSize: 14,
    color: '#8e8e93',
    marginHorizontal: 12,
    fontWeight: '600',
  },
});