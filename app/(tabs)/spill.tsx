import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View
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

type Screen = 'select-teams' | 'set-time' | 'game' | 'sudden-death' | 'result';

export default function SpillPage() {
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [screen, setScreen] = useState<Screen>('select-teams');
  const [playingTeams, setPlayingTeams] = useState<[Team, Team] | null>(null);
  const [waitingTeams, setWaitingTeams] = useState<Team[]>([]);
  const [gameTime, setGameTime] = useState(5);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [scores, setScores] = useState<Record<Team, number>>({
    turkis: 0,
    oransje: 0,
    grønn: 0,
    svart: 0,
    rød: 0,
    blå: 0,
  });
  const [winner, setWinner] = useState<Team | null>(null);
  const [loser, setLoser] = useState<Team | null>(null);
  const [selected1, setSelected1] = useState<Team | null>(null);
  const [selected2, setSelected2] = useState<Team | null>(null);
  const [notificationId, setNotificationId] = useState<string | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadAvailableTeams();
    }, [])
  );

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [screen]);

  useEffect(() => {
    if (screen === 'game' && timeRemaining > 0 && !isPaused) {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleGameEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      timerRef.current = interval;
      
      return () => {
        clearInterval(interval);
      };
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [screen, timeRemaining, isPaused]);

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Varsler deaktivert',
        'For å få varsler når tiden er ute, må du aktivere varsler i innstillinger.'
      );
    }
  };

  const scheduleGameEndNotification = async (durationInSeconds: number) => {
    try {
      // Cancel existing notification
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      }

      // Schedule new notification
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚽ Fredagsliga',
          body: 'Tiden er ute! Sjekk resultatet.',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: durationInSeconds,
          repeats: false,
        },
      });

      setNotificationId(id);
    } catch (error) {
      console.error('Kunne ikke schedule notification:', error);
    }
  };

  const cancelNotification = async () => {
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      setNotificationId(null);
    }
  };

  const loadAvailableTeams = async () => {
    try {
      const saved = await AsyncStorage.getItem('active_teams');
      if (saved) {
        setAvailableTeams(JSON.parse(saved));
      } else {
        setAvailableTeams(['turkis', 'oransje', 'grønn', 'svart']);
      }
    } catch (error) {
      console.error('Kunne ikke laste lag:', error);
      setAvailableTeams(['turkis', 'oransje', 'grønn', 'svart']);
    }
  };

  const playEndSound = async () => {
    try {
      // Spill lyd 3 ganger for 2 sekunder totalt
      for (let i = 0; i < 3; i++) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
          { shouldPlay: true, volume: 1.0 }
        );
        await sound.playAsync();
        
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        await new Promise(resolve => setTimeout(resolve, 700));
      }
      
      Vibration.vibrate([0, 200, 100, 200, 100, 200]);
    } catch (error) {
      Vibration.vibrate([0, 500, 200, 500, 200, 500]);
    }
  };

  const handleGameEnd = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Cancel notification
    cancelNotification();
    
    playEndSound();
    
    if (!playingTeams) return;
    
    const [team1, team2] = playingTeams;
    const score1 = scores[team1];
    const score2 = scores[team2];
    
    if (score1 === score2) {
      // Uavgjort - sudden death!
      setScreen('sudden-death');
    } else {
      const winningTeam = score1 > score2 ? team1 : team2;
      const losingTeam = score1 > score2 ? team2 : team1;
      
      setWinner(winningTeam);
      setLoser(losingTeam);
      saveMatch(winningTeam, losingTeam, scores[winningTeam], scores[losingTeam]);
      setScreen('result');
    }
  };

  const handleSuddenDeathWinner = (winningTeam: Team) => {
    if (!playingTeams) return;
    
    const losingTeam = playingTeams[0] === winningTeam ? playingTeams[1] : playingTeams[0];
    
    setWinner(winningTeam);
    setLoser(losingTeam);
    saveMatch(winningTeam, losingTeam, scores[winningTeam], scores[losingTeam]);
    setScreen('result');
    
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const saveMatch = async (winner: Team, loser: Team, winnerScore: number, loserScore: number) => {
    try {
      const saved = await AsyncStorage.getItem('match_history');
      const history = saved ? JSON.parse(saved) : [];
      
      const match = {
        date: new Date().toISOString(),
        winner,
        loser,
        winnerScore,
        loserScore,
        duration: gameTime,
      };
      
      history.unshift(match);
      
      // Behold maks 50 kamper
      if (history.length > 50) {
        history.pop();
      }
      
      await AsyncStorage.setItem('match_history', JSON.stringify(history));
    } catch (error) {
      console.error('Kunne ikke lagre kamp:', error);
    }
  };

  const handleTeamSelection = (team1: Team, team2: Team) => {
    const waiting = availableTeams.filter(t => t !== team1 && t !== team2);
    
    setPlayingTeams([team1, team2]);
    setWaitingTeams(waiting);
    setSelected1(null);
    setSelected2(null);
    setScreen('set-time');
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleStartGame = () => {
    if (!playingTeams) return;
    
    setTimeRemaining(gameTime * 60);
    setIsPaused(false);
    setScores({
      turkis: 0,
      oransje: 0,
      grønn: 0,
      svart: 0,
      rød: 0,
      blå: 0,
    });
    setScreen('game');
    
    // Schedule notification
    scheduleGameEndNotification(gameTime * 60);
    
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const togglePause = async () => {
    if (!isPaused) {
      // Pausing - cancel notification
      await cancelNotification();
    } else {
      // Resuming - reschedule notification with remaining time
      await scheduleGameEndNotification(timeRemaining);
    }
    
    setIsPaused(!isPaused);
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleScore = (team: Team) => {
    if (isPaused) return;
    
    setScores((prev) => ({
      ...prev,
      [team]: prev[team] + 1,
    }));
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  const handleLongPress = (team: Team) => {
    if (isPaused) return;
    
    if (scores[team] > 0) {
      setScores((prev) => ({
        ...prev,
        [team]: prev[team] - 1,
      }));
      
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handleNextMatch = () => {
    if (!winner || !loser) return;
    
    const nextOpponent = waitingTeams[0];
    if (nextOpponent) {
      setPlayingTeams([winner, nextOpponent]);
      setWaitingTeams([loser, ...waitingTeams.slice(1)]);
    }
    
    setWinner(null);
    setLoser(null);
    setScreen('set-time');
  };

  const handleQuitGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Cancel notification
    cancelNotification();
    
    Alert.alert(
      'Avslutt spillet?',
      'Er du sikker på at du vil avslutte kampen?',
      [
        {
          text: 'Avbryt',
          style: 'cancel',
        },
        {
          text: 'Avslutt',
          style: 'destructive',
          onPress: () => {
            setScreen('select-teams');
            setPlayingTeams(null);
            setWaitingTeams([]);
            setTimeRemaining(0);
            setIsPaused(false);
            setScores({
              turkis: 0,
              oransje: 0,
              grønn: 0,
              svart: 0,
              rød: 0,
              blå: 0,
            });
            setWinner(null);
            setLoser(null);
            setSelected1(null);
            setSelected2(null);
            
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderSelectTeams = () => {
    const handleSelect = (team: Team) => {
      if (selected1 === null) {
        setSelected1(team);
      } else if (selected1 === team) {
        setSelected1(null);
      } else if (selected2 === null) {
        setSelected2(team);
        setTimeout(() => handleTeamSelection(selected1, team), 300);
      } else if (selected2 === team) {
        setSelected2(null);
      }
    };

    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Text style={styles.title}>Velg lag</Text>
        <Text style={styles.subtitle}>Trykk på to lag som skal spille</Text>
        
        <View style={styles.teamGrid}>
          {availableTeams.map((team) => {
            const isSelected = selected1 === team || selected2 === team;
            return (
              <TouchableOpacity
                key={team}
                style={[
                  styles.teamButton,
                  { backgroundColor: TEAMS[team].color },
                  isSelected && styles.teamButtonSelected,
                ]}
                onPress={() => handleSelect(team)}
                activeOpacity={0.8}
              >
                <Text style={styles.teamButtonText}>{TEAMS[team].name}</Text>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    );
  };

  const renderSetTime = () => (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.title}>Velg spilletid</Text>
      <Text style={styles.subtitle}>Hvor lenge skal kampen vare?</Text>
      
      <View style={styles.timeSelector}>
        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => setGameTime(Math.max(1, gameTime - 1))}
        >
          <Text style={styles.timeButtonText}>−</Text>
        </TouchableOpacity>
        
        <View style={styles.timeDisplay}>
          <Text style={styles.timeText}>{gameTime}</Text>
          <Text style={styles.timeLabel}>minutter</Text>
        </View>
        
        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => setGameTime(Math.min(30, gameTime + 1))}
        >
          <Text style={styles.timeButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {playingTeams && (
        <View style={styles.selectedTeams}>
          <View style={[styles.miniTeam, { backgroundColor: TEAMS[playingTeams[0]].color }]}>
            <Text style={styles.miniTeamText}>{TEAMS[playingTeams[0]].name}</Text>
          </View>
          <Text style={styles.vsText}>VS</Text>
          <View style={[styles.miniTeam, { backgroundColor: TEAMS[playingTeams[1]].color }]}>
            <Text style={styles.miniTeamText}>{TEAMS[playingTeams[1]].name}</Text>
          </View>
        </View>
      )}
      
      <TouchableOpacity
        style={styles.hajdeButton}
        onPress={handleStartGame}
        activeOpacity={0.9}
      >
        <Text style={styles.hajdeButtonText}>HAJDE!</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderGame = () => {
    if (!playingTeams) return null;
    
    return (
      <View style={styles.gameContainer}>
        <View style={styles.timerContainer}>
          <TouchableOpacity
            style={styles.quitButton}
            onPress={handleQuitGame}
            activeOpacity={0.7}
          >
            <Text style={styles.quitButtonText}>✕</Text>
          </TouchableOpacity>
          
          <Text style={[styles.timerText, isPaused && styles.timerTextPaused]}>
            {formatTime(timeRemaining)}
          </Text>
          
          <TouchableOpacity
            style={styles.pauseButton}
            onPress={togglePause}
            activeOpacity={0.7}
          >
            <Text style={styles.pauseButtonText}>{isPaused ? '▶' : '⏸'}</Text>
          </TouchableOpacity>
        </View>
        
        {isPaused && (
          <View style={styles.pauseOverlay}>
            <Text style={styles.pauseText}>PAUSE</Text>
          </View>
        )}
        
        <View style={styles.scoreContainer}>
          <TouchableOpacity
            style={[
              styles.scoreButton,
              { backgroundColor: TEAMS[playingTeams[0]].color },
              isPaused && styles.scoreButtonDisabled
            ]}
            onPress={() => handleScore(playingTeams[0])}
            onLongPress={() => handleLongPress(playingTeams[0])}
            delayLongPress={500}
            activeOpacity={0.9}
            disabled={isPaused}
          >
            <Animated.View style={[styles.scoreContent, { transform: [{ scale: scaleAnim }] }]}>
              <Text style={styles.scoreTeamName}>{TEAMS[playingTeams[0]].name}</Text>
              <Text style={styles.scoreNumber}>{scores[playingTeams[0]]}</Text>
            </Animated.View>
          </TouchableOpacity>
          
          <View style={styles.scoreDivider}>
            <Text style={styles.scoreDividerText}>VS</Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.scoreButton,
              { backgroundColor: TEAMS[playingTeams[1]].color },
              isPaused && styles.scoreButtonDisabled
            ]}
            onPress={() => handleScore(playingTeams[1])}
            onLongPress={() => handleLongPress(playingTeams[1])}
            delayLongPress={500}
            activeOpacity={0.9}
            disabled={isPaused}
          >
            <Animated.View style={[styles.scoreContent, { transform: [{ scale: scaleAnim }] }]}>
              <Text style={styles.scoreTeamName}>{TEAMS[playingTeams[1]].name}</Text>
              <Text style={styles.scoreNumber}>{scores[playingTeams[1]]}</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
        
        {waitingTeams.length > 0 && (
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingTitle}>Venter:</Text>
            <View style={styles.waitingTeams}>
              {waitingTeams.map((team) => (
                <View
                  key={team}
                  style={[styles.waitingTeam, { backgroundColor: TEAMS[team].color }]}
                >
                  <Text style={styles.waitingTeamText}>{TEAMS[team].name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        <Text style={styles.hintText}>
          Trykk for å score • Hold inne for å fjerne
        </Text>
      </View>
    );
  };

  const renderSuddenDeath = () => {
    if (!playingTeams) return null;
    
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Text style={styles.resultTitle}>⚡</Text>
        <Text style={styles.resultSubtitle}>Sudden Death!</Text>
        <Text style={styles.suddenDeathText}>
          Kampen endte {scores[playingTeams[0]]} - {scores[playingTeams[1]]}
        </Text>
        <Text style={styles.suddenDeathSubtext}>
          Hvem vant straffesparkkonkurransen?
        </Text>
        
        <View style={styles.suddenDeathButtons}>
          <TouchableOpacity
            style={[styles.suddenDeathButton, { backgroundColor: TEAMS[playingTeams[0]].color }]}
            onPress={() => handleSuddenDeathWinner(playingTeams[0])}
            activeOpacity={0.9}
          >
            <Text style={styles.suddenDeathButtonText}>{TEAMS[playingTeams[0]].name}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.suddenDeathButton, { backgroundColor: TEAMS[playingTeams[1]].color }]}
            onPress={() => handleSuddenDeathWinner(playingTeams[1])}
            activeOpacity={0.9}
          >
            <Text style={styles.suddenDeathButtonText}>{TEAMS[playingTeams[1]].name}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderResult = () => {
    if (!winner || !loser) return null;
    
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Text style={styles.resultTitle}>🏆</Text>
        <Text style={styles.resultSubtitle}>Vinner!</Text>
        
        <View style={[styles.winnerCard, { backgroundColor: TEAMS[winner].color }]}>
          <Text style={styles.winnerName}>{TEAMS[winner].name}</Text>
          <Text style={styles.winnerScore}>{scores[winner]}</Text>
        </View>
        
        <View style={styles.resultScores}>
          <Text style={styles.resultScoreText}>
            {TEAMS[winner].name} {scores[winner]} - {scores[loser]} {TEAMS[loser].name}
          </Text>
        </View>
        
        {waitingTeams.length > 0 && (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNextMatch}
          >
            <Text style={styles.nextButtonText}>Neste kamp</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setScreen('select-teams');
            setWinner(null);
            setLoser(null);
          }}
        >
          <Text style={styles.backButtonText}>Ny kamp</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (availableTeams.length < 2) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Ingen lag valgt</Text>
        <Text style={styles.emptyText}>
          Gå til Hjem-fanen og velg hvilke lag som skal spille i dag
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {screen === 'select-teams' && renderSelectTeams()}
      {screen === 'set-time' && renderSetTime()}
      {screen === 'game' && renderGame()}
      {screen === 'sudden-death' && renderSuddenDeath()}
      {screen === 'result' && renderResult()}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#6e6e73',
    marginBottom: 48,
    fontWeight: '500',
    textAlign: 'center',
  },
  teamGrid: {
    width: '100%',
    gap: 16,
  },
  teamButton: {
    width: '100%',
    height: 70,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  teamButtonSelected: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.25,
  },
  teamButtonText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.5,
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
    marginBottom: 48,
  },
  timeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007aff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007aff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  timeButtonText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
  timeDisplay: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 72,
    fontWeight: '700',
    color: '#1d1d1f',
    letterSpacing: -2,
  },
  timeLabel: {
    fontSize: 17,
    color: '#6e6e73',
    fontWeight: '500',
    marginTop: -8,
  },
  selectedTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  miniTeam: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  miniTeamText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  vsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6e6e73',
  },
  hajdeButton: {
    width: '100%',
    height: 64,
    borderRadius: 16,
    backgroundColor: '#34c759',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#34c759',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  hajdeButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  gameContainer: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  timerContainer: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: '#f5f5f7',
    borderBottomWidth: 0,
    borderBottomColor: '#e5e5ea',
    position: 'relative',
  },
  quitButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff3b30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  quitButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
    marginTop: -2,
  },
  pauseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007aff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007aff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  pauseButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  timerText: {
    fontSize: 56,
    fontWeight: '700',
    color: '#1d1d1f',
    letterSpacing: -1,
  },
  timerTextPaused: {
    color: '#ff9500',
  },
  pauseOverlay: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#ff9500',
  },
  pauseText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ff9500',
    letterSpacing: 2,
  },
  scoreContainer: {
    flex: 1,
    padding: 20,
    gap: 20,
  },
  scoreButton: {
    flex: 1,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  scoreButtonDisabled: {
    opacity: 0.6,
  },
  scoreContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  scoreTeamName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  scoreNumber: {
    fontSize: 72,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -3,
  },
  scoreDivider: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreDividerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6e6e73',
  },
  waitingContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  waitingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6e6e73',
    marginBottom: 8,
  },
  waitingTeams: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  waitingTeam: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  waitingTeamText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  hintText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6e6e73',
    paddingBottom: 32,
    fontWeight: '500',
  },
  suddenDeathText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  suddenDeathSubtext: {
    fontSize: 16,
    color: '#6e6e73',
    marginBottom: 32,
    textAlign: 'center',
  },
  suddenDeathButtons: {
    width: '100%',
    gap: 16,
  },
  suddenDeathButton: {
    width: '100%',
    height: 70,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  suddenDeathButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  resultTitle: {
    fontSize: 80,
    marginBottom: 16,
  },
  resultSubtitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 32,
  },
  winnerCard: {
    width: '100%',
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  winnerName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  winnerScore: {
    fontSize: 72,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -2,
  },
  resultScores: {
    marginBottom: 32,
  },
  resultScoreText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6e6e73',
  },
  nextButton: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    backgroundColor: '#007aff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#007aff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  backButton: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007aff',
  },
});