// src/screens/RepDetailScreen.js
//
// Drill-down screen showing per-rep breakdown for a session.
// Displays each rep's form score, duration, avg accel, and violations.

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { colors, shadows, borderRadius } from '../theme';

function getScoreColor(score) {
  if (score >= 80) return colors.ringGreen;
  if (score >= 55) return colors.warning;
  return colors.ringRed;
}

function formatDuration(sec) {
  return sec.toFixed(1) + 's';
}

// ---------- Per-rep card ----------
function RepCard({ rep, index }) {
  const scoreColor = getScoreColor(rep.form_score);
  const hasViolations = rep.violations && rep.violations.length > 0;

  return (
    <Animated.View
      entering={FadeInUp.duration(300).delay(index * 50)}
      style={styles.repCard}
    >
      {/* Rep number + score badge */}
      <View style={styles.repHeader}>
        <View style={styles.repNumberWrap}>
          <Text style={styles.repNumber}>REP {rep.rep_number}</Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: `${scoreColor}18` }]}>
          <Text style={[styles.scoreValue, { color: scoreColor }]}>
            {rep.form_score}
          </Text>
        </View>
      </View>

      {/* Metrics row */}
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Ionicons name="time" size={14} color={colors.textTertiary} />
          <Text style={styles.metricValue}>{formatDuration(rep.duration)}</Text>
          <Text style={styles.metricLabel}>Duration</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <Ionicons name="pulse" size={14} color={colors.textTertiary} />
          <Text style={styles.metricValue}>{rep.avg_accel.toFixed(1)}</Text>
          <Text style={styles.metricLabel}>Avg Accel</Text>
        </View>
      </View>

      {/* Violations */}
      {hasViolations && (
        <View style={styles.violationsRow}>
          {rep.violations.map((v, i) => (
            <View
              key={i}
              style={[styles.violationPill, { backgroundColor: `${colors.error}15` }]}
            >
              <Ionicons name="warning" size={11} color={colors.error} />
              <Text style={[styles.violationText, { color: colors.error }]}>
                {v.replace(/_/g, ' ')}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Mini score bar */}
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.max(rep.form_score, 4)}%`,
              backgroundColor: scoreColor,
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

// ---------- Screen ----------
export default function RepDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  const { reps = [], exercise = '', avg_form_score = 0, rep_count = 0 } =
    route.params?.session?._raw || route.params || {};

  const chartData = useMemo(() => {
    if (!reps || reps.length === 0) return null;
    const sorted = [...reps].sort((a, b) => a.rep_number - b.rep_number);
    return {
      labels: sorted.map((r) => `R${r.rep_number}`),
      datasets: [{ data: sorted.map((r) => r.form_score) }],
    };
  }, [reps]);

  const chartWidth = Math.min(width - 80, 500);

  const avgDuration = reps.length
    ? (reps.reduce((s, r) => s + r.duration, 0) / reps.length).toFixed(1)
    : '0';

  const totalViolations = reps.reduce(
    (s, r) => s + (r.violations ? r.violations.length : 0),
    0
  );

  const bestRep = reps.length
    ? reps.reduce((best, r) => (r.form_score > best.form_score ? r : best))
    : null;

  const worstRep = reps.length
    ? reps.reduce((worst, r) => (r.form_score < worst.form_score ? r : worst))
    : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={FadeInUp.duration(400)} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          {rep_count > 0 && (
            <View style={styles.repCountBadge}>
              <Text style={styles.repCountValue}>{rep_count}</Text>
              <Text style={styles.repCountLabel}>reps</Text>
            </View>
          )}
        </View>

        {exercise && (
          <Text style={styles.exerciseName} numberOfLines={2}>
            {exercise}
          </Text>
        )}
        <View style={styles.titleRow}>
          <Text style={styles.greeting}>REP BREAKDOWN</Text>
        </View>
      </Animated.View>

      {/* Summary cards */}
      {reps.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Ionicons name="fitness" size={18} color={colors.ringGreen} />
            <Text style={[styles.summaryValue, { color: colors.ringGreen }]}>
              {avg_form_score || (reps.reduce((s, r) => s + r.form_score, 0) / reps.length).toFixed(0)}
            </Text>
            <Text style={styles.summaryLabel}>Avg Score</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="time" size={18} color={colors.ringBlue} />
            <Text style={[styles.summaryValue, { color: colors.ringBlue }]}>
              {avgDuration}s
            </Text>
            <Text style={styles.summaryLabel}>Avg Dur</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="warning" size={18} color={colors.warning} />
            <Text style={[styles.summaryValue, { color: colors.warning }]}>
              {totalViolations}
            </Text>
            <Text style={styles.summaryLabel}>Violations</Text>
          </View>
        </Animated.View>
      )}

      {/* Best / Worst rep */}
      {bestRep && worstRep && bestRep.rep_number !== worstRep.rep_number && (
        <Animated.View entering={FadeInUp.delay(200)} style={styles.bestWorstRow}>
          <View style={[styles.bestWorstCard, styles.bestCard]}>
            <Ionicons name="arrow-up-circle" size={16} color={colors.ringGreen} />
            <Text style={styles.bestWorstLabel}>Best</Text>
            <Text style={[styles.bestWorstValue, { color: colors.ringGreen }]}>
              Rep {bestRep.rep_number} · {bestRep.form_score}
            </Text>
          </View>
          <View style={[styles.bestWorstCard, styles.worstCard]}>
            <Ionicons name="arrow-down-circle" size={16} color={colors.error} />
            <Text style={styles.bestWorstLabel}>Worst</Text>
            <Text style={[styles.bestWorstValue, { color: colors.error }]}>
              Rep {worstRep.rep_number} · {worstRep.form_score}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Chart */}
      {chartData && (
        <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.section}>
          <View style={styles.chartHeader}>
            <Ionicons name="trending-up" size={14} color={colors.ringRed} />
            <Text style={styles.chartLabel}>Form Score by Rep</Text>
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

      {/* Rep list */}
      <Animated.View entering={FadeInUp.duration(500).delay(400)} style={styles.section}>
        <Text style={styles.sectionTitle}>
          ALL REPS · {reps.length} total
        </Text>
        {reps
          .sort((a, b) => a.rep_number - b.rep_number)
          .map((rep, i) => (
            <RepCard key={rep.rep_number} rep={rep} index={i} />
          ))}
      </Animated.View>

      {reps.length === 0 && (
        <Animated.View entering={FadeInUp.delay(300)} style={styles.empty}>
          <Ionicons name="list" size={48} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Rep Data</Text>
          <Text style={styles.emptyDesc}>
            Per-rep breakdown is not available for this session
          </Text>
        </Animated.View>
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
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
  },
  backText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  repCountBadge: {
    backgroundColor: colors.bgCard,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  repCountValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  repCountLabel: {
    fontSize: 9,
    color: colors.textTertiary,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  greeting: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  titleRow: {
    marginTop: 4,
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
    ...shadows.card,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  summaryLabel: {
    fontSize: 9,
    color: colors.textTertiary,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Best / Worst
  bestWorstRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  bestWorstCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    gap: 4,
  },
  bestCard: {
    backgroundColor: `${colors.ringGreen}10`,
    borderColor: `${colors.ringGreen}30`,
  },
  worstCard: {
    backgroundColor: `${colors.error}10`,
    borderColor: `${colors.error}30`,
  },
  bestWorstLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bestWorstValue: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  // Chart
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: 12,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  chartLabel: {
    fontSize: 15,
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

  // Rep card
  repCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xl,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  repHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  repNumberWrap: {},
  repNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textTertiary,
    letterSpacing: 2,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  metricLabel: {
    fontSize: 9,
    color: colors.textTertiary,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  metricDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  violationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  violationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  violationText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  barTrack: {
    height: 6,
    backgroundColor: colors.bgTertiary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    minHeight: 4,
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 14,
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
