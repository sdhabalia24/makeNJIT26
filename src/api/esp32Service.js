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

// Exercise placement data
export const EXERCISES = [
  { 
    name: 'Barbell Biceps Curl', 
    bandLocation: 'Forearm', 
    position: 'Mid-forearm, 2 inches below elbow', 
    sensorFacing: 'Out (away from body)' 
  },
  { 
    name: 'Hammer Curl', 
    bandLocation: 'Forearm', 
    position: 'Mid-forearm, 2 inches below elbow', 
    sensorFacing: 'Out' 
  },
  { 
    name: 'Bench Press', 
    bandLocation: 'Forearm', 
    position: 'Mid-forearm, sensor flat on top', 
    sensorFacing: 'Up (toward ceiling)' 
  },
  { 
    name: 'Incline Bench Press', 
    bandLocation: 'Forearm', 
    position: 'Mid-forearm, sensor flat on top', 
    sensorFacing: 'Up' 
  },
  { 
    name: 'Decline Bench Press', 
    bandLocation: 'Forearm', 
    position: 'Mid-forearm, sensor flat on top', 
    sensorFacing: 'Up' 
  },
  { 
    name: 'Shoulder Press', 
    bandLocation: 'Forearm', 
    position: 'Mid-forearm, 2 inches below elbow', 
    sensorFacing: 'Out' 
  },
  { 
    name: 'Lateral Raise', 
    bandLocation: 'Forearm', 
    position: 'Mid-forearm', 
    sensorFacing: 'Down (toward floor)' 
  },
  { 
    name: 'Chest Fly Machine', 
    bandLocation: 'Forearm', 
    position: 'Mid-forearm', 
    sensorFacing: 'In (toward chest)' 
  },
  { 
    name: 'Tricep Pushdown', 
    bandLocation: 'Forearm', 
    position: 'Mid-forearm', 
    sensorFacing: 'Down' 
  },
  { 
    name: 'Tricep Dips', 
    bandLocation: 'Forearm', 
    position: 'Mid-forearm', 
    sensorFacing: 'Back (away from face)' 
  },
  { 
    name: 'Squat', 
    bandLocation: 'Shin', 
    position: 'Mid-shin, between knee and ankle', 
    sensorFacing: 'Forward' 
  },
  { 
    name: 'Romanian Deadlift', 
    bandLocation: 'Shin', 
    position: 'Mid-shin, between knee and ankle', 
    sensorFacing: 'Forward' 
  },
  { 
    name: 'Leg Raises', 
    bandLocation: 'Lower Leg', 
    position: 'Mid-calf', 
    sensorFacing: 'Forward' 
  },
  { 
    name: 'Hip Thrust', 
    bandLocation: 'Shin', 
    position: 'Mid-shin, between knee and ankle', 
    sensorFacing: 'Forward' 
  },
  { 
    name: 'Lat Pulldown', 
    bandLocation: 'Forearm', 
    position: 'Mid-forearm, 2 inches below elbow', 
    sensorFacing: 'Out' 
  },
  { 
    name: 'Pull Up', 
    bandLocation: 'Forearm', 
    position: 'Mid-forearm, 2 inches below elbow', 
    sensorFacing: 'Out' 
  },
  { 
    name: 'T Bar Row', 
    bandLocation: 'Forearm', 
    position: 'Mid-forearm', 
    sensorFacing: 'Down' 
  },
  { 
    name: 'Seated Row', 
    bandLocation: 'Forearm', 
    position: 'Mid-forearm', 
    sensorFacing: 'Down' 
  },
];

