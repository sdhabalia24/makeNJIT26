from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import time

MOCK_SESSION = {
    "session_id": "sess_001",
    "timestamp": int(time.time()),
    "rep_count": 12,
    "avg_velocity": 2.43,
    "form_score": 87,
    "anomalies": ["elbow_drop", "early_extension"]
}

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/session":
            body = json.dumps(MOCK_SESSION).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")  # ← CORS fix
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):  # ← handles CORS preflight requests
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", 8080), Handler)
    print("Mock ESP32 server running on http://0.0.0.0:8080")
    server.serve_forever()