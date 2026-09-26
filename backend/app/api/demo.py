"""Demo Data Seeder API.

Provides endpoints to:
- POST /api/demo/seed: Populate realistic demonstration incidents
- POST /api/demo/reset: Clear all demo incidents without touching production data
"""

import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select

from app.database import get_db
from app.models.incident import Incident
from app.schemas import (
    AIAnalysisResult,
    DamageAssessment,
    PeopleAssessment,
    WeatherContext,
    IncidentResponse,
)
from app.engines.severity_engine import calculate_severity
from app.engines.priority_engine import calculate_priority
from app.engines.recommendation_engine import generate_recommendations

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/demo", tags=["demo"])

# 3 Realistic Scenarios predefined per MVP specs
DEMO_SCENARIOS = [
    {
        "source": "demo_seed",
        "location_name": "Koramangala 4th Block, Bengaluru, India",
        "latitude": 12.9352,
        "longitude": 77.6245,
        "report_text": "People are stranded near the bridge. Floodwaters rose 4 feet in 30 minutes following continuous downpour. Main arterial road is completely submerged and impassable.",
        "image_url": "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80",
        "weather": WeatherContext(
            temperature_c=22.4,
            precipitation_mm=48.5,
            precipitation_probability=95,
            wind_speed_kmh=32.0,
            weather_description="Heavy torrential rain",
            is_severe=True,
            source="Open-Meteo",
            available=True,
        ),
        "ai": AIAnalysisResult(
            disaster_type="flood",
            summary="Severe urban flash flood submerging primary transit corridor. Multiple residents trapped on elevated bridge structure with rapidly moving water preventing pedestrian evacuation.",
            damage=DamageAssessment(
                buildings="moderate",
                roads="blocked",
                utilities="disrupted",
                bridges="moderate",
                vehicles="severe",
            ),
            people=PeopleAssessment(
                visible_people=6,
                estimated_affected=24,
                possible_stranded_people=True,
                possible_injuries=False,
                possible_casualties=False,
            ),
            hazards=[
                "Fast moving floodwater",
                "Submerged electrical junction boxes",
                "Completely blocked road access",
                "Open manholes concealed beneath water",
            ],
            severity=4,
            severity_label="HIGH",
            confidence=0.88,
            evidence=[
                "Turbulent standing water covers two-lane roadway above vehicle wheel height",
                "Civilians clustered on bridge parapet awaiting evacuation",
                "Submerged commercial storefronts and stranded four-wheel drives",
                "Report corroborates sudden flash flooding and trapped citizens",
            ],
            recommended_actions=[
                "Deploy motorized inflatable rescue boats to bridge sector",
                "Erect physical barricades on access roads to Koramangala 4th Block",
                "Coordinate with electricity board to isolate feeder line 4B",
            ],
            accessibility_issues=[
                "Vehicular access impossible from southern avenue",
                "Water depth exceeds 1 meter across approach road",
            ],
            environmental_risks=[
                "Continuing heavy rainfall forecast for next 6 hours",
                "Urban storm runoff compounding retention basin overflow",
            ],
            uncertainty_factors=[
                "Sub-surface structural integrity of bridge foundation cannot be determined visually",
            ],
        ),
    },
    {
        "source": "demo_seed",
        "location_name": "Hatay Central District, Antakya, Turkey",
        "latitude": 36.2023,
        "longitude": 36.1606,
        "report_text": "Building partially collapsed after earthquake. Dust clouds clearing, shouting heard from second floor rubble void. Gas smell reported nearby.",
        "image_url": "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
        "weather": WeatherContext(
            temperature_c=6.2,
            precipitation_mm=0.0,
            precipitation_probability=10,
            wind_speed_kmh=14.0,
            weather_description="Overcast cold",
            is_severe=False,
            source="Open-Meteo",
            available=True,
        ),
        "ai": AIAnalysisResult(
            disaster_type="earthquake",
            summary="Multi-story residential structure suffered progressive collapse following major seismic event. Void spaces present with probable trapped occupants and potential volatile gas line compromise.",
            damage=DamageAssessment(
                buildings="destroyed",
                roads="severe",
                utilities="destroyed",
                bridges="none",
                vehicles="severe",
            ),
            people=PeopleAssessment(
                visible_people=4,
                estimated_affected=35,
                possible_stranded_people=True,
                possible_injuries=True,
                possible_casualties=True,
            ),
            hazards=[
                "Secondary structural pancake collapse",
                "Active natural gas leak",
                "Live overhead power lines downed across debris",
                "Imminent aftershocks",
            ],
            severity=5,
            severity_label="CRITICAL",
            confidence=0.92,
            evidence=[
                "Floor slabs collapsed in pancake formation on lower levels",
                "Heavy concrete rubble obstructing street frontage",
                "Citizens attempting manual debris clearance",
                "Auditory signals indicating trapped victims in void spaces",
            ],
            recommended_actions=[
                "Dispatch Urban Search and Rescue (USAR) heavy extraction squad",
                "Deploy acoustic listening devices and thermal cameras",
                "Immediately isolate natural gas main in 300m radius",
                "Establish triage field station at municipal park 200m east",
            ],
            accessibility_issues=[
                "Road blocked with fallen masonry preventing heavy crane transit",
                "Narrow urban streets constricted by debris piles",
            ],
            environmental_risks=[
                "Sub-zero nighttime temperatures threatening exposed victims",
                "Aftershock risk on already destabilized adjacent buildings",
            ],
            uncertainty_factors=[
                "Exact occupancy at time of collapse remains unconfirmed",
            ],
        ),
    },
    {
        "source": "demo_seed",
        "location_name": "Mendocino National Forest Edge, California, USA",
        "latitude": 39.3875,
        "longitude": -122.9542,
        "report_text": "Fire spreading rapidly toward residential subdivision. High gusty winds driving embers across canyon. Visibility dropping rapidly.",
        "image_url": "https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=1200&q=80",
        "weather": WeatherContext(
            temperature_c=34.8,
            precipitation_mm=0.0,
            precipitation_probability=0,
            wind_speed_kmh=48.0,
            weather_description="Extreme heat, high dry gusts",
            is_severe=True,
            source="Open-Meteo",
            available=True,
        ),
        "ai": AIAnalysisResult(
            disaster_type="wildfire",
            summary="Rapidly advancing wildfire front propelled by erratic winds threatening perimeter homes in wildland-urban interface (WUI). Significant ember cast and dense particulate smoke.",
            damage=DamageAssessment(
                buildings="moderate",
                roads="blocked",
                utilities="severe",
                bridges="unknown",
                vehicles="moderate",
            ),
            people=PeopleAssessment(
                visible_people=2,
                estimated_affected=80,
                possible_stranded_people=False,
                possible_injuries=False,
                possible_casualties=False,
            ),
            hazards=[
                "Canyon wind-driven crown fire",
                "Long-range spotting / ember transport over 500 meters",
                "Thick smoke causing extreme visibility degradation (<50m)",
                "Rapid fire spread along dry brush slopes",
            ],
            severity=4,
            severity_label="HIGH",
            confidence=0.85,
            evidence=[
                "Towering pyrocumulus smoke plume and active flame wall visible",
                "Dense dry chaparral fuel loading in path of fire front",
                "Severe wind conditions accelerating upslope thermal draft",
            ],
            recommended_actions=[
                "Issue mandatory Level 3 (GO NOW) evacuation for Subdivision Sectors A-D",
                "Stage aerial retardant tankers for ridge defense",
                "Position structural protection strike teams at canyon access road",
            ],
            accessibility_issues=[
                "Single ingress/egress canyon road subject to spot fires",
                "Heavy smoke grounding low-altitude rotary aircraft",
            ],
            environmental_risks=[
                "Sustained 48 km/h gusts with relative humidity below 12%",
                "Canyon topography creating localized chimney draft effect",
            ],
            uncertainty_factors=[
                "Specific rate of forward spread varies with changing ridge wind direction",
            ],
        ),
    },
]


