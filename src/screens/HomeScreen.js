// src/screens/HomeScreen.js
//
// Apple Fitness-inspired home screen with ESP32 session data and anomaly tracking.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getLatestSession, setBaseUrl, getAllSessions, startExercise, stopExercise, EXERCISES } from '../api/esp32Service';
import { saveSession, getSessions } from '../api/sessionStorage';
import FormScoreGauge from '../components/FormScoreGauge';
import VideoStream from '../components/VideoStream';
import { colors, shadows, borderRadius } from '../theme';

function getScoreColor(score) {
  if (score >= 80) return colors.ringGreen;
  if (score >= 55) return colors.warning;
  return colors.ringRed;
}

function FadeInView({ delay = 0, children, style }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[{ opacity }, style]}>
      {children}
    </Animated.View>
  );
}

function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Exercise dropdown selector component
function ExerciseDropdown({ onSelectExercise, onStartExercise, onStopExercise, activeExercise, startingExercise, stoppingExercise }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleSelect = (exercise) => {
    setSelectedExercise(exercise);
    setIsOpen(false);
    setShowDetails(true);
  };

  const handleStart = async () => {
    if (selectedExercise) {
      onStartExercise(selectedExercise);
    }
  };

  const handleStop = async () => {
    onStopExercise();
  };

  const handleCancel = () => {
    setSelectedExercise(null);
    setShowDetails(false);
  };

  const isRunning = activeExercise && activeExercise.name === selectedExercise.name;

  if (showDetails && selectedExercise) {
    return (
      <View style={styles.exerciseDetails}>
        <View style={styles.exerciseDetailsHeader}>
          <View style={styles.exerciseIcon}>
            <Ionicons name="barbell" size={24} color={colors.purple} />
          </View>
          <View style={styles.exerciseText}>
            <Text style={styles.exerciseName}>{selectedExercise.name}</Text>
            <Text style={styles.exerciseLabel}>
              {isRunning ? '● Live' : 'Selected Exercise'}
            </Text>
          </View>
          {isRunning && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>

        {/* Video Stream */}
        {isRunning && (
          <View style={styles.videoContainer}>
            <VideoStream
              url="http://172.20.10.5:8080/stream"
              style={styles.videoStream}
            />
          </View>
        )}

        <View style={styles.placementInfo}>
          <View style={styles.placementRow}>
            <View style={styles.placementIcon}>
              <Ionicons name="location" size={16} color={colors.primary} />
            </View>
            <View style={styles.placementText}>
              <Text style={styles.placementLabel}>Band Location</Text>
              <Text style={styles.placementValue}>{selectedExercise.bandLocation}</Text>
            </View>
          </View>

          <View style={styles.placementRow}>
            <View style={styles.placementIcon}>
              <Ionicons name="navigate" size={16} color={colors.primary} />
            </View>
            <View style={styles.placementText}>
              <Text style={styles.placementLabel}>Exact Position</Text>
              <Text style={styles.placementValue}>{selectedExercise.position}</Text>
            </View>
          </View>

          <View style={styles.placementRow}>
            <View style={styles.placementIcon}>
              <Ionicons name="eye" size={16} color={colors.primary} />
            </View>
            <View style={styles.placementText}>
              <Text style={styles.placementLabel}>Sensor Facing</Text>
              <Text style={styles.placementValue}>{selectedExercise.sensorFacing}</Text>
            </View>
          </View>
        </View>

        <View style={styles.exerciseButtons}>
          {!isRunning ? (
            <>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleCancel} 
                disabled={startingExercise}
              >
                <Text style={styles.cancelButtonText}>Change</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.startButton, startingExercise && { opacity: 0.7 }]}
                onPress={handleStart}
                disabled={startingExercise}
              >
                {startingExercise ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="play" size={18} color="#fff" />
                )}
                <Text style={styles.startButtonText}>
                  {startingExercise ? 'Starting...' : 'Start Exercise'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.stopButton, stoppingExercise && { opacity: 0.7 }]}
              onPress={handleStop}
              disabled={stoppingExercise}
            >
              {stoppingExercise ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="stop" size={18} color="#fff" />
              )}
              <Text style={styles.stopButtonText}>
                {stoppingExercise ? 'Stopping...' : 'Stop Exercise'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={styles.dropdownTrigger}
        onPress={() => setIsOpen(!isOpen)}
      >
        <View style={styles.dropdownLeft}>
          <Ionicons name="barbell" size={18} color={colors.textSecondary} />
          <Text style={styles.dropdownText}>
            Select Exercise to Start
          </Text>
        </View>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdownMenu}>
          <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
            {EXERCISES.map((exercise, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.dropdownItem}
                onPress={() => handleSelect(exercise)}
              >
                <Text style={styles.dropdownItemText}>{exercise.name}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// Anomaly pill for a single session
function SessionAnomalyRow({ session }) {
  const score = session.form_score;
  const color = getScoreColor(score);
  const hasAnomalies = session.anomalies && session.anomalies.length > 0;

  return (
    <View style={styles.anomalySessionCard}>
      <View style={styles.anomalySessionHeader}>
        <Text style={styles.anomalySessionId} numberOfLines={1}>
          {session.display_name || session.session_id}
        </Text>
        <Text style={styles.anomalySessionTime}>
          {formatDate(session.timestamp)}
        </Text>
      </View>
      {hasAnomalies ? (
        <View style={styles.anomalyPillRow}>
          {session.anomalies.map((flag, i) => (
            <View key={i} style={[styles.anomalyPill, { backgroundColor: `${color}15` }]}>
              <View style={[styles.anomalyPillDot, { backgroundColor: color }]} />
              <Text style={[styles.anomalyPillText, { color }]} numberOfLines={1}>
                {flag.replace(/_/g, ' ')}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.cleanRow}>
          <Ionicons name="checkmark-circle" size={13} color={colors.ringGreen} />
          <Text style={styles.cleanText}>No anomalies</Text>
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const [ipAddress, setIpAddress] = useState('');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allSessions, setAllSessions] = useState([]);
  const [startingExercise, setStartingExercise] = useState(false);
  const [activeExercise, setActiveExercise] = useState(null);
  const [stoppingExercise, setStoppingExercise] = useState(false);
  const navigation = useNavigation();

  const loadAllSessions = async () => {
    try {
      try {
        const remote = await getAllSessions();
        setAllSessions(remote);
      } catch {
        const local = await getSessions();
        setAllSessions(local);
      }
    } catch (err) {
      console.error('Failed to load sessions from all sources:', err);
    }
  };

  useEffect(() => {
    loadAllSessions();
  }, []);

  const handleStartExercise = async (exercise) => {
    setStartingExercise(true);
    try {
      await startExercise({
        exercise: exercise.name.toLowerCase(),
        camera: 0,
        imu: false,
        imu_mode: 'interface',
        stream_port: 8080,
      });
      setActiveExercise(exercise);
      Alert.alert(
        'Exercise Started',
        `${exercise.name} tracking has started. Video stream is now available at ${exercise.bandLocation.toLowerCase()} - ${exercise.position.toLowerCase()}.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to start exercise:', error);
      Alert.alert(
        'Connection Failed',
        `Could not start ${exercise.name}. Make sure the server is connected and running.`,
        [{ text: 'OK' }]
      );
    } finally {
      setStartingExercise(false);
    }
  };

  const handleStopExercise = async () => {
    if (!activeExercise) return;
    
    setStoppingExercise(true);
    try {
      await stopExercise(activeExercise.name.toLowerCase());
      Alert.alert(
        'Exercise Stopped',
        `${activeExercise.name} session has been ended.`,
        [{ text: 'OK' }]
      );
      setActiveExercise(null);
    } catch (error) {
      console.error('Failed to stop exercise:', error);
      Alert.alert(
        'Error',
        `Could not stop ${activeExercise.name}. The session may have already ended.`,
        [{ text: 'OK' }]
      );
      setActiveExercise(null);
    } finally {
      setStoppingExercise(false);
    }
  };

  const handleFetch = async () => {
    if (ipAddress.trim()) setBaseUrl(ipAddress.trim());

    setLoading(true);
    try {
      const data = await getLatestSession();
      setSession(data);
      await saveSession(data);
      loadAllSessions();
    } catch {
      Alert.alert(
        'Connection Failed',
        'Could not reach the ESP32.\n\nCheck:\n• The IP address is correct\n• Both devices are on the same WiFi\n• The server is running',
      );
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = session ? getScoreColor(session.form_score) : null;

  const sortedSessions = useMemo(
    () => [...allSessions].sort((a, b) => b.timestamp - a.timestamp),
    [allSessions]
  );

  const totalAnomalies = useMemo(
    () =>
      allSessions.reduce(
        (sum, s) => sum + (s.anomalies ? s.anomalies.length : 0),
        0
      ),
    [allSessions]
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <FadeInView delay={0} style={styles.header}>
        <View>
          <Text style={styles.greeting}>TODAY</Text>
          <Text style={styles.title}>perForm</Text>
        </View>
        {allSessions.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeCount}>{allSessions.length}</Text>
            <Text style={styles.badgeLabel}>sessions</Text>
          </View>
        )}
      </FadeInView>

      {/* Exercise Selection Dropdown */}
      <FadeInView delay={50}>
        <ExerciseDropdown
          onStartExercise={handleStartExercise}
          onStopExercise={handleStopExercise}
          activeExercise={activeExercise}
          startingExercise={startingExercise}
          stoppingExercise={stoppingExercise}
        />
      </FadeInView>

      {/* ESP32 Connection Panel */}
      <FadeInView delay={100}>
        <View style={styles.card}>
          <View style={styles.connectHeader}>
            <View style={[styles.connectIcon, { backgroundColor: colors.primaryMuted }]}>
              <Ionicons name="hardware-chip" size={20} color={colors.primary} />
            </View>
            <View style={styles.connectText}>
              <Text style={styles.connectTitle}>ESP32 Device</Text>
              <Text style={styles.connectDesc}>
                Fetch latest session data from your device
              </Text>
            </View>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="192.168.1.105"
              placeholderTextColor={colors.textTertiary}
              value={ipAddress}
              onChangeText={setIpAddress}
              keyboardType="numeric"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.fetchButton, loading && styles.fetchButtonDisabled]}
              onPress={handleFetch}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="arrow-down" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </FadeInView>

      {/* Session Results */}
      {session && (
        <FadeInView delay={200} style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>SESSION RESULTS</Text>

          {/* Form Score */}
          <View style={styles.formScoreSection}>
            <FormScoreGauge score={session.form_score} />
          </View>

          {/* Performance Metrics */}
          <View style={styles.card}>
            <View style={styles.metricItem}>
              <View style={[styles.metricIcon, { backgroundColor: colors.primaryMuted }]}>
                <Ionicons name="repeat" size={18} color={colors.primary} />
              </View>
              <View style={styles.metricText}>
                <Text style={styles.metricValue}>{session.rep_count}</Text>
                <Text style={styles.metricLabel}>Repetitions</Text>
              </View>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <View style={[styles.metricIcon, { backgroundColor: colors.ringGreenMuted }]}>
                <Ionicons name="speedometer" size={18} color={colors.ringGreen} />
              </View>
              <View style={styles.metricText}>
                <Text style={[styles.metricValue, { color: colors.ringGreen }]}>
                  {session.avg_velocity}
                </Text>
                <Text style={styles.metricLabel}>Avg Velocity (m/s)</Text>
              </View>
            </View>
          </View>

          {/* View Reps Button */}
          {session._raw?.reps && session._raw.reps.length > 0 && (
            <TouchableOpacity
              style={styles.viewRepsButton}
              onPress={() =>
                navigation.navigate('RepDetail', { session })
              }
            >
              <Ionicons name="list" size={18} color={colors.ringBlue} />
              <Text style={styles.viewRepsText}>View Rep Breakdown</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.ringBlue} />
            </TouchableOpacity>
          )}

          {/* Session Anomalies */}
          {session.anomalies && session.anomalies.length > 0 ? (
            <View style={[styles.card, styles.analysisCard]}>
              <View style={styles.analysisHeader}>
                <Ionicons name="warning" size={16} color={colors.warning} />
                <Text style={styles.analysisTitle}>Form Anomalies</Text>
              </View>
              {session.anomalies.map((flag, i) => (
                <View
                  key={i}
                  style={[
                    styles.anomalyItem,
                    { backgroundColor: `${scoreColor}15` },
                  ]}
                >
                  <View style={[styles.anomalyDot, { backgroundColor: scoreColor }]} />
                  <Text style={[styles.anomalyText, { color: scoreColor }]}>
                    {flag.replace(/_/g, ' ')}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.card, styles.perfectCard]}>
              <View style={[styles.perfectIcon, { backgroundColor: colors.ringGreenMuted }]}>
                <Ionicons name="checkmark-circle" size={36} color={colors.ringGreen} />
              </View>
              <Text style={[styles.perfectTitle, { color: colors.ringGreen }]}>
                Perfect Form
              </Text>
              <Text style={styles.perfectDesc}>
                No anomalies detected. Great job!
              </Text>
            </View>
          )}

          <View style={styles.sessionIdRow}>
            <Ionicons name="shield-checkmark" size={14} color={colors.textTertiary} />
            <Text style={styles.sessionIdText}>{session.display_name}</Text>
          </View>
        </FadeInView>
      )}

      {/* All Sessions Anomalies */}
      {sortedSessions.length > 0 && (
        <FadeInView delay={300} style={styles.anomaliesSection}>
          <Text style={styles.sectionTitle}>
            ALL ANOMALIES · {totalAnomalies} total
          </Text>
          {sortedSessions.map((s) => (
            <SessionAnomalyRow key={s.session_id} session={s} />
          ))}
        </FadeInView>
      )}

      {/* Empty State */}
      {!session && !loading && sortedSessions.length === 0 && (
        <FadeInView delay={300} style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="bluetooth" size={48} color={colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>Ready to Track</Text>
          <Text style={styles.emptyDesc}>
            Connect your ESP32 device to view form scores, reps, and velocity
          </Text>
        </FadeInView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '700',
    letterSpacing: 2.5,
    marginBottom: 6,
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -1.5,
  },
  badge: {
    backgroundColor: colors.bgCard,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  badgeCount: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  badgeLabel: {
    fontSize: 9,
    color: colors.textTertiary,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Generic card
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xxl,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },

  // Connect
  connectHeader: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  connectIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectText: {
    flex: 1,
  },
  connectTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  connectDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgTertiary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  fetchButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fetchButtonDisabled: {
    backgroundColor: colors.textDisabled,
    opacity: 0.5,
  },

  // Results
  sectionTitle: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: 12,
  },
  resultsSection: {
    marginTop: 8,
  },
  formScoreSection: {
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricText: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  metricLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.border,
  },

  // View Reps button
  viewRepsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: `${colors.ringBlue}30`,
    marginBottom: 16,
    ...shadows.card,
  },
  viewRepsText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ringBlue,
    letterSpacing: 0.3,
  },

  // Analysis
  analysisCard: {},
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  analysisTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  anomalyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 10,
    marginBottom: 6,
  },
  anomalyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  anomalyText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  // Perfect form
  perfectCard: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  perfectIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perfectTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  perfectDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Session ID
  sessionIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  sessionIdText: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '600',
    fontFamily: 'monospace',
  },

  // All anomalies section
  anomaliesSection: {
    marginTop: 8,
  },
  anomalySessionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  anomalySessionHeader: {
    marginBottom: 10,
  },
  anomalySessionId: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  anomalySessionTime: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  anomalyPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  anomalyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  anomalyPillDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  anomalyPillText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  cleanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  cleanText: {
    fontSize: 13,
    color: colors.ringGreen,
    fontWeight: '600',
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 14,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  emptyDesc: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    paddingHorizontal: 24,
  },

  // Exercise Dropdown
  dropdownContainer: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 100,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dropdownMenu: {
    marginTop: 8,
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 300,
    ...shadows.card,
  },
  dropdownScroll: {
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1,
  },

  // Exercise Details
  exerciseDetails: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
    ...shadows.card,
  },
  exerciseDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  exerciseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.purple}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseText: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  exerciseLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '600',
    marginTop: 2,
  },
  placementInfo: {
    gap: 12,
  },
  placementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  placementIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  placementText: {
    flex: 1,
  },
  placementLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  placementValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
    lineHeight: 20,
  },
  exerciseButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.bgTertiary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  startButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  // Live Badge
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ff3b30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },

  // Video Stream
  videoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  videoStream: {
    height: 240,
  },

  // Stop Button
  stopButton: {
    flex: 1,
    backgroundColor: '#ff3b30',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stopButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
