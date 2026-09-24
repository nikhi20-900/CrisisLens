# CrisisLens AI — Hackathon Live Demo Presentation Script

## Demo Objective
Present a compelling, reliable 4-minute demonstration showing how CrisisLens AI transforms chaotic, fragmented multimodal flood reports into one evolving situation intelligence model, highlights "What changed?", scores priority explainably, recommends matched emergency resources, and empowers the human incident commander to verify and deploy units.

---

## 10-Step Demo Walkthrough

### Step 1: Baseline Command Center Dashboard
- **Presenter**: "Welcome to CrisisLens AI. During natural disasters like flash floods, emergency coordinators are blinded by a deluge of fragmented 911 calls, social media rumors, citizen photos, and drone video. Our platform fuses this chaos into ONE evolving incident object."
- **Action**: Show clean, dark-mode command center with the map, live incident feed, and empty situation log.

### Step 2: First Report Arrives (10:02 AM)
- **Feeder Action**: Send Report `R-001` (Citizen photo & text: *"Heavy flash flood on 4th Main near Central Market Bridge"*).
- **Dashboard Reaction**:
  - Member 1 extracts `disaster_type: flood`, `severity: medium`.
  - Member 2 creates `INC-001` (*"Urban Flash Flood - Sector 4"*).
  - Snapshot 1 created.

### Step 3: Rapid Escalation & Multi-Source Fusion (10:05 - 10:08 AM)
- **Feeder Action**: Send `R-002` (Traffic camera alert) followed by `R-003` (911 Call: *"Five people trapped in bakery near bridge, water rising fast, need boat rescue"*).
- **Dashboard Reaction**:
  - Incident Intelligence matches both reports to `INC-001` using spatial (within 200m) and temporal proximity.
  - Notice in the UI: **We still have only ONE incident**, not three disconnected tickets!

### Step 4: Situation Evolution — "What Changed?" (10:08 AM)
- **Presenter**: "Watch the Situation Evolution banner. CrisisLens highlights exactly what changed across snapshots instead of forcing responders to re-read everything."
- **Visual Callout**:
  - `+ 5 people affected` (Counter updates to 5).
  - `+ New need detected: Rescue`.
  - Severity escalates to `HIGH`.

### Step 5: Road Access Blocked (10:14 AM)
- **Feeder Action**: Send `R-005` (Police patrol: *"Vehicles cannot pass, road completely blocked and submerged"*).
- **Dashboard Reaction**:
  - Road access status shifts from `PARTIALLY_BLOCKED` to `BLOCKED`.
  - Evolution banner reflects: `Road status: BLOCKED`.

### Step 6: Critical Medical Emergency (10:21 AM)
- **Feeder Action**: Send `R-007` (911 Emergency: *"Trapped 68-year-old on bakery roof suffering asthma attack & heart emergency"*).
- **Dashboard Reaction**:
  - New critical need detected: `Medical`.
  - Incident severity jumps to `CRITICAL`.
  - **Dynamic Priority Recalculation**: Priority score jumps from `65.0` to `88.5 / 100`.
  - **Explainability**: UI clearly lists reasons:
    - *5 people trapped*
    - *Critical medical emergency*
    - *Roadway submerged/blocked*

### Step 7: Automated Explainable Resource Matching
- **Presenter**: "Our Decision Engine automatically queries active emergency units and matches appropriate capabilities to unmet needs."
- **Visual Callout**:
  - Need `Rescue` ➔ Matched `Water Rescue Boat Unit Alpha` (Capacity: 6, ETA: 12 min).
  - Need `Medical` ➔ Matched `Rapid Medical Emergency Unit 03` (Paramedics, ETA: 8 min).
  - Rationale is clearly explained on the card.

### Step 8: Human-in-the-Loop Verification
- **Presenter**: "CrisisLens never deploys lethal or emergency assets autonomously. We generate a pending recommendation for the human incident commander."
- **Action**:
  - Presenter clicks **"Approve & Deploy"** (or modifies route notes).
  - Recommendation status changes from `PENDING` to `APPROVED`.
  - System logs: `Verified by Incident Commander at 10:25 AM`.
  - Resource status in catalog transitions from `AVAILABLE` to `ASSIGNED`.

### Step 9: Situation Receding & Evacuation (10:34 - 10:45 AM)
- **Feeder Action**: Send `R-010`, `R-011`, and `R-012` (Rescue complete, water depth decreasing from 1.5m to 0.7m, weather cleared).
- **Dashboard Reaction**:
  - Status updates to `CONTAINED`.
  - All 5 individuals confirmed safe.

### Step 10: Conclusion & Architecture Wrap-Up
- **Presenter**: "In 4 minutes, you witnessed 12 chaotic reports across 5 different sources coalesce into 1 single evolving incident, with complete explainability, instant delta detection, and verified response deployment."
