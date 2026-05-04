"""Quick test of the /analyze endpoint using urllib (no external deps)."""
import urllib.request
import json
import time
import io

# Build multipart form data manually
boundary = b"----StructureXBoundary"
with open("sample_data.csv", "rb") as f:
    csv_data = f.read()

body = b""
body += b"--" + boundary + b"\r\n"
body += b'Content-Disposition: form-data; name="file"; filename="sample_data.csv"\r\n'
body += b"Content-Type: text/csv\r\n\r\n"
body += csv_data + b"\r\n"
body += b"--" + boundary + b"--\r\n"

start = time.time()
req = urllib.request.Request(
    "http://localhost:8000/api/analyze",
    data=body,
    headers={
        "Content-Type": f"multipart/form-data; boundary={boundary.decode()}",
    },
    method="POST",
)

try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        elapsed = time.time() - start
        data = json.loads(resp.read().decode())

        print(f"Status: {resp.status}")
        print(f"Risk Score: {data['risk_score']}")
        print(f"Risk Category: {data['risk_category']}")
        print(f"Failure Prob: {data['failure_probability']}")
        print(f"Anomaly Score: {data['anomaly_score']}")
        print(f"Env Risk: {data['environmental_risk']}")
        print(f"Processing Time: {data['processing_time_sec']}s")
        print(f"Time to Failure: {data['time_to_failure']}")
        print(f"Charts: {list(data.get('charts', {}).keys())}")
        print(f"LLM keys: {list(data.get('llm_explanation', {}).keys())}")
        print(f"Infra keys: {list(data.get('infrastructure', {}).keys())}")
        print(f"Total client time: {elapsed:.2f}s")

        llm = data.get("llm_explanation", {})
        if llm.get("summary"):
            print(f"\nLLM Summary:\n{llm['summary'][:300]}")
        if llm.get("recommendations"):
            print(f"\nRecommendations:\n{llm['recommendations'][:300]}")
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.read().decode()[:500]}")
except Exception as e:
    print(f"Error: {e}")
