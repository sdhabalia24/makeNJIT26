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
from flask import Flask, jsonify, make_response, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allow all origins for dev

# ---------- AI System Prompt ----------
AI_SYSTEM_PROMPT = """You are a fitness form-checking assistant that guides users on where to place an IMU sensor band on their body during exercise.

## YOUR ONLY JOB

When a user tells you what exercise they are doing, respond with exactly one placement instruction from the table below. Do not improvise. Do not add extra steps.

## PLACEMENT TABLE

| Exercise | Band Location | Exact Position | Sensor Facing |
|---|---|---|---|
| Barbell Biceps Curl | Forearm | Mid-forearm, 2 inches below elbow | Out (away from body) |
| Hammer Curl | Forearm | Mid-forearm, 2 inches below elbow | Out |
| Bench Press | Forearm | Mid-forearm, sensor flat on top | Up (toward ceiling) |
| Incline Bench Press | Forearm | Mid-forearm, sensor flat on top | Up |
| Decline Bench Press | Forearm | Mid-forearm, sensor flat on top | Up |
| Shoulder Press | Forearm | Mid-forearm, 2 inches below elbow | Out |
| Lateral Raise | Forearm | Mid-forearm | Down (toward floor) |
| Chest Fly Machine | Forearm | Mid-forearm | In (toward chest) |
| Tricep Pushdown | Forearm | Mid-forearm | Down |
| Tricep Dips | Forearm | Mid-forearm | Back (away from face) |
| Squat | Shin | Mid-shin, between knee and ankle | Forward |
| Deadlift | Shin | Mid-shin, between knee and ankle | Forward |
| Romanian Deadlift | Shin | Mid-shin, between knee and ankle | Forward |
| Leg Extension | Shin | Mid-shin, between knee and ankle | Forward |
| Leg Raises | Lower Leg | Mid-calf | Forward |
| Hip Thrust | Shin | Mid-shin, between knee and ankle | Forward |
| Lat Pulldown | Forearm | Mid-forearm, 2 inches below elbow | Out |
| Pull Up | Forearm | Mid-forearm, 2 inches below elbow | Out |
| T Bar Row | Forearm | Mid-forearm | Down |
| Seated Row | Forearm | Mid-forearm | Down |

## RESPONSE FORMAT

Use this exact format. Do not deviate:

Exercise: [exercise name]
Place the band on your [location].
Position: [exact position].
Sensor facing: [direction].

## RULES

1. Match the exercise name exactly as listed. If the user says something similar (e.g., "curls" instead of "barbell biceps curl"), ask them to clarify which curl variation.
2. If the exercise is not in the table, say: "I don't have placement data for that exercise. Supported exercises: [list all exercises]."
3. Keep responses under 50 words. No extra tips. No safety warnings. Just the placement.
4. If the user asks "where does it go?" without naming an exercise, ask: "What exercise are you doing?"

## EXAMPLES

User: "barbell biceps curl"
Assistant:
Exercise: Barbell Biceps Curl
Place the band on your forearm.
Position: Mid-forearm, 2 inches below elbow.
Sensor facing: Out (away from body).

User: "squats"
Assistant:
I don't have data for "squats." Do you mean "Squat"?

User: "bench"
Assistant:
I don't have data for "bench." Do you mean "Bench Press," "Incline Bench Press," or "Decline Bench Press"?

User: "Where do I put this?"
Assistant:
What exercise are you doing?"""

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


