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
 * Fetches the latest completed session from the ESP32.
 * Returns a SessionData object (see below for expected shape).
 */
export const getLatestSession = async () => {
  const response = await client.get('/session');
  return response.data;
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
  Expected SessionData shape from the ESP32:
  {
    session_id:   string,
    timestamp:    number,
    rep_count:    number,
    avg_velocity: number,
    form_score:   number,       // 0–100
    anomalies:    string[]      // e.g. ["elbow_drop", "early_extension"]
  }
*/
