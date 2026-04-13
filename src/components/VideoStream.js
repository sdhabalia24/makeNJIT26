// src/components/VideoStream.js
// Platform-specific video stream component

import React from 'react';
import { View, ActivityIndicator, Text, Platform, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../theme';

export default function VideoStream({ url, style }) {
  // On web, use native iframe
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <iframe
          src={url}
          style={styles.webIframe}
          title="Exercise Stream"
          frameBorder="0"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </View>
    );
  }

  // On native, use WebView
  return (
    <WebView
      source={{ uri: url }}
      style={[styles.container, style]}
      javaScriptEnabled={true}
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={false}
      startInLoadingState={true}
      renderLoading={() => (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.purple} />
          <Text style={styles.loadingText}>Loading stream...</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  webIframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
});
