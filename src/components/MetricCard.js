// src/components/MetricCard.js
// A modern reusable card for displaying metric values with icons.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, shadows } from '../theme';

export default function MetricCard({ label, value, icon, iconColor = colors.primary, iconBg = colors.primaryMuted }) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  value: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
});
