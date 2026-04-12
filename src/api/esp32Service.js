// src/api/esp32Service.js
//
// All network calls to the ESP32 live here.
// Swap BASE_URL to your ESP32's IP when hardware is ready.
//
// While testing with the mock Python server:
//   Android emulator  →  http://10.0.2.2:8080
//   iOS simulator     →  http://localhost:8080
//   Real device       →  http://<your-pc-ip>:8080

import axios from 'axios';

//const BASE_URL = 'http://10.0.2.2:8080'; // ← change this
const BASE_URL = 'http://localhost:8080';
const client = axios.create({
  baseURL: BASE_URL,
  timeout: 5000, // 5 second timeout — ESP32 can be slow
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Normalizes a raw ESP32 session (v2 format) into the shape the app expects.
 * Maps new v2 fields → legacy field names so the rest of the app doesn't break.
 */
const normalizeSession = (raw) => {
  const date = new Date(raw.start_time * 1000);
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return {
    session_id:   `${raw.exercise} — ${dateStr}`,
    timestamp:    raw.end_time,
    rep_count:    raw.rep_count,
    avg_velocity: raw.avg_accel,          // use avg_accel as velocity proxy
    form_score:   raw.avg_form_score,
    anomalies:    raw.anomalies || [],
    // keep raw v2 data available under _raw for future per-rep UI
    _raw:         raw,
  };
};

/**
 * Fetches the latest completed session from the ESP32.
 * Returns a SessionData object (see below for expected shape).
 */
export const getLatestSession = async () => {
  const response = await client.get('/session');
  return normalizeSession(response.data);
};

/**
 * Fetches all sessions from the ESP32.
 * Returns an array of SessionData objects.
 */
export const getAllSessions = async () => {
  const response = await client.get('/sessions');
  const rawSessions = Array.isArray(response.data) ? response.data : [];
  return rawSessions.map(normalizeSession);
};

/**
 * Fetches a live snapshot of the current in-progress session.
 * Uncomment when the ESP32 supports this endpoint.
 */
// export const getLiveData = async () => {
//   const response = await client.get('/live');
//   return response.data;
// };

/**
 * Lets you point the app at a different ESP32 IP at runtime.
 * Call this when the user types in a new IP address.
 */
export const setBaseUrl = (ip, port = 80) => {
  client.defaults.baseURL = `http://${ip}:${port}`;
};

/*
  Expected SessionData shape from the ESP32 (v2 — per-rep breakdown):
  {
    exercise:       string,    // e.g. "barbell biceps curl"
    start_time:     number,    // unix timestamp (seconds)
    end_time:       number,    // unix timestamp (seconds)
    avg_accel:      number,    // average acceleration
    avg_form_score: number,    // 0–100
    rep_count:      number,    // total repetitions
    anomalies:      string[]   // e.g. ["momentum_cheat", "incomplete_extension"]
    reps: [                    // per-rep breakdown
      {
        rep_number:  number,   // 1, 2, 3...
        form_score:  number,   // 0–100 per rep
        duration:    number,   // seconds
        avg_accel:   number,
        violations:  string[]  // e.g. ["elbow_drop"]
      },
      ...
    ]
  }

  Field mapping (ESP32 → app):
    session.form_score    ← avg_form_score
    session.rep_count     ← rep_count
    session.avg_velocity  ← avg_accel  (treated as proxy)
    session.anomalies     ← anomalies
    session.session_id    ← generated from exercise + start_time
    session.timestamp     ← end_time
*/