@router.post("/seed", response_model=list[IncidentResponse])
async def seed_demo_data(db: AsyncSession = Depends(get_db)):
    """Seed the 3 official demo scenarios with full deterministic scoring and explainability."""
    # First clear any existing demo incidents
    await db.execute(delete(Incident).where(Incident.is_demo == True))

    seeded_incidents = []

    for item in DEMO_SCENARIOS:
        ai_res: AIAnalysisResult = item["ai"]
        weather: WeatherContext = item["weather"]

        # Run engines
        severity = calculate_severity(ai_res)
        priority = calculate_priority(ai_res, severity, weather)
        recommendations = generate_recommendations(ai_res, severity, priority)

        uncertainty_flag = ai_res.confidence < 0.50
        uncertainty_reason = None
        if uncertainty_flag:
            uncertainty_reason = "Human Review Required: Low AI confidence"

        inc = Incident(
            source=item["source"],
            image_url=item["image_url"],
            report_text=item["report_text"],
            latitude=item["latitude"],
            longitude=item["longitude"],
            location_name=item["location_name"],
            disaster_type=ai_res.disaster_type,
            severity_score=severity.normalized_score,
            severity_label=severity.label,
            priority_score=priority.normalized_score,
            priority_label=priority.label,
            confidence_score=ai_res.confidence,
            uncertainty_flag=uncertainty_flag,
            uncertainty_reason=uncertainty_reason,
            affected_people_estimate=max(ai_res.people.visible_people, ai_res.people.estimated_affected),
            infrastructure_damage=ai_res.damage.model_dump(),
            hazards=ai_res.hazards,
            evidence=ai_res.evidence,
            recommendations=recommendations,
            weather_context=weather.model_dump(),
            ai_assessment=ai_res.model_dump(),
            severity_breakdown=severity.model_dump(),
            priority_breakdown=priority.model_dump(),
            review_status="pending",
            is_demo=True,
        )
        db.add(inc)
        seeded_incidents.append(inc)

    await db.flush()
    for inc in seeded_incidents:
        await db.refresh(inc)

    logger.info(f"Seeded {len(seeded_incidents)} realistic demo scenarios.")
    return [IncidentResponse.model_validate(inc) for inc in seeded_incidents]


@router.post("/reset")
async def reset_demo_data(db: AsyncSession = Depends(get_db)):
    """Remove all demo incidents without touching user submitted data."""
    result = await db.execute(delete(Incident).where(Incident.is_demo == True))
    await db.commit()
    return {"message": "Demo data removed successfully", "deleted": result.rowcount}
