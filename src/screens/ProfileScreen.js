// src/screens/ProfileScreen.js
//
// Minimal profile screen with workout history, Apple-like toggles.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { getSessions, clearSessions } from '../api/sessionStorage';
import { colors, shadows, borderRadius } from '../theme';

function ProfileRow({ icon, label, value, color, onPress }) {
  return (
    <TouchableOpacity
      style={profileStyles.row}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={[profileStyles.rowIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={profileStyles.rowLabel}>{label}</Text>
      {value && <Text style={profileStyles.rowValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
    </TouchableOpacity>
  );
}

function ToggleRow({ icon, label, value, onValueChange, color }) {
  const [isOn, setIsOn] = useState(value);
  return (
    <View style={profileStyles.row}>
      <View style={[profileStyles.rowIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={profileStyles.rowLabel}>{label}</Text>
      <Switch
        value={isOn}
        onValueChange={(v) => {
          setIsOn(v);
          onValueChange?.(v);
        }}
        trackColor={{ false: colors.bgTertiary, true: `${color}60` }}
        thumbColor={isOn ? color : colors.textDisabled}
        ios_backgroundColor={colors.bgTertiary}
      />
    </View>
  );
}

const profileStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  rowValue: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

export default function ProfileScreen() {
  const [sessionCount, setSessionCount] = useState(0);
  const [notifications, setNotifications] = useState(true);
  const [haptics, setHaptics] = useState(true);

  useEffect(() => {
    const load = async () => {
      const sessions = await getSessions();
      setSessionCount(sessions.length);
    };
    load();
  }, []);

  const handleClearHistory = () => {
    Alert.alert('Clear History', 'Delete all session data?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await clearSessions();
          setSessionCount(0);
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={FadeInUp.duration(400)} style={styles.header}>
        <View>
          <Text style={styles.greeting}>ACCOUNT</Text>
          <Text style={styles.title}>Profile</Text>
        </View>
      </Animated.View>

      {/* Profile card */}
      <Animated.View
        entering={FadeInUp.duration(500).delay(100)}
        style={styles.profileCard}
      >
        <View style={styles.avatar}>
          <Ionicons name="person" size={36} color={colors.textPrimary} />
        </View>
        <Text style={styles.profileName}>Athlete</Text>
        <Text style={styles.profileSub}>perForm Member</Text>
      </Animated.View>

      {/* Stats */}
      <Animated.View
        entering={FadeInUp.duration(500).delay(150)}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>SUMMARY</Text>
        <View style={styles.card}>
          <ProfileRow
            icon="fitness"
            label="Total Workouts"
            value={String(sessionCount)}
            color={colors.ringRed}
          />
          <ProfileRow
            icon="timer"
            label="This Week"
            value={`${sessionCount > 0 ? Math.min(sessionCount, 7) : 0}`}
            color={colors.ringGreen}
          />
          <ProfileRow
            icon="flame"
            label="Total Calories"
            value={`${sessionCount * 200}`}
            color={colors.warning}
          />
        </View>
      </Animated.View>

      {/* Preferences */}
      <Animated.View
        entering={FadeInUp.duration(500).delay(200)}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.card}>
          <ToggleRow
            icon="notifications"
            label="Notifications"
            value={notifications}
            onValueChange={setNotifications}
            color={colors.ringRed}
          />
          <ToggleRow
            icon="phone-portrait"
            label="Haptic Feedback"
            value={haptics}
            onValueChange={setHaptics}
            color={colors.ringBlue}
          />
          <ProfileRow
            icon="color-palette"
            label="App Theme"
            value="Dark"
            color={colors.purple}
          />
        </View>
      </Animated.View>

      {/* Data */}
      <Animated.View
        entering={FadeInUp.duration(500).delay(250)}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>DATA</Text>
        <View style={styles.card}>
          <ProfileRow
            icon="download"
            label="Export Data"
            color={colors.ringGreen}
            onPress={() => Alert.alert('Export', 'Coming soon')}
          />
          <ProfileRow
            icon="trash"
            label="Clear History"
            color={colors.ringRed}
            onPress={handleClearHistory}
          />
        </View>
      </Animated.View>

      {/* App info */}
      <Animated.View
        entering={FadeInUp.duration(500).delay(300)}
        style={styles.footer}
      >
        <Text style={styles.footerText}>perForm v1.0.0</Text>
        <Text style={styles.footerSub}>Built with React Native + Expo</Text>
      </Animated.View>
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

  // Profile card
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xxl,
    padding: 28,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  profileSub: {
    fontSize: 13,
    color: colors.textTertiary,
    fontWeight: '600',
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  footerSub: {
    fontSize: 11,
    color: colors.textDisabled,
  },
});
