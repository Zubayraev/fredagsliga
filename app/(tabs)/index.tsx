import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Href, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
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

const ALL_TEAMS: Record<Team, TeamConfig> = {
  turkis: { name: 'Turkis', color: '#06b6d4' },
  oransje: { name: 'Oransje', color: '#f97316' },
  grønn: { name: 'Grønn', color: '#22c55e' },
  svart: { name: 'Svart', color: '#1f2937' },
  rød: { name: 'Rød', color: '#ef4444' },
  blå: { name: 'Blå', color: '#3b82f6' },
};

export default function HomePage() {
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadSelectedTeams();
    loadRecentMatches();
  }, []);

  const loadSelectedTeams = async () => {
    try {
      const saved = await AsyncStorage.getItem('active_teams');
      if (saved) {
        setSelectedTeams(JSON.parse(saved));
      } else {
        // Default til 4 første lag
        setSelectedTeams(['turkis', 'oransje', 'grønn', 'svart']);
      }
    } catch (error) {
      console.error('Kunne ikke laste lag:', error);
    }
  };

  const loadRecentMatches = async () => {
    try {
      const saved = await AsyncStorage.getItem('match_history');
      if (saved) {
        const history = JSON.parse(saved);
        setRecentMatches(history.slice(0, 3));
      }
    } catch (error) {
      console.error('Kunne ikke laste historikk:', error);
    }
  };

  const toggleTeam = async (team: Team) => {
    let newTeams: Team[];
    
    if (selectedTeams.includes(team)) {
      if (selectedTeams.length <= 2) {
        return; // Må ha minst 2 lag
      }
      newTeams = selectedTeams.filter(t => t !== team);
    } else {
      newTeams = [...selectedTeams, team];
    }
    
    setSelectedTeams(newTeams);
    await AsyncStorage.setItem('active_teams', JSON.stringify(newTeams));
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleStartGame = () => {
    if (selectedTeams.length < 2) return;
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    router.push('/(tabs)/spill' as Href);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'I dag';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'I går';
    } else {
      return date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hvilke lag spiller i dag?</Text>
          <Text style={styles.sectionSubtitle}>
            Velg minst 2 lag • {selectedTeams.length} valgt
          </Text>
          
          <View style={styles.teamGrid}>
            {(Object.keys(ALL_TEAMS) as Team[]).map((team) => {
              const isSelected = selectedTeams.includes(team);
              return (
                <TouchableOpacity
                  key={team}
                  style={[
                    styles.teamCard,
                    { backgroundColor: ALL_TEAMS[team].color },
                    !isSelected && styles.teamCardInactive,
                  ]}
                  onPress={() => toggleTeam(team)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.teamCardText,
                    !isSelected && styles.teamCardTextInactive
                  ]}>
                    {ALL_TEAMS[team].name}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[
              styles.startButton,
              selectedTeams.length < 2 && styles.startButtonDisabled
            ]}
            onPress={handleStartGame}
            disabled={selectedTeams.length < 2}
            activeOpacity={0.9}
          >
            <Text style={styles.startButtonText}>
              Start spill med {selectedTeams.length} lag
            </Text>
          </TouchableOpacity>
        </View>

        {recentMatches.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Siste kamper</Text>
            
            <View style={styles.matchList}>
              {recentMatches.map((match, index) => (
                <View key={index} style={styles.matchCard}>
                  <View style={styles.matchHeader}>
                    <Text style={styles.matchDate}>{formatDate(match.date)}</Text>
                    <Text style={styles.matchDuration}>{match.duration} min</Text>
                  </View>
                  
                  <View style={styles.matchTeams}>
                    <View style={styles.matchTeam}>
                      <View style={[
                        styles.matchTeamColor,
                        { backgroundColor: ALL_TEAMS[match.winner as Team]?.color || '#666' }
                      ]} />
                      <Text style={styles.matchTeamName}>
                        {ALL_TEAMS[match.winner as Team]?.name || match.winner}
                      </Text>
                      <Text style={styles.matchScore}>{match.winnerScore}</Text>
                    </View>
                    
                    <Text style={styles.matchVs}>-</Text>
                    
                    <View style={styles.matchTeam}>
                      <View style={[
                        styles.matchTeamColor,
                        { backgroundColor: ALL_TEAMS[match.loser as Team]?.color || '#666' }
                      ]} />
                      <Text style={styles.matchTeamName}>
                        {ALL_TEAMS[match.loser as Team]?.name || match.loser}
                      </Text>
                      <Text style={styles.matchScore}>{match.loserScore}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
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
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#6e6e73',
    marginBottom: 20,
    fontWeight: '500',
  },
  teamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  teamCard: {
    width: '48%',
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  teamCardInactive: {
    backgroundColor: '#e5e5ea',
    opacity: 0.6,
  },
  teamCardText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  teamCardTextInactive: {
    color: '#8e8e93',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  startButton: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    backgroundColor: '#34c759',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#34c759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonDisabled: {
    backgroundColor: '#e5e5ea',
    shadowOpacity: 0,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
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