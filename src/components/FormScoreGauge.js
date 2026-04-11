// src/components/FormScoreGauge.js
//
// Displays the form score (0–100) as a large circular gauge.
// Color shifts from red → yellow → green based on the score.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function scoreColor(score) {
  if (score >= 80) return '#388E3C'; // green
  if (score >= 55) return '#F57C00'; // orange
  return '#C62828';                  // red
}

function scoreLabel(score) {
  if (score >= 80) return 'Great Form';
  if (score >= 55) return 'Needs Work';
  return 'Poor Form';
}

export default function FormScoreGauge({ score }) {
  const color = scoreColor(score);

  return (
    <View style={styles.container}>
      <View style={[styles.circle, { borderColor: color }]}>
        <Text style={[styles.score, { color }]}>{score}</Text>
        <Text style={styles.outOf}>/100</Text>
      </View>
      <Text style={[styles.label, { color }]}>{scoreLabel(score)}</Text>
      <Text style={styles.subtitle}>Form Score</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  circle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  score: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 52,
  },
  outOf: {
    fontSize: 14,
    color: '#AAA',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#AAA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
