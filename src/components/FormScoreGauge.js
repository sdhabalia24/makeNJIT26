// src/components/FormScoreGauge.js
//
// Apple Fitness-style activity ring gauge for form score display.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, shadows } from '../theme';

function getScoreInfo(score) {
  if (score >= 80) return { 
    color: colors.ringGreen,
    gradient: colors.gradients.velocity,
    label: 'EXCELLENT FORM',
    icon: 'checkmark-circle',
    description: 'Your technique is on point'
  };
  if (score >= 55) return { 
    color: colors.warning,
    gradient: colors.gradients.warmOrange,
    label: 'GOOD FORM',
    icon: 'trending-up',
    description: 'Room for improvement'
  };
  return { 
    color: colors.ringRed,
    gradient: colors.gradients.formScore,
    label: 'NEEDS WORK',
    icon: 'warning',
    description: 'Focus on your technique'
  };
}

// Apple Fitness-style ring with gradient and glow
function FitnessRing({ size, strokeWidth, progress, gradientColors }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fillOffset = circumference * (1 - progress / 100);

  return (
    <Svg width={size} height={size} style={styles.svg}>
      <Defs>
        <LinearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={gradientColors[0]} stopOpacity="1" />
          <Stop offset="100%" stopColor={gradientColors[1]} stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id="bgRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={gradientColors[0]} stopOpacity="0.2" />
          <Stop offset="100%" stopColor={gradientColors[1]} stopOpacity="0.2" />
        </LinearGradient>
      </Defs>
      
      {/* Background ring */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#bgRingGradient)"
        strokeWidth={strokeWidth}
        fill="none"
        opacity={0.3}
      />
      
      {/* Progress ring */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#ringGradient)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={fillOffset}
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
        style={{
          shadowColor: gradientColors[0],
          shadowOpacity: 0.8,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 0 },
        }}
      />
    </Svg>
  );
}

export default function FormScoreGauge({ score }) {
  const info = getScoreInfo(score);
  const ringSize = 180;
  const strokeWidth = 18;

  return (
    <View style={styles.container}>
      {/* Main ring gauge */}
      <View style={styles.ringContainer}>
        {/* Outer glow */}
        <View style={[styles.outerGlow, { backgroundColor: `${info.color}15` }]} />
        
        {/* Activity ring */}
        <FitnessRing 
          size={ringSize} 
          strokeWidth={strokeWidth} 
          progress={score}
          gradientColors={info.gradient}
        />
        
        {/* Center score */}
        <View style={styles.centerContent}>
          <Text style={[styles.scoreValue, { color: info.color }]}>{score}</Text>
          <Text style={styles.scoreLabel}>SCORE</Text>
        </View>
      </View>
      
      {/* Label section */}
      <View style={styles.labelContainer}>
        <Text style={[styles.statusLabel, { color: info.color }]}>{info.label}</Text>
        <Text style={styles.descriptionText}>{info.description}</Text>
      </View>

      {/* Mini stats */}
      <View style={styles.miniStats}>
        <View style={styles.miniStatItem}>
          <Text style={styles.miniStatLabel}>Target</Text>
          <Text style={styles.miniStatValue}>80+</Text>
        </View>
        <View style={styles.miniStatDivider} />
        <View style={styles.miniStatItem}>
          <Text style={styles.miniStatLabel}>Status</Text>
          <Text style={[styles.miniStatValue, { color: info.color }]}>
            {score >= 80 ? '✓ Hit' : score >= 55 ? '~ Close' : '✗ Below'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.cardElevated,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  outerGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.5,
  },
  svg: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: '800',
    lineHeight: 60,
    letterSpacing: -2,
  },
  scoreLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 2,
  },
  labelContainer: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 4,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  descriptionText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  miniStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 20,
  },
  miniStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  miniStatLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  miniStatValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  miniStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
});