const BASE_URL = 'http://172.20.10.5:8000'; // - change this
//const BASE_URL = 'http://localhost:8080';
const client = axios.create({
  baseURL: BASE_URL,
  timeout: 5000, // 5 second timeout - ESP32 can be slow
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Normalizes a raw ESP32 session into the shape the app expects.
 * Maps new v2 fields - legacy field names so the rest of the app doesn't break.
 * Throws if required fields are missing.
 */
const normalizeSession = (raw) => {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid session data: expected object');
  }
  if (typeof raw.exercise !== 'string' || !raw.exercise) {
    throw new Error('Invalid session data: missing exercise name');
  }
  if (typeof raw.start_time !== 'number') {
    throw new Error('Invalid session data: missing start_time');
  }
  if (typeof raw.end_time !== 'number') {
    throw new Error('Invalid session data: missing end_time');
  }

  const date = new Date(raw.start_time * 1000);
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return {
    // Machine-friendly unique ID for deduplication & React keys 
    session_id:   `${raw.exercise.replace(/\s+/g, '_')}_${raw.start_time}`,
    // Human-readable label for display
    display_name: `${raw.exercise} — ${dateStr}`,
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

// AI Chat Service
// Separate client for the AI chat endpoint (different port/service on ESP32)
const AI_BASE_URL = 'http://172.20.10.5:1234';
const aiClient = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 30000, // 30 second timeout — AI model can take time
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Sends a chat message to the ESP32 AI service and gets a response.
 * @param {string} message - The user's message/question
 * @param {string} systemPrompt - Optional system prompt with exercise context
 * @param {Array} chatHistory - Optional array of {role, content} for context
 * @returns {Promise<string>} - The AI's response text
 */
export const sendChatMessage = async (message, systemPrompt = '', chatHistory = []) => {
  const messages = [];
  
  // Add system prompt if provided
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  // Add chat history
  messages.push(...chatHistory);
  
  // Add current message
  messages.push({ role: 'user', content: message });

  const response = await aiClient.post('/v1/chat/completions', {
    model: 'local-model',
    messages: messages,
    temperature: 0.2,
    max_tokens: 150,
    stream: false,
  });

  if (response.data && response.data.choices && response.data.choices[0]) {
    return response.data.choices[0].message.content;
  }
  
  throw new Error('Invalid response from AI service');
};

/**
 * Lets you point the AI service at a different IP at runtime.
 */
export const setAiBaseUrl = (ip, port = 1234) => {
  aiClient.defaults.baseURL = `http://${ip}:${port}`;
};

/**
 * Starts an exercise tracking session on the ESP32.
 * @param {Object} options - Exercise configuration
 * @param {string} options.exercise - The name of the exercise to start
 * @param {number} [options.camera=0] - Camera device ID
 * @param {boolean} [options.imu=false] - Enable IMU tracking
 * @param {string} [options.imu_mode='interface'] - IMU mode ('interface', 'udp', etc.)
 * @param {number} [options.imu_port=5005] - IMU port
 * @param {boolean} [options.buzz=false] - Enable buzzer feedback
 * @param {number} [options.buzz_threshold=40] - Buzzer threshold
 * @param {number} [options.stream_port=0] - MJPEG stream port (0 to disable)
 * @param {string} [options.udp_stream] - UDP stream URL
 * @returns {Promise<string>} - Response from the server
 */
export const startExercise = async ({
  exercise,
  camera = 0,
  imu = false,
  imu_mode = 'interface',
  imu_port = 5005,
  buzz = false,
  buzz_threshold = 40,
  stream_port = 0,
  udp_stream,
}) => {
  const body = {
    exercise,
    camera,
    imu,
    imu_mode,
    imu_port,
    buzz,
    buzz_threshold,
    stream_port,
  };
  
  if (udp_stream) {
    body.udp_stream = udp_stream;
  }
  
  const response = await client.post('/api/start-exercise', body);
  return response.data;
};

/**
 * Stops an exercise tracking session.
 * @param {string} exerciseName - The name of the exercise to stop
 * @returns {Promise<string>} - Response from the server
 */
export const stopExercise = async (exerciseName) => {
  const response = await client.post('/api/stop-exercise', {
    exercise: exerciseName,
  });
  return response.data;
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
    session.session_id      ← exercise + unix timestamp (unique, for keys/dedup)
    session.display_name    ← exercise + readable date (for display)
    session.form_score      ← avg_form_score
    session.rep_count       ← rep_count
    session.avg_velocity    ← avg_accel  (treated as proxy)
    session.anomalies       ← anomalies
    session.timestamp       ← end_time
*/
