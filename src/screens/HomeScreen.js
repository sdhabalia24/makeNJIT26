// src/screens/HomeScreen.js
//
// Apple Fitness-inspired home screen with vibrant metrics and modern card layout.

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { getLatestSession, setBaseUrl } from '../api/esp32Service';
import { saveSession } from '../api/sessionStorage';
import FormScoreGauge from '../components/FormScoreGauge';
import { colors, borderRadius, shadows } from '../theme';

function getScoreColor(score) {
  if (score >= 80) return colors.ringGreen;
  if (score >= 55) return colors.warning;
  return colors.ringRed;
}

// Metric Ring Component - Apple Fitness style
function MetricRing({ value, max, label, unit, color, gradient, icon }) {
  const percentage = Math.min((value / max) * 100, 100);
  const size = 80;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fillOffset = circumference * (1 - percentage / 100);

  return (
    <View style={metricRingStyles.container}>
      <View style={metricRingStyles.ringWrapper}>
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id={`grad-${icon}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={gradient[0]} />
              <Stop offset="100%" stopColor={gradient[1]} />
            </LinearGradient>
          </Defs>
          
          {/* Background ring */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.bgTertiary}
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.4}
          />
          
          {/* Progress ring */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#grad-${icon})`}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={fillOffset}
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
            style={{
              shadowColor: color,
              shadowOpacity: 0.7,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 0 },
            }}
          />
        </Svg>
        
        <View style={metricRingStyles.centerText}>
          <Text style={[metricRingStyles.value, { color }]}>{value}</Text>
          <Text style={metricRingStyles.unit}>{unit}</Text>
        </View>
      </View>
      <Text style={metricRingStyles.label}>{label}</Text>
    </View>
  );
}

const metricRingStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  ringWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: 9,
    color: colors.textTertiary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default function HomeScreen() {
  const [ipAddress, setIpAddress] = useState('');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    if (ipAddress.trim()) setBaseUrl(ipAddress.trim());

    setLoading(true);
    try {
      const data = await getLatestSession();
      setSession(data);
      await saveSession(data);
    } catch {
      Alert.alert(
        'Connection Failed',
        'Could not reach the ESP32.\n\nCheck:\n• The IP address is correct\n• Both devices are on the same WiFi\n• The server is running',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.pageContainer}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>TODAY'S ACTIVITY</Text>
            <Text style={styles.title}>perForm</Text>
          </View>
          <View style={[styles.statusIndicator, session && styles.statusIndicatorActive]}>
            <View style={[styles.statusDot, session && styles.statusDotActive]} />
            {session && <Text style={styles.statusTextActive}>LIVE</Text>}
          </View>
        </View>

        {/* Connection Panel */}
        <View style={styles.connectionPanel}>
          <View style={styles.connectionHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="hardware-chip" size={22} color={colors.primary} />
            </View>
            <View style={styles.connectionText}>
              <Text style={styles.panelTitle}>Connect ESP32</Text>
              <Text style={styles.panelDesc}>Enter device IP to fetch session data</Text>
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
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleFetch}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="arrow-down-circle" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Fetch</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Session Results */}
        {session && (
          <>
            {/* Score Ring */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="fitness" size={20} color={colors.ringRed} />
                <Text style={styles.sectionTitle}>FORM SCORE</Text>
              </View>
              <FormScoreGauge score={session.form_score} />
            </View>

            {/* Metrics Rings */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="analytics" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>PERFORMANCE</Text>
              </View>
              <View style={styles.metricsContainer}>
                <MetricRing 
                  value={session.rep_count} 
                  max={50} 
                  label="Repetitions" 
                  unit="reps"
                  color={colors.primary}
                  gradient={colors.gradients.reps}
                  icon="repeat"
                />
                <View style={styles.metricDivider} />
                <MetricRing 
                  value={session.avg_velocity} 
                  max={5} 
                  label="Avg Velocity" 
                  unit="m/s"
                  color={colors.ringGreen}
                  gradient={colors.gradients.velocity}
                  icon="speedometer"
                />
              </View>
            </View>

            {/* Session Info */}
            <View style={styles.infoCard}>
              <Ionicons name="shield-checkmark" size={18} color={colors.textTertiary} />
              <Text style={styles.sessionId}>{session.session_id}</Text>
            </View>

            {/* Form Analysis */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="warning" size={20} color={colors.warning} />
                <Text style={styles.sectionTitle}>FORM ANALYSIS</Text>
              </View>
              <View style={styles.analysisCard}>
                {session.anomalies && session.anomalies.length > 0 ? (
                  <View style={styles.anomalyList}>
                    {session.anomalies.map((flag, i) => {
                      const flagColor = getScoreColor(Math.max(0, 100 - session.anomalies.length * 15));
                      return (
                        <View key={i} style={[styles.anomalyItem, { backgroundColor: `${flagColor}20` }]}>
                          <View style={[styles.anomalyIndicator, { backgroundColor: flagColor }]} />
                          <Text style={[styles.anomalyText, { color: flagColor }]}>
                            {flag.replace(/_/g, ' ')}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.perfectForm}>
                    <View style={[styles.perfectIconContainer, { backgroundColor: colors.ringGreenMuted }]}>
                      <Ionicons name="checkmark-circle" size={32} color={colors.ringGreen} />
                    </View>
                    <Text style={styles.perfectTitle}>Perfect Form</Text>
                    <Text style={styles.perfectDesc}>No anomalies detected. Great job!</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        {/* Empty state */}
        {!session && !loading && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="bluetooth" size={56} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Ready to Track</Text>
            <Text style={styles.emptyText}>
              Connect your ESP32 device to view form scores, reps, and velocity metrics
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: { 
    flex: 1, 
    backgroundColor: colors.bgPrimary 
  },
  container: { 
    flex: 1,
  },
  content: { 
    padding: 20, 
    paddingTop: 28, 
    paddingBottom: 40 
  },

  // Header
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 24 
  },
  greeting: { 
    fontSize: 11, 
    color: colors.textTertiary, 
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: { 
    fontSize: 40, 
    fontWeight: '900', 
    color: colors.textPrimary, 
    letterSpacing: -1.5,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusIndicatorActive: {
    borderColor: colors.ringGreen,
    backgroundColor: `${colors.ringGreen}15`,
  },
  statusDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: colors.textTertiary,
  },
  statusDotActive: {
    backgroundColor: colors.ringGreen,
    shadowColor: colors.ringGreen,
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  statusTextActive: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.ringGreen,
    letterSpacing: 0.5,
  },

  // Connection Panel
  connectionPanel: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionText: {
    flex: 1,
  },
  panelTitle: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: colors.textPrimary, 
    marginBottom: 4,
  },
  panelDesc: { 
    fontSize: 13, 
    color: colors.textSecondary,
    lineHeight: 18,
  },
  inputRow: { 
    flexDirection: 'row', 
    gap: 10 
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
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  buttonDisabled: { 
    backgroundColor: colors.textDisabled,
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 15,
    letterSpacing: 0.3,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 1.5,
  },

  // Metrics
  metricsContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  metricDivider: {
    width: 1,
    height: 80,
    backgroundColor: colors.border,
  },

  // Info Card
  infoCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionId: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },

  // Analysis Card
  analysisCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  anomalyList: {
    gap: 10,
  },
  anomalyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  anomalyIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  anomalyText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
    letterSpacing: 0.2,
  },
  perfectForm: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  perfectIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perfectTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.ringGreen,
    letterSpacing: -0.3,
  },
  perfectDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Empty State
  emptyState: { 
    alignItems: 'center', 
    paddingVertical: 80,
    gap: 16,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  emptyText: { 
    fontSize: 15, 
    color: colors.textSecondary, 
    textAlign: 'center', 
    paddingHorizontal: 24,
    lineHeight: 22,
    fontWeight: '500',
  },
});
