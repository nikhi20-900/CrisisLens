#!/usr/bin/env python3
"""
CrisisLens AI — Demo Feeder Script
Feeds the 12 prepared flood scenario reports sequentially into the CrisisLens backend.
"""

import json
import time
import sys
from pathlib import Path
import httpx

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "demo" / "flood_scenario.json"
BACKEND_URL = "http://localhost:8000/api/v1/reports/"


def run_simulation(delay_seconds: float = 2.0):
    if not DATA_PATH.exists():
        print(f"Error: Scenario file not found at {DATA_PATH}")
        sys.exit(1)

    with open(DATA_PATH, "r") as f:
        scenario = json.load(f)

    reports = scenario.get("reports", [])
    print(f"Starting simulation of '{scenario.get('name')}' with {len(reports)} reports...")

    with httpx.Client(timeout=10.0) as client:
        for idx, report in enumerate(reports, 1):
            print(f"\n[{idx}/{len(reports)}] Submitting Report: {report['report_id']} ({report['timestamp']})")
            print(f"  Source: {report['source']}")
            print(f"  Text: {report['text']}")

            try:
                res = client.post(BACKEND_URL, json=report)
                if res.status_code == 200:
                    data = res.json()
                    print(f"  --> Analyzed & Fused into Incident: {data.get('incident_id')}")
                    rec = data.get("active_recommendation")
                    if rec:
                        print(f"  --> Priority: {rec.get('priority_score')} ({rec.get('priority_level')})")
                        print(f"  --> Recommended Units: {len(rec.get('recommended_resources', []))}")
                else:
                    print(f"  [!] Failed: HTTP {res.status_code} - {res.text}")
            except Exception as e:
                print(f"  [!] Error connecting to backend: {e}")
                print("      Ensure backend is running on http://localhost:8000")
                break

            time.sleep(delay_seconds)

    print("\nSimulation complete. All reports processed.")


if __name__ == "__main__":
    delay = float(sys.argv[1]) if len(sys.argv) > 1 else 2.0
    run_simulation(delay)
