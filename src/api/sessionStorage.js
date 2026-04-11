// src/api/sessionStorage.js
//
// Handles local persistence of session data using AsyncStorage.
// Sessions are saved so users can view history even offline.

import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSIONS_KEY = '@perform_sessions';

/**
 * Saves a session to the local history.
 * Merges with existing sessions, avoiding duplicates.
 */
export const saveSession = async (session) => {
  try {
    const existing = await getSessions();
    const exists = existing.some((s) => s.session_id === session.session_id);
    if (exists) return; // already saved

    const updated = [session, ...existing]; // newest first
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save session:', error);
  }
};

/**
 * Retrieves all saved sessions.
 */
export const getSessions = async () => {
  try {
    const data = await AsyncStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get sessions:', error);
    return [];
  }
};

/**
 * Clears all session history.
 */
export const clearSessions = async () => {
  try {
    await AsyncStorage.removeItem(SESSIONS_KEY);
  } catch (error) {
    console.error('Failed to clear sessions:', error);
  }
};