# ---------- AI Chat endpoint ----------
@app.route("/v1/chat/completions", methods=["POST"])
def chat_completions():
    """Mock AI chat endpoint that simulates the ESP32 AI service."""
    data = request.get_json()
    
    if not data or 'messages' not in data:
        return make_response(jsonify({"error": "Invalid request"}), 400)
    
    messages = data.get('messages', [])
    
    # Find the last user message
    user_message = ""
    for msg in reversed(messages):
        if msg.get('role') == 'user':
            user_message = msg.get('content', '').lower().strip()
            break
    
    # Simple keyword matching for mock responses
    exercise_map = {
        'curl': 'Barbell Biceps Curl',
        'barbell biceps curl': 'Barbell Biceps Curl',
        'hammer curl': 'Hammer Curl',
        'hammer curls': 'Hammer Curl',
        'bench press': 'Bench Press',
        'bench': 'Bench Press',
        'incline bench press': 'Incline Bench Press',
        'decline bench press': 'Decline Bench Press',
        'shoulder press': 'Shoulder Press',
        'lateral raise': 'Lateral Raise',
        'lateral raises': 'Lateral Raise',
        'chest fly': 'Chest Fly Machine',
        'tricep pushdown': 'Tricep Pushdown',
        'tricep dips': 'Tricep Dips',
        'squat': 'Squat',
        'squats': 'Squat',
        'deadlift': 'Deadlift',
        'romanian deadlift': 'Romanian Deadlift',
        'leg extension': 'Leg Extension',
        'leg raises': 'Leg Raises',
        'hip thrust': 'Hip Thrust',
        'hip thrusts': 'Hip Thrust',
        'lat pulldown': 'Lat Pulldown',
        'pull up': 'Pull Up',
        'pull ups': 'Pull Up',
        't bar row': 'T Bar Row',
        'seated row': 'Seated Row',
        'seated rows': 'Seated Row',
    }
    
    # Placement data
    placements = {
        'Barbell Biceps Curl': {
            'location': 'forearm',
            'position': 'Mid-forearm, 2 inches below elbow',
            'facing': 'Out (away from body)'
        },
        'Hammer Curl': {
            'location': 'forearm',
            'position': 'Mid-forearm, 2 inches below elbow',
            'facing': 'Out'
        },
        'Bench Press': {
            'location': 'forearm',
            'position': 'Mid-forearm, sensor flat on top',
            'facing': 'Up (toward ceiling)'
        },
        'Incline Bench Press': {
            'location': 'forearm',
            'position': 'Mid-forearm, sensor flat on top',
            'facing': 'Up'
        },
        'Decline Bench Press': {
            'location': 'forearm',
            'position': 'Mid-forearm, sensor flat on top',
            'facing': 'Up'
        },
        'Shoulder Press': {
            'location': 'forearm',
            'position': 'Mid-forearm, 2 inches below elbow',
            'facing': 'Out'
        },
        'Lateral Raise': {
            'location': 'forearm',
            'position': 'Mid-forearm',
            'facing': 'Down (toward floor)'
        },
        'Chest Fly Machine': {
            'location': 'forearm',
            'position': 'Mid-forearm',
            'facing': 'In (toward chest)'
        },
        'Tricep Pushdown': {
            'location': 'forearm',
            'position': 'Mid-forearm',
            'facing': 'Down'
        },
        'Tricep Dips': {
            'location': 'forearm',
            'position': 'Mid-forearm',
            'facing': 'Back (away from face)'
        },
        'Squat': {
            'location': 'shin',
            'position': 'Mid-shin, between knee and ankle',
            'facing': 'Forward'
        },
        'Deadlift': {
            'location': 'shin',
            'position': 'Mid-shin, between knee and ankle',
            'facing': 'Forward'
        },
        'Romanian Deadlift': {
            'location': 'shin',
            'position': 'Mid-shin, between knee and ankle',
            'facing': 'Forward'
        },
        'Leg Extension': {
            'location': 'shin',
            'position': 'Mid-shin, between knee and ankle',
            'facing': 'Forward'
        },
        'Leg Raises': {
            'location': 'lower leg',
            'position': 'Mid-calf',
            'facing': 'Forward'
        },
        'Hip Thrust': {
            'location': 'shin',
            'position': 'Mid-shin, between knee and ankle',
            'facing': 'Forward'
        },
        'Lat Pulldown': {
            'location': 'forearm',
            'position': 'Mid-forearm, 2 inches below elbow',
            'facing': 'Out'
        },
        'Pull Up': {
            'location': 'forearm',
            'position': 'Mid-forearm, 2 inches below elbow',
            'facing': 'Out'
        },
        'T Bar Row': {
            'location': 'forearm',
            'position': 'Mid-forearm',
            'facing': 'Down'
        },
        'Seated Row': {
            'location': 'forearm',
            'position': 'Mid-forearm',
            'facing': 'Down'
        },
    }
    
    # Check for placement questions without exercise
    if any(phrase in user_message for phrase in ['where', 'put', 'place', 'put this', 'where does it go', 'wear']):
        if not any(ex in user_message for ex in list(exercise_map.keys())):
            response_text = "What exercise are you doing?"
        else:
            response_text = "What exercise are you doing?"
    else:
        # Try to match exercise
        matched_exercise = None
        for key, exercise in exercise_map.items():
            if key in user_message:
                matched_exercise = exercise
                break
        
        if matched_exercise and matched_exercise in placements:
            placement = placements[matched_exercise]
            response_text = f"""Exercise: {matched_exercise}
Place the band on your {placement['location']}.
Position: {placement['position']}.
Sensor facing: {placement['facing']}."""
        else:
            all_exercises = ', '.join(sorted(set(exercise_map.values())))
            response_text = f"I don't have placement data for that exercise. Supported exercises: {all_exercises}."
    
    # Build response
    response = {
        "id": f"chatcmpl-{int(time.time())}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": "google/gemma-3-1b",
        "choices": [
            {
                "index": 0,
                "logprobs": None,
                "finish_reason": "stop",
                "message": {
                    "role": "assistant",
                    "content": response_text
                }
            }
        ],
        "usage": {
            "prompt_tokens": len(' '.join([m.get('content', '') for m in messages])),
            "completion_tokens": len(response_text.split()),
            "total_tokens": len(' '.join([m.get('content', '') for m in messages])) + len(response_text.split())
        },
        "stats": {},
        "system_fingerprint": "google/gemma-3-1b"
    }
    
    return jsonify(response)


if __name__ == "__main__":
    print("🏋️  Mock ESP32 server running on http://localhost:8080")
    print("   Endpoints:")
    print("   GET  /session              - Latest session data")
    print("   GET  /sessions             - All sessions")
    print("   POST /v1/chat/completions  - AI chat (sensor placement)")
    app.run(host="0.0.0.0", port=8080, debug=False)
