# CrisisLens — 2-Minute Competition Demo Walkthrough

This demo guide provides a step-by-step walkthrough for evaluating CrisisLens in a competitive hackathon setting or live responder panel within two minutes.

---

## Demo Overview

| Parameter | Details |
|---|---|
| **Goal** | Demonstrate how fragmented disaster data transforms into an evolving, explainable Crisis Zone |
| **Duration** | 2 Minutes |
| **Audience** | Hackathon Judges, Disaster Response Coordinators, Technical Evaluators |
| **Prerequisites** | Backend running on `http://127.0.0.1:8000`, Frontend running on `http://127.0.0.1:5173` |

---

## 2-Minute Script & Timeline

### 0:00 – 0:25 | Step 1: The Problem & The Living Crisis Map

1. **Open Frontend Dashboard** (`http://127.0.0.1:5173`).
2. **Present the Map View**: Point to the Leaflet interactive map populated with OpenStreetMap tiles.
3. **Key Narrative**:
   > *"During a flood or earthquake, emergency responders receive hundreds of isolated tweets, photos, and messages. Traditional alert tools drop endless red pins on a map, causing decision paralysis. CrisisLens solves this with the **Living Crisis Map** — grouping related multi-source evidence into dynamic, evolving **Crisis Zones**."*
4. **Point Out Existing Zones**:
   - Highlight Zone `#01` or active zones with priority rings (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
   - Click a zone marker to show the situation summary, supporting evidence count, and evolving timeline.

---

### 0:25 – 0:55 | Step 2: Ingesting Multimodal Disaster Evidence

1. **Navigate to the "Report Disaster" / Analysis Form**:
2. **Upload Disaster Photo**: Select an image depicting flooded residential roads or trapped vehicles.
3. **Input Citizen Report** (Use standard competition test scenario):
   ```text
   Heavy rain has been falling since last night. Our residential area is completely flooded. Water has entered several houses, and multiple cars are stuck on the road. Some residents, including children and elderly people, are unable to leave their homes. The main access road is blocked and the water level appears to be rising. We need urgent assistance for evacuation.
   ```
4. **Set Coordinates**: Enter known incident coordinates (e.g., Latitude `19.0760`, Longitude `72.8777` for Mumbai, or select directly on map).
5. **Click "Submit & Analyze Incident"**.
6. **Key Narrative**:
   > *"Notice that we are not asking the responder to parse the image or manually cross-check reports. Our backend packages the image and citizen text into a unified multimodal payload via OpenRouter's vision pipeline."*

---

### 0:55 – 1:25 | Step 3: Explainable Assessment & Uncertainty Breakdown

1. **Show the Extraction Breakdown**:
   - **Hazard Observed**: Flood / Urban Inundation.
   - **Severity Score**: e.g., `0.85` (Critical).
   - **Confidence Metric**: e.g., `0.92`.
2. **Highlight the Explainability Section ("Why?")**:
   - Point to:
     - *Residential structures submerged*
     - *Main arterial access blocked*
     - *Stranded vulnerable populations (children and elderly)*
3. **Highlight Uncertainty Handling ("What is Unknown?")**:
   - Point to explicitly identified gaps:
     - *Exact water depth / rate of rise*
     - *Exact count of trapped individuals*
     - *Secondary road passability*
4. **Key Narrative**:
   > *"Black-box AI is dangerous in disaster response. CrisisLens explains precisely WHY the situation was escalated, while explicitly enumerating UNKNOWNS so incident commanders know what reconnaissance to dispatch first."*

---

### 1:25 – 1:45 | Step 4: Spatiotemporal Aggregation into a Crisis Zone

1. **Return to the Map / View Zone Detail**:
2. Show that this new incident did not create a disconnected lone marker—it correlated via Haversine spatiotemporal clustering into an evolving **Crisis Zone**.
3. **Show Situation Evolution Timeline**:
   - `10:05` — Flooded road reported.
   - `10:15` — Water entering residential homes.
   - `10:25` — Stranded vulnerable residents detected.
   - `10:35` — Main access artery blocked; priority escalated from `HIGH` to `CRITICAL`.
4. **Priority Change Rationale**:
   - Show the dynamic badge: *"Priority escalated due to access cut-off and life safety risk."*

---

### 1:45 – 2:00 | Step 5: Human-in-the-Loop Decision Support

1. **Show Response Recommendations**:
   - Suggested Action: *Deploy high-clearance watercraft / inflatable rescue boats to residential sector.*
   - Evacuation Priority: *Immediate evacuation of elderly and children.*
2. **Highlight Human Control**:
   - Show Responder Action Buttons: **Acknowledge**, **Deploy Unit**, **Mark False Positive**, or **Request Drone Recon**.
3. **Final Concluding Statement**:
   > *"CrisisLens never dispatches units or makes autonomous decisions. It empowers human emergency commanders with real-time, explainable, and evolving situational intelligence."*

---

## Backup Scenario & Offline Graceful Degradation

If external network connectivity is restricted during a live pitch or the external AI provider is rate-limited:
- CrisisLens catches HTTP 429 / upstream errors cleanly.
- The system automatically triggers deterministic heuristic fallback parsing.
- Seed database records (`/api/incidents`) contain pre-computed crisis zones demonstrating the complete timeline, explainability cues, and map interaction seamlessly without live internet dependency.
