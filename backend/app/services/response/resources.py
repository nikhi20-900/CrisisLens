"""
Phase 3: Demo Resource Catalog
==============================
Maintains emergency response assets using domain Resource schema.
"""

from typing import List, Dict, Optional
from app.schemas.domain import (
    Resource,
    ResourceType,
    ResourceAvailability,
    Location,
)


def get_default_resources() -> Dict[str, Resource]:
    """Returns a fresh dictionary of initial demo resources."""
    return {
        "RES-01": Resource(
            resource_id="RES-01",
            name="Water Rescue Boat Unit Alpha",
            resource_type=ResourceType.RESCUE_BOAT,
            location=Location(lat=12.930, lng=77.620, address="Station 4 Dock"),
            availability=ResourceAvailability.AVAILABLE,
            capacity=6,
            estimated_eta_minutes=12,
        ),
        "RES-02": Resource(
            resource_id="RES-02",
            name="Rapid Medical Emergency Unit 03",
            resource_type=ResourceType.AMBULANCE,
            location=Location(lat=12.940, lng=77.630, address="General Hospital Base"),
            availability=ResourceAvailability.AVAILABLE,
            capacity=2,
            estimated_eta_minutes=8,
        ),
        "RES-03": Resource(
            resource_id="RES-03",
            name="High-Capacity Evacuation Bus 09",
            resource_type=ResourceType.EVACUATION_BUS,
            location=Location(lat=12.925, lng=77.615, address="City Transit Depot"),
            availability=ResourceAvailability.AVAILABLE,
            capacity=40,
            estimated_eta_minutes=20,
        ),
        "RES-04": Resource(
            resource_id="RES-04",
            name="Food & Water Relief Unit 01",
            resource_type=ResourceType.FOOD_WATER_UNIT,
            location=Location(lat=12.935, lng=77.625, address="Central Logistics Hub"),
            availability=ResourceAvailability.AVAILABLE,
            capacity=100,
            estimated_eta_minutes=15,
        ),
        "RES-05": Resource(
            resource_id="RES-05",
            name="Emergency Rescue Team Bravo",
            resource_type=ResourceType.RESCUE_TEAM,
            location=Location(lat=12.910, lng=77.600, address="Fire Station 12"),
            availability=ResourceAvailability.AVAILABLE,
            capacity=10,
            estimated_eta_minutes=25,
        ),
        "RES-06": Resource(
            resource_id="RES-06",
            name="Field Medical Team 02",
            resource_type=ResourceType.MEDICAL_TEAM,
            location=Location(lat=12.950, lng=77.640, address="Red Cross Command"),
            availability=ResourceAvailability.AVAILABLE,
            capacity=5,
            estimated_eta_minutes=18,
        ),
    }


class ResourceCatalog:
    """
    In-memory store for emergency resources.
    """

    def __init__(self, initial_resources: Optional[Dict[str, Resource]] = None):
        self._resources: Dict[str, Resource] = (
            initial_resources if initial_resources is not None else get_default_resources()
        )

    def get_resource(self, resource_id: str) -> Optional[Resource]:
        """Retrieves resource by ID."""
        return self._resources.get(resource_id)

    def list_resources(self) -> List[Resource]:
        """Returns list of all registered resources."""
        return list(self._resources.values())

    def add_resource(self, resource: Resource) -> None:
        """Adds or updates a resource in the catalog."""
        self._resources[resource.resource_id] = resource

    def update_availability(
        self, resource_id: str, status: ResourceAvailability, assignment: Optional[str] = None
    ) -> Optional[Resource]:
        """Updates availability status and assignment of a resource."""
        res = self._resources.get(resource_id)
        if res:
            res.availability = status
            if assignment is not None:
                res.current_assignment = assignment
        return res

    def reset_to_default(self) -> None:
        """Resets the catalog back to default demo state."""
        self._resources = get_default_resources()


default_resource_catalog = ResourceCatalog()
