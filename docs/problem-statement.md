# Problem Statement: PS-01 — CrisisLens: AI for Disaster Response

## 1. Executive Overview

During acute natural and human-induced disasters—such as flash floods, severe cyclones, earthquakes, and wildland fires—emergency operation centers (EOCs) face an overwhelming influx of unorganized, noisy, multi-modal data.

Field information streams arrive from disparate and uncontrolled channels:
- Eyewitness photographs uploaded by citizens to social networks
- Audio distress calls and voice-to-text transcripts
- Fragmented citizen descriptions via emergency chat applications
- Sensor telemetry (real-time precipitation, stream gauges, seismic monitors, satellite thermal spots)

### The Core Operational Challenge
The fundamental bottleneck in disaster response is **not the lack of information**, but the **cognitive overload and duplication** of fragmented data.

When responders receive hundreds of isolated pings:
- Multiple citizens photograph the same flooded intersection from different angles.
- Individual alerts do not convey how a disaster is progressing over time.
- Traditional alert systems display static pins, obscuring whether an event is escalating into a mass-casualty threat or receding.
- AI systems that output black-box predictions without explainable evidence cannot be trusted in high-stakes life-and-death operations.

Responders need immediate, transparent answers to six operational questions:
1. **WHAT** is happening? (Disaster type, physical phenomena, visible destruction)
2. **WHERE** is it happening? (Exact geographic geofence and affected radius)
3. **WHY** does it require urgent priority? (Specific life-safety and transit blockages driving triage)
4. **WHAT EVIDENCE** supports the assessment? (Directly observable photographic and sensory proof)
5. **WHAT IS UNKNOWN?** (Unconfirmed variables requiring active field reconnaissance)
6. **HOW HAS THE SITUATION EVOLVED?** (Chronological progression from initial hazard to current state)

---

## 2. Requirements & Evaluation Criteria Alignment

| Requirement Area | Operational Need | CrisisLens Implementation |
| :--- | :--- | :--- |
| **Multi-Source Data Ingestion** | Accept photos, citizen text, weather, and external alerts. | Multimodal pipeline accepting image uploads, citizen reports, Open-Meteo weather metrics, USGS earthquakes, and NASA thermal spots. |
| **Situation Analysis** | Detect disaster type, physical damage, and affected areas. | Grounded vision AI prompt extracting structured conditions, visible infrastructure damage, and area descriptions. |
| **Severity & Risk Assessment** | Quantitative, explainable hazard ranking. | Deterministic 5-factor Severity Engine (0–100) evaluating people, infrastructure, hazards, accessibility, and environmental risk. |
| **Geographic Prioritisation** | Map-based triage ranking immediate threats first. | Priority Engine combining severity, population exposure, time-sensitive urgency, and access impediments; visualized on Leaflet + OpenStreetMap. |
| **Explainable Output** | Understand the reasoning behind triage labels. | Detailed factor breakdowns ("Why High Priority?") providing explicit physical justifications for every score. |
| **Uncertainty Handling** | Prevent hallucination and highlight intelligence gaps. | Explicit "What is Unknown?" section and automated uncertainty flags when confidence drops below 50%. |
| **Living Crisis Evolution** | Avoid duplicate alerts; represent developing situations. | Crisis Zone Engine correlating reports within 2.0 km into unified evolving zones with chronological step histories. |
| **Human Decision-Support** | Empower—not replace—emergency commanders. | Full Human Review workflow allowing commanders to approve, modify, or escalate assessments with an immutable audit log. |

---

## 3. Human-in-the-Loop Mandate

**CrisisLens is strictly an emergency decision-support platform.** 

It does not autonomously dispatch emergency services, override incident commanders, or replace statutory command chains. 

The AI functions as a high-speed intelligence analyst that organizes messy telemetry and highlights critical anomalies; the ultimate operational responsibility and tactical command remain exclusively with authorized human responders.
