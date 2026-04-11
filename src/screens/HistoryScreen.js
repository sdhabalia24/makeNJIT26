// src/screens/HistoryScreen.js
//
// Apple Fitness-inspired performance analytics dashboard.

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { LineChart } from 'react-native-chart-kit';
import { getSessions, clearSessions } from '../api/sessionStorage';
import { getAllSessions } from '../api/esp32Service';
import { colors, borderRadius, shadows } from '../theme';

const screenWidth = Dimensions.get('window').width;

// ── Helpers ──────────────────────────────────────────────────────
function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getScoreColor(score) {
  if (score >= 80) return { primary: colors.ringGreen, bg: colors.ringGreenMuted, light: `${colors.ringGreen}15` };
  if (score >= 55) return { primary: colors.warning, bg: colors.warningMuted, light: `${colors.warning}15` };
  return { primary: colors.ringRed, bg: colors.ringRedMuted, light: `${colors.ringRed}15` };
}

function getTrend(sessions) {
  if (sessions.length < 2) return null;
  const sorted = [...sessions].sort((a, b) => a.timestamp - b.timestamp);
  const half = Math.ceil(sorted.length / 2);
  const recent = sorted.slice(half).reduce((s, x) => s + x.form_score, 0) / (sorted.length - half);
  const older = sorted.slice(0, half).reduce((s, x) => s + x.form_score, 0) / half;
  const diff = recent - older;
  return { 
    direction: diff > 2 ? 'up' : diff < -2 ? 'down' : 'flat', 
    value: Math.abs(diff).toFixed(1) 
  };
}

// ── Animated Counter ─────────────────────────────────────────────
function AnimatedNumber({ value, style }) {
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    return () => anim.removeListener(id);
  }, [anim]);

  return <Text style={style}>{Number.isInteger(value) ? display : display.toFixed(2)}</Text>;
}

