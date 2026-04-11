// src/screens/StatsScreen.js
//
// Apple Fitness-inspired weekly progress and anomaly tracking.

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { getSessions } from '../api/sessionStorage';
import { getAllSessions } from '../api/esp32Service';
import { colors, shadows } from '../theme';

function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 24) return 'Today';
  if (diffHours < 48) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getTrend(sessions) {
  if (sessions.length < 2) return { direction: 'flat', value: '0' };
  const sorted = [...sessions].sort((a, b) => a.timestamp - b.timestamp);
  const half = Math.ceil(sorted.length / 2);
  const recent =
    sorted.slice(half).reduce((s, x) => s + x.form_score, 0) /
    (sorted.length - half);
  const older =
    sorted.slice(0, half).reduce((s, x) => s + x.form_score, 0) / half;
  const diff = recent - older;
  return {
    direction: diff > 2 ? 'up' : diff < -2 ? 'down' : 'flat',
    value: Math.abs(diff).toFixed(1),
  };
}

// Stat card (no mini ring — simpler)
function StatCard({ label, value, icon, color, trend }) {
  return (
    <View style={statStyles.card}>
      <View style={[statStyles.iconWrap, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
      {trend && (
        <View
          style={[
            statStyles.trend,
            {
              backgroundColor:
                trend.direction === 'up'
                  ? colors.ringGreenMuted
                  : trend.direction === 'down'
                  ? colors.ringRedMuted
                  : colors.bgTertiary,
            },
          ]}
        >
          <Ionicons
            name={
              trend.direction === 'up'
                ? 'trending-up'
                : trend.direction === 'down'
                ? 'trending-down'
                : 'remove'
            }
            size={10}
            color={
              trend.direction === 'up'
                ? colors.ringGreen
                : trend.direction === 'down'
                ? colors.ringRed
                : colors.textTertiary
            }
          />
          <Text
            style={[
              statStyles.trendText,
              {
                color:
                  trend.direction === 'up'
                    ? colors.ringGreen
                    : trend.direction === 'down'
                    ? colors.ringRed
                    : colors.textTertiary,
              },
            ]}
          >
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
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  value: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginBottom: 2,
  },
  label: {
    fontSize: 9,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '800',
  },
});

// Anomaly session card
function AnomalySession({ session }) {
  const score = session.form_score;
  const scoreColor =
    score >= 80 ? colors.ringGreen : score >= 55 ? colors.warning : colors.ringRed;

  return (
    <View style={anomalyStyles.sessionCard}>
      <View style={anomalyStyles.sessionHeader}>
        <View style={anomalyStyles.sessionInfo}>
          <Text style={anomalyStyles.sessionId} numberOfLines={1}>
            {session.session_id}
          </Text>
          <Text style={anomalyStyles.sessionTime}>
            {formatDate(session.timestamp)}
          </Text>
        </View>
        <View style={[anomalyStyles.scoreBadge, { backgroundColor: `${scoreColor}15` }]}>
          <Text style={[anomalyStyles.scoreText, { color: scoreColor }]}>
            {score}
          </Text>
        </View>
      </View>

      {session.anomalies && session.anomalies.length > 0 ? (
        <View style={anomalyStyles.anomalyList}>
          {session.anomalies.map((flag, i) => (
            <View
              key={i}
              style={[
                anomalyStyles.anomalyPill,
                { backgroundColor: `${scoreColor}15` },
              ]}
            >
              <View style={[anomalyStyles.anomalyDot, { backgroundColor: scoreColor }]} />
              <Text style={[anomalyStyles.anomalyText, { color: scoreColor }]}>
                {flag.replace(/_/g, ' ')}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={anomalyStyles.cleanRow}>
          <Ionicons name="checkmark-circle" size={14} color={colors.ringGreen} />
          <Text style={anomalyStyles.cleanText}>No anomalies</Text>
        </View>
      )}
    </View>
  );
}

const anomalyStyles = {
  sessionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionId: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  sessionTime: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  scoreBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  anomalyList: {
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
  anomalyDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  anomalyText: {
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
};

export default function StatsScreen() {
  const { width } = useWindowDimensions();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
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
    load();
  }, []);

  const summary = useMemo(() => {
    if (sessions.length === 0) return null;
    const avgScore = Math.round(
      sessions.reduce((s, x) => s + x.form_score, 0) / sessions.length
    );
    const avgVelocity = (
      sessions.reduce((s, x) => s + x.avg_velocity, 0) / sessions.length
    ).toFixed(2);
    const totalReps = sessions.reduce((s, x) => s + x.rep_count, 0);
    const totalAnomalies = sessions.reduce(
      (s, x) => s + (x.anomalies ? x.anomalies.length : 0),
      0
    );
    const trend = getTrend(sessions);
    return { avgScore, avgVelocity, totalReps, totalAnomalies, trend };
  }, [sessions]);

  const chartData = useMemo(() => {
    if (sessions.length === 0) return null;
    const sorted = [...sessions].sort((a, b) => a.timestamp - b.timestamp);
    const last10 = sorted.slice(-10);
    return {
      labels: last10.map((s) => formatDate(s.timestamp)),
      datasets: [{ data: last10.map((s) => s.form_score) }],
    };
  }, [sessions]);

  const weeklyData = useMemo(() => {
    if (sessions.length === 0) return [];
    const now = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart =
        new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 1000;
      const dayEnd = dayStart + 86400;
      const daySessions = sessions.filter(
        (s) => s.timestamp >= dayStart && s.timestamp < dayEnd
      );
      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
        fullLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
        sessions: daySessions.length,
        avgScore:
          daySessions.length > 0
            ? Math.round(
                daySessions.reduce((sum, s) => sum + s.form_score, 0) /
                  daySessions.length
              )
            : 0,
      });
    }
    return days;
  }, [sessions]);

  // All sessions sorted newest first for anomaly list
  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => b.timestamp - a.timestamp),
    [sessions]
  );

  // Chart width: fit within card with padding
  const chartWidth = Math.min(width - 80, 500);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="fitness" size={48} color={colors.textTertiary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={FadeInUp.duration(400)} style={styles.header}>
        <View>
          <Text style={styles.greeting}>PROGRESS</Text>
          <Text style={styles.title}>Activity</Text>
        </View>
        {sessions.length > 0 && (
          <View style={styles.sessionBadge}>
            <Text style={styles.sessionCount}>{sessions.length}</Text>
            <Text style={styles.sessionLabel}>sessions</Text>
          </View>
        )}
      </Animated.View>

      {sessions.length === 0 ? (
        <Animated.View entering={FadeInUp.delay(200)} style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="bar-chart" size={48} color={colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No Data Yet</Text>
          <Text style={styles.emptyDesc}>
            Complete workouts to see your progress here
          </Text>
        </Animated.View>
      ) : (
        <>
          {/* Stats grid */}
          {summary && (
            <Animated.View
              entering={FadeInDown.duration(500).delay(100)}
              style={styles.statsGrid}
            >
              <StatCard
                icon="fitness"
                label="Avg Score"
                value={summary.avgScore}
                color={colors.ringRed}
                trend={summary.trend}
              />
              <StatCard
                icon="speedometer"
                label="Avg Vel"
                value={summary.avgVelocity}
                color={colors.ringGreen}
              />
              <StatCard
                icon="alert-circle"
                label="Anomalies"
                value={summary.totalAnomalies}
                color={colors.warning}
              />
            </Animated.View>
          )}

          {/* Weekly overview */}
          {weeklyData.length > 0 && (
            <Animated.View
              entering={FadeInUp.duration(500).delay(200)}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>WEEKLY OVERVIEW</Text>
              <View style={styles.weeklyCard}>
                <View style={styles.weeklyBars}>
                  {weeklyData.map((day, i) => (
                    <View key={i} style={styles.barColumn}>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: `${Math.max(day.avgScore, 4)}%`,
                              backgroundColor:
                                day.avgScore >= 80
                                  ? colors.ringGreen
                                  : day.avgScore >= 55
                                  ? colors.warning
                                  : colors.ringRed,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.barLabel,
                          day.sessions > 0 && styles.barLabelActive,
                        ]}
                      >
                        {day.label}
                      </Text>
                      {day.sessions > 0 && <View style={styles.barDot} />}
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
          )}

          {/* Chart — clamped width */}
          {chartData && (
            <Animated.View
              entering={FadeInUp.duration(500).delay(300)}
              style={styles.section}
            >
              <View style={styles.chartHeader}>
                <View style={[styles.chartIcon, { backgroundColor: colors.ringRedMuted }]}>
                  <Ionicons name="trending-up" size={16} color={colors.ringRed} />
                </View>
                <Text style={styles.chartLabel}>Form Score Trend</Text>
              </View>
              <View style={styles.chartWrap}>
                <LineChart
                  data={chartData}
                  width={chartWidth}
                  height={180}
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
                    color: () => colors.ringRed,
                    labelColor: () => colors.textTertiary,
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: colors.ringRed,
                      fill: colors.bgPrimary,
                    },
                    propsForBackgroundLines: {
                      stroke: colors.border,
                      strokeDasharray: '6,6',
                      strokeOpacity: 0.3,
                    },
                    fillShadowGradient: colors.ringRed,
                    fillShadowGradientOpacity: 0.15,
                  }}
                  style={{ borderRadius: 12 }}
                  fromZero
                />
              </View>
            </Animated.View>
          )}

          {/* Anomalies list */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(400)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>ANOMALIES</Text>
            {sortedSessions.map((session) => (
              <AnomalySession key={session.session_id} session={session} />
            ))}
          </Animated.View>
        </>
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
  sessionBadge: {
    backgroundColor: colors.bgCard,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  sessionCount: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  sessionLabel: {
    fontSize: 9,
    color: colors.textTertiary,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },

  // Weekly
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: 10,
  },
  weeklyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  weeklyBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  barTrack: {
    width: 20,
    height: 90,
    backgroundColor: colors.bgTertiary,
    borderRadius: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 10,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: colors.textDisabled,
    fontWeight: '700',
  },
  barLabelActive: {
    color: colors.textSecondary,
  },
  barDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textPrimary,
  },

  // Chart
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  chartIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  chartWrap: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    overflow: 'hidden',
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingVertical: 80,
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
});
