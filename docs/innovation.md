# The Innovation: The Living Crisis Map & Crisis Zones

## 1. Paradigm Shift: From Isolated Alerts to Living Crisis Zones

Traditional disaster management platforms operate on an **alert-centric model**:
- Every incoming tweet, citizen phone call, or photo is plotted as an independent dot on a map.
- During a major urban flood or earthquake, hundreds of overlapping pins appear across the map within hours.
- Emergency commanders suffer from severe visual noise and have to manually click each pin to piece together what is happening.
- Responders cannot tell whether a cluster of 20 pins represents 20 different incidents or 20 people photographing the same collapsed bridge.

CrisisLens introduces the **Crisis Zone & Living Crisis Map model**:

```
Traditional Approach:
[Alert #1]  [Alert #2]  [Alert #3]  [Alert #4]  (Scattered, disconnected, noisy)

CrisisLens Innovation:
[Alert #1] + [Alert #2] + [Alert #3] + [Alert #4]
                  ↓
       CRISIS ZONE #07 (Living, Evolving Narrative)
```

A **Crisis Zone** represents a single, cohesive, physical disaster situation bounded in space and tracked across time.

---

## 2. Chronological Evolution Example

Consider an actual flash flood scenario in an urban corridor:

```
10:05 UTC — Initial Ingestion
  • Observation: Road surface flooded with water accumulation on asphalt
  • Triage Score: Priority 32/100 (MEDIUM) | Severity 15/100 (LOW)
  • Situation: Traffic delays on arterial lane; no structures compromised

10:15 UTC — Citizen Update (< 2.0 km geofence)
  • Observation: Flood water rising rapidly; water breaching ground-floor doorways
  • Triage Score: Priority 46/100 (MEDIUM) | Severity 32/100 (MEDIUM)
  • Change Reason: Priority escalated by +14 pts: residential structures breached

10:25 UTC — Photographic Evidence Upload
  • Observation: Water levels exceed 1.2m; families visibly stranded on rooftops
  • Triage Score: Priority 57/100 (HIGH) | Severity 42/100 (MEDIUM)
  • Change Reason: Escalation driven by stranded population requiring immediate boat rescue

10:35 UTC — Drone / Dispatch Reconnaissance
  • Observation: Primary bridge access blocked by submerged debris and downed lines
  • Triage Score: Priority 74/100 (HIGH/CRITICAL) | Severity 65/100 (HIGH)
  • Change Reason: Transit blockage prevents standard ambulance or fire engine ingress
```

Instead of 4 disparate map pins, CrisisLens displays **one dynamic Crisis Zone** on the map with an update counter (`4x`), dynamic hazard circle, and a chronological scrubber.

---

## 3. Geospatial Correlation Logic

When new multimodal evidence (image, citizen report, or coordinate update) enters the system:

1. **Haversine Proximity Check**:
   The system calculates the great-circle Haversine distance between the new report coordinates $(\text{lat}_1, \text{lon}_1)$ and all active Crisis Zones $(\text{lat}_2, \text{lon}_2)$:
   $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
2. **Correlation Threshold**:
   If the distance $d \le 2.0\text{ km}$ and the disaster type aligns (e.g., both are `flood`), the report is correlated into the existing Crisis Zone.
3. **Timeline Append**:
   A new timestamped evolution step is appended to the zone's `evolution_history` JSON record.
4. **Deterministic Score Delta Calculation**:
   The engine compares previous priority vs. new priority and generates an explainable natural-language justification (e.g., *"Priority escalated from MEDIUM (46) to HIGH (57): Escalation driven by stranded rooftop population"*).

---

## 4. Multi-Cue Visual Hierarchy (Accessibility & Ergonomics)

To ensure rapid comprehension under stress and eliminate reliance on color alone:

- **CRITICAL**: Red badge (`CRIT`), Alert Triangle icon, and animated pulsing outer ring (`severity-pulse`).
- **HIGH**: Orange badge (`HIGH`), Flame/Alert icon, and amber pulse ring.
- **MEDIUM**: Amber/Yellow badge (`MED`), Warning icon.
- **LOW**: Blue badge (`LOW`), Information icon.
- **Living Count Indicator**: Zones with multiple updates feature a high-contrast `2x`, `3x`, `4x` badge communicating situation vitality at a glance.
- **Dynamic Hazard Radius Rings**: Sized in meters according to assessed ground impact (350m to 1200m).
