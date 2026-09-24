# CrisisLens AI — Demo Scenario & Data Assets

This directory contains pre-configured test scenarios and simulated emergency resource catalogs for hackathon demonstrations.

## Scenario: Urban Flash Flood (Sector 4)

- **File**: `data/demo/flood_scenario.json`
- **Disaster Type**: `flood`
- **Total Reports**: 12 sequential multimodal reports spanning 10:02 AM to 10:45 AM.
- **Narrative Arc**:
  1. **10:02 - 10:05**: Water begins rising on roadway; initial traffic alert.
  2. **10:08**: 5 people reported trapped in bakery by rising water (Need: Rescue).
  3. **10:11 - 10:14**: Road access becomes completely blocked (Access: Blocked).
  4. **10:17**: Drone aerial confirms roof terrace situation.
  5. **10:21**: Medical emergency reported for elderly trapped individual (Need: Medical, Priority: Critical).
  6. **10:24**: Infrastructure impact (submerged electrical grid hazard).
  7. **10:28**: Incident commander verifies AI recommendation; Boat Alpha and Ambulance 03 dispatched.
  8. **10:34**: Rescue team on scene, medical aid administered, evacuation starts.
  9. **10:40**: Water levels drop, weather clears.
  10. **10:45**: Full evacuation successful, situation contained.

## Resources Catalog

- **File**: `data/demo/resources.json`
- Contains ready-to-deploy assets (Rescue Boat Alpha, Ambulance 03, Evacuation Bus 09, Water Pump, and Food/Water Unit) with realistic GPS coordinates, capacities, and availability statuses.

## Simulation Script

Run the feeder simulation to stream these reports sequentially into the backend:
```bash
python scripts/simulate_reports.py
```
