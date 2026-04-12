"""
Mock ESP32 API server for testing the perForm app.
Returns session data in the v2 format with per-rep breakdown.

Usage:
    pip install flask
    python mock_server.py

Endpoints:
    GET /session   — latest single session
    GET /sessions  — all sessions (array)
"""

import time
from flask import Flask, jsonify, make_response
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allow all origins for dev

# ---------- sample v2 sessions ----------
SESSIONS = [
    {
        "exercise": "barbell biceps curl",
        "start_time": time.time() - 3600 * 2,
        "end_time": time.time() - 3600 * 2 + 180,
        "avg_accel": 12.5,
        "avg_form_score": 78.3,
        "rep_count": 10,
        "anomalies": ["momentum_cheat", "incomplete_extension"],
        "reps": [
            {"rep_number": 1, "form_score": 82, "duration": 2.1, "avg_accel": 11.2, "violations": []},
            {"rep_number": 2, "form_score": 80, "duration": 2.0, "avg_accel": 11.5, "violations": []},
            {"rep_number": 3, "form_score": 78, "duration": 2.2, "avg_accel": 12.0, "violations": ["momentum_cheat"]},
            {"rep_number": 4, "form_score": 76, "duration": 2.3, "avg_accel": 12.1, "violations": []},
            {"rep_number": 5, "form_score": 80, "duration": 2.0, "avg_accel": 11.8, "violations": []},
            {"rep_number": 6, "form_score": 75, "duration": 2.4, "avg_accel": 13.0, "violations": ["incomplete_extension"]},
            {"rep_number": 7, "form_score": 77, "duration": 2.2, "avg_accel": 12.4, "violations": []},
            {"rep_number": 8, "form_score": 79, "duration": 2.1, "avg_accel": 12.0, "violations": []},
            {"rep_number": 9, "form_score": 78, "duration": 2.1, "avg_accel": 12.6, "violations": ["momentum_cheat"]},
            {"rep_number": 10, "form_score": 78, "duration": 2.0, "avg_accel": 12.4, "violations": []},
        ],
    },
    {
        "exercise": "dumbbell lateral raise",
        "start_time": time.time() - 3600 * 5,
        "end_time": time.time() - 3600 * 5 + 150,
        "avg_accel": 8.2,
        "avg_form_score": 91.0,
        "rep_count": 12,
        "anomalies": [],
        "reps": [
            {"rep_number": i + 1, "form_score": 90 + (i % 3), "duration": 1.8 + (i % 4) * 0.1, "avg_accel": 8.0 + (i % 5) * 0.3, "violations": []}
            for i in range(12)
        ],
    },
    {
        "exercise": "cable tricep pushdown",
        "start_time": time.time() - 86400,
        "end_time": time.time() - 86400 + 200,
        "avg_accel": 10.1,
        "avg_form_score": 55.0,
        "rep_count": 8,
        "anomalies": ["elbow_flare", "momentum_cheat", "incomplete_extension"],
        "reps": [
            {"rep_number": 1, "form_score": 65, "duration": 2.5, "avg_accel": 9.0, "violations": []},
            {"rep_number": 2, "form_score": 60, "duration": 2.6, "avg_accel": 9.5, "violations": ["elbow_flare"]},
            {"rep_number": 3, "form_score": 55, "duration": 2.8, "avg_accel": 10.0, "violations": ["momentum_cheat"]},
            {"rep_number": 4, "form_score": 50, "duration": 3.0, "avg_accel": 10.5, "violations": ["elbow_flare", "incomplete_extension"]},
            {"rep_number": 5, "form_score": 52, "duration": 2.9, "avg_accel": 10.2, "violations": ["momentum_cheat"]},
            {"rep_number": 6, "form_score": 48, "duration": 3.1, "avg_accel": 10.8, "violations": ["elbow_flare"]},
            {"rep_number": 7, "form_score": 54, "duration": 2.7, "avg_accel": 10.0, "violations": []},
            {"rep_number": 8, "form_score": 56, "duration": 2.6, "avg_accel": 9.8, "violations": ["incomplete_extension"]},
        ],
    },
    {
        "exercise": "hammer curls",
        "start_time": time.time() - 86400*4,
        "end_time": time.time() - 86400*4 + 200,
        "avg_accel": 9.1,
        "avg_form_score": 85.0,
        "rep_count": 12,
        "anomalies": ["incomplete_extension"],
        "reps": [
            {"rep_number": 1, "form_score": 85, "duration": 2.5, "avg_accel": 9.0, "violations": []},
            {"rep_number": 2, "form_score": 85, "duration": 2.6, "avg_accel": 9.5, "violations": []},
            {"rep_number": 3, "form_score": 85, "duration": 2.8, "avg_accel": 10.0, "violations": []},
            {"rep_number": 4, "form_score": 85, "duration": 3.0, "avg_accel": 10.5, "violations": ["incomplete_extension"]},
            {"rep_number": 5, "form_score": 85, "duration": 2.9, "avg_accel": 10.2, "violations": []},
            {"rep_number": 6, "form_score": 85, "duration": 3.1, "avg_accel": 10.8, "violations": []},
            {"rep_number": 7, "form_score": 85, "duration": 2.7, "avg_accel": 10.0, "violations": []},
            {"rep_number": 8, "form_score": 85, "duration": 2.6, "avg_accel": 9.8, "violations": ["incomplete_extension"]},
            {"rep_number": 9, "form_score": 85, "duration": 2.5, "avg_accel": 9.6, "violations": []},
            {"rep_number": 10, "form_score": 85, "duration": 2.4, "avg_accel": 9.4, "violations": []},
            {"rep_number": 11, "form_score": 85, "duration": 2.3, "avg_accel": 9.2, "violations": []},
            {"rep_number": 12, "form_score": 85, "duration": 2.2, "avg_accel": 9.0, "violations": []},
        ],
    },
]


# ---------- routes ----------
@app.route("/session")
def get_session():
    """Return the most recent session (first in the list)."""
    return jsonify(SESSIONS[0])


@app.route("/sessions")
def get_sessions():
    """Return all sessions."""
    return jsonify(SESSIONS)


if __name__ == "__main__":
    print("🏋️  Mock ESP32 server running on http://localhost:8080")
    print("   Endpoints:  GET /session   |   GET /sessions")
    app.run(host="0.0.0.0", port=8080, debug=False)