// ── Stat Card (Apple Fitness style) ──────────────────────────────
function StatCard({ label, value, icon, trend, ringColor }) {
  const scoreValue = typeof value === 'number' && value <= 100 ? value : 70;
  const colorScheme = getScoreColor(scoreValue);
  const activeColor = ringColor || colorScheme.primary;

  return (
    <View style={statStyles.card}>
      <View style={statStyles.ringContainer}>
        {/* Mini ring */}
        <Svg width={48} height={48}>
          <Defs>
            <LinearGradient id={`stat-grad-${icon}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={activeColor} />
              <Stop offset="100%" stopColor={activeColor} stopOpacity="0.7" />
            </LinearGradient>
          </Defs>
          <Circle
            cx={24}
            cy={24}
            r={20}
            stroke={colors.bgTertiary}
            strokeWidth={6}
            fill="none"
            opacity={0.3}
          />
          <Circle
            cx={24}
            cy={24}
            r={20}
            stroke={`url(#stat-grad-${icon})`}
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={125.6}
            strokeDashoffset={125.6 * 0.25}
            rotation="-90"
            origin="24, 24"
            style={{
              shadowColor: activeColor,
              shadowOpacity: 0.7,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 0 },
            }}
          />
        </Svg>
        <View style={statStyles.ringIcon}>
          <Ionicons name={icon} size={16} color={activeColor} />
        </View>
      </View>
      
      <View style={statStyles.textGroup}>
        <Text style={[statStyles.value, { color: activeColor }]}>{value}</Text>
        <Text style={statStyles.label}>{label}</Text>
      </View>
      
      {trend && (
        <View
          style={[
            statStyles.trendBadge,
            {
              backgroundColor:
                trend.direction === 'up' ? colors.ringGreenMuted 
                : trend.direction === 'down' ? colors.ringRedMuted 
                : colors.bgTertiary,
            },
          ]}>
          <Ionicons 
            name={trend.direction === 'up' ? 'trending-up' : trend.direction === 'down' ? 'trending-down' : 'remove'} 
            size={12} 
            color={
              trend.direction === 'up' ? colors.ringGreen 
              : trend.direction === 'down' ? colors.ringRed 
              : colors.textTertiary
            } 
          />
          <Text
            style={[
              statStyles.trendText,
              {
                color:
                  trend.direction === 'up' ? colors.ringGreen 
                  : trend.direction === 'down' ? colors.ringRed 
                  : colors.textTertiary,
              },
            ]}>
            {trend.value}%
          </Text>
        </View>
      )}
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  ringContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ringIcon: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: { 
    alignItems: 'center',
    flex: 1,
  },
  value: { 
    fontSize: 26, 
    fontWeight: '900', 
    letterSpacing: -1,
    marginBottom: 4,
  },
  label: { 
    fontSize: 10, 
    color: colors.textSecondary, 
    textTransform: 'uppercase', 
    letterSpacing: 1, 
    fontWeight: '700',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 10,
  },
  trendText: { 
    fontSize: 11, 
    fontWeight: '800',
  },
});

// ── Session Card (Apple Fitness style) ───────────────────────────
function SessionCard({ item }) {
  const colorScheme = getScoreColor(item.form_score);

  return (
    <View style={[sessionStyles.card, { borderLeftColor: colorScheme.primary }]}>
      <View style={sessionStyles.header}>
        <View style={sessionStyles.sessionInfo}>
          <Text style={sessionStyles.id}>{item.session_id}</Text>
          <View style={sessionStyles.timeContainer}>
            <Ionicons name="time" size={12} color={colors.textTertiary} />
            <Text style={sessionStyles.time}>{formatDate(item.timestamp)}</Text>
          </View>
        </View>
        <View style={[sessionStyles.scoreBadge, { backgroundColor: colorScheme.bg }]}>
          <Text style={[sessionStyles.scoreText, { color: colorScheme.primary }]}>{item.form_score}</Text>
        </View>
      </View>

      <View style={sessionStyles.metricsRow}>
        <View style={sessionStyles.metric}>
          <View style={[sessionStyles.metricIconContainer, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name="repeat" size={16} color={colors.primary} />
          </View>
          <Text style={sessionStyles.metricValue}>{item.rep_count}</Text>
          <Text style={sessionStyles.metricLabel}>Reps</Text>
        </View>
        <View style={sessionStyles.divider} />
        <View style={sessionStyles.metric}>
          <View style={[sessionStyles.metricIconContainer, { backgroundColor: colors.ringGreenMuted }]}>
            <Ionicons name="speedometer" size={16} color={colors.ringGreen} />
          </View>
          <Text style={sessionStyles.metricValue}>{item.avg_velocity}</Text>
          <Text style={sessionStyles.metricLabel}>m/s</Text>
        </View>
      </View>

      {item.anomalies && item.anomalies.length > 0 && (
        <View style={sessionStyles.flags}>
          {item.anomalies.map((flag, i) => (
            <View key={i} style={[sessionStyles.flag, { backgroundColor: colorScheme.light }]}>
              <View style={[sessionStyles.flagDot, { backgroundColor: colorScheme.primary }]} />
              <Text style={[sessionStyles.flagText, { color: colorScheme.primary }]}>
                {flag.replace(/_/g, ' ')}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const sessionStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 16,
  },
  sessionInfo: {
    flex: 1,
  },
  id: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: { 
    fontSize: 12, 
    color: colors.textTertiary,
    fontWeight: '500',
  },
  scoreBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: { 
    fontSize: 20, 
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgTertiary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  metric: { 
    flex: 1, 
    alignItems: 'center',
    gap: 6,
  },
  metricIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  metricLabel: { 
    fontSize: 10, 
    color: colors.textSecondary, 
    textTransform: 'uppercase', 
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  divider: { 
    width: 1, 
    height: 40, 
    backgroundColor: colors.border, 
    marginHorizontal: 16,
  },
  flags: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8,
  },
  flag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  flagDot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3,
  },
  flagText: { 
    fontSize: 12, 
    fontWeight: '700', 
    textTransform: 'capitalize',
    letterSpacing: 0.2,
  },
});

// ── Main Screen ──────────────────────────────────────────────────
export default function HistoryScreen() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadSessions = async () => {
    setLoading(true);
    try {
      try {
        const remote = await getAllSessions();
        setSessions(remote);
      } catch {
        const local = await getSessions();
        setSessions(local);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    Alert.alert('Clear History', 'Delete all session data?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await clearSessions();
          setSessions([]);
        },
      },
    ]);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // ── Derived Data ─────────────────────────────────────────────
  const summary = useMemo(() => {
    if (sessions.length === 0) return null;
    const avgScore = Math.round(sessions.reduce((s, x) => s + x.form_score, 0) / sessions.length);
    const avgVelocity = (sessions.reduce((s, x) => s + x.avg_velocity, 0) / sessions.length).toFixed(2);
    const totalReps = sessions.reduce((s, x) => s + x.rep_count, 0);
    const trend = getTrend(sessions);
    return { avgScore, avgVelocity, totalReps, trend };
  }, [sessions]);

  const chartData = useMemo(() => {
    if (sessions.length === 0) return null;
    const sorted = [...sessions].sort((a, b) => a.timestamp - b.timestamp);
    return {
      labels: sorted.map((s) => formatDate(s.timestamp)),
      datasets: [{ data: sorted.map((s) => s.form_score) }],
    };
  }, [sessions]);

  // ── Render ───────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : sessions.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="bar-chart" size={56} color={colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No Sessions Yet</Text>
          <Text style={styles.emptySubtitle}>
            Complete a workout to start tracking your progress
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Activity</Text>
              <Text style={styles.headerSubtitle}>
                {sessions.length} session{sessions.length !== 1 && 's'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <Ionicons name="trash" size={16} color={colors.ringRed} />
            </TouchableOpacity>
          </View>

          {/* Stats Grid */}
          {summary && (
            <View style={styles.statsGrid}>
              <StatCard
                icon="fitness"
                label="Avg Score"
                value={summary.avgScore}
                trend={summary.trend}
                ringColor={colors.ringRed}
              />
              <StatCard 
                icon="speedometer" 
                label="Avg Velocity" 
                value={`${summary.avgVelocity}`} 
                ringColor={colors.ringGreen}
              />
              <StatCard 
                icon="barbell" 
                label="Total Reps" 
                value={summary.totalReps} 
                ringColor={colors.primary}
              />
            </View>
          )}

          {/* Chart */}
          {chartData && (
            <View style={styles.chartWrap}>
              <View style={styles.chartHeader}>
                <View style={[styles.chartIconContainer, { backgroundColor: colors.ringRedMuted }]}>
                  <Ionicons name="trending-up" size={18} color={colors.ringRed} />
                </View>
                <Text style={styles.chartLabel}>Form Score Trend</Text>
              </View>
              <LineChart
                data={chartData}
                width={screenWidth - 80}
                height={200}
                withInnerLines
                withOuterLines={false}
                withDots
                withShadow
                bezier
                chartConfig={{
                  backgroundColor: colors.bgCard,
                  backgroundGradientFrom: colors.bgCard,
                  backgroundGradientTo: colors.bgCard,
                  decimalPlaces: 0,
                  color: (opacity = 1) => colors.ringRed,
                  labelColor: (opacity = 1) => colors.textSecondary,
                  style: { borderRadius: 16 },
                  propsForDots: { 
                    r: '4', 
                    strokeWidth: '3', 
                    stroke: colors.ringRed,
                    fill: colors.bgPrimary,
                  },
                  propsForBackgroundLines: { 
                    stroke: colors.border, 
                    strokeDasharray: '6,6',
                    strokeOpacity: 0.4,
                  },
                  fillShadowGradient: colors.ringRed,
                  fillShadowGradientOpacity: 0.25,
                }}
                style={styles.chart}
                fromZero
              />
            </View>
          )}

          {/* Session List */}
          <View style={styles.listHeader}>
            <View style={[styles.listIconContainer, { backgroundColor: colors.primaryMuted }]}>
              <Ionicons name="time" size={16} color={colors.primary} />
            </View>
            <Text style={styles.listTitle}>Recent Sessions</Text>
          </View>
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.session_id}
            renderItem={({ item }) => <SessionCard item={item} />}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        </ScrollView>
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.bgPrimary 
  },
  loader: { 
    flex: 1 
  },
  empty: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 40,
    gap: 16,
  },
  emptyIconContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { 
    fontSize: 26, 
    fontWeight: '900', 
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  emptySubtitle: { 
    fontSize: 15, 
    color: colors.textSecondary, 
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  scroll: { 
    paddingBottom: 32, 
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  headerTitle: { 
    fontSize: 40, 
    fontWeight: '900', 
    color: colors.textPrimary, 
    letterSpacing: -1.5,
  },
  headerSubtitle: { 
    fontSize: 13, 
    color: colors.textSecondary, 
    marginTop: 6,
    fontWeight: '600',
  },
  clearBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats
  statsGrid: { 
    flexDirection: 'row', 
    gap: 10, 
    marginBottom: 20,
  },

  // Chart
  chartWrap: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  chartIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartLabel: { 
    fontSize: 17, 
    fontWeight: '800', 
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  chart: { 
    borderRadius: 12, 
    marginVertical: -6,
  },

  // List
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  listIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  listContent: {
    paddingHorizontal: 0,
  },
});
