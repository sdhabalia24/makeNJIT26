// src/screens/HomeScreen.js
//
// Main screen — lets the user enter the ESP32 IP, fetch a session,
// and see the results displayed as metrics and a form score gauge.

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
import { getLatestSession, setBaseUrl } from '../api/esp32Service';
import MetricCard from '../components/MetricCard';
import FormScoreGauge from '../components/FormScoreGauge';

export default function HomeScreen() {
  const [ipAddress, setIpAddress]   = useState('');
  const [session, setSession]       = useState(null);
  const [loading, setLoading]       = useState(false);

  const handleFetch = async () => {
    // If the user typed an IP, point axios at it
    if (ipAddress.trim()) {
      setBaseUrl(ipAddress.trim());
    }

    setLoading(true);
    try {
      const data = await getLatestSession();
      setSession(data);
    } catch (error) {
      Alert.alert(
        'Connection Failed',
        'Could not reach the ESP32.\n\n' +
        'Check:\n• The IP address is correct\n• Both devices are on the same WiFi\n• The mock server is running',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header */}
      <Text style={styles.title}>perForm</Text>
      <Text style={styles.subtitle}>Movement Analysis</Text>

      {/* IP Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="ESP32 IP  e.g. 192.168.1.105"
          value={ipAddress}
          onChangeText={setIpAddress}
          keyboardType="default"
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleFetch}
          disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Fetch</Text>}
        </TouchableOpacity>
      </View>

      {/* Results */}
      {session && (
        <View style={styles.resultsContainer}>

          {/* Form Score — prominent gauge */}
          <FormScoreGauge score={session.form_score} />

          {/* Metric cards */}
          <View style={styles.metricsRow}>
            <MetricCard label="Reps"         value={session.rep_count}              />
            <MetricCard label="Avg Velocity" value={`${session.avg_velocity} m/s`}  />
          </View>

          {/* Session info */}
          <Text style={styles.sessionId}>Session: {session.session_id}</Text>

          {/* Anomalies / Flags */}
          <View style={styles.flagsCard}>
            <Text style={styles.flagsTitle}>FORM FLAGS</Text>
            {session.anomalies && session.anomalies.length > 0
              ? session.anomalies.map((flag, i) => (
                  <Text key={i} style={styles.flagItem}>⚠ {flag.replace(/_/g, ' ')}</Text>
                ))
              : <Text style={styles.noFlags}>✓ No issues detected</Text>
            }
          </View>

        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 20,
    paddingTop: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  button: {
    backgroundColor: '#1565C0',
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  buttonDisabled: {
    backgroundColor: '#90A4AE',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  resultsContainer: {
    gap: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sessionId: {
    fontSize: 12,
    color: '#AAA',
    textAlign: 'center',
  },
  flagsCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FCE4EC',
  },
  flagsTitle: {
    fontSize: 11,
    color: '#AAA',
    letterSpacing: 1,
    marginBottom: 10,
  },
  flagItem: {
    fontSize: 14,
    color: '#C62828',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  noFlags: {
    fontSize: 14,
    color: '#388E3C',
  },
});
