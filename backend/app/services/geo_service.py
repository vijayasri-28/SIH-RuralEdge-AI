import json
from pathlib import Path
from typing import Dict, Any, List, Optional

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
LGD_FILE = DATA_DIR / "lgd_hierarchy.json"
ARCHETYPES_FILE = DATA_DIR / "business_archetypes.json"

class GeoService:
    def __init__(self):
        with open(LGD_FILE, "r", encoding="utf-8") as f:
            self.lgd_data = json.load(f)
        with open(ARCHETYPES_FILE, "r", encoding="utf-8") as f:
            self.archetypes_data = json.load(f)
        self.archetypes = {a["archetype_id"]: a for a in self.archetypes_data.get("archetypes", [])}

    def get_states(self) -> List[Dict[str, Any]]:
        return [{"state_code": s["state_code"], "state_name": s["state_name"]} for s in self.lgd_data.get("states", [])]

    def get_districts(self, state_code: int) -> List[Dict[str, Any]]:
        for s in self.lgd_data.get("states", []):
            if s["state_code"] == state_code:
                return [
                    {
                        "district_code": d["district_code"],
                        "district_name": d["district_name"],
                        "sc_population_percentage": d.get("sc_population_percentage", 15.0),
                        "primary_crops": d.get("primary_crops", [])
                    }
                    for d in s.get("districts", [])
                ]
        return []

    def get_blocks(self, state_code: int, district_code: int) -> List[Dict[str, Any]]:
        for s in self.lgd_data.get("states", []):
            if s["state_code"] == state_code:
                for d in s.get("districts", []):
                    if d["district_code"] == district_code:
                        return [
                            {
                                "block_code": b["block_code"],
                                "block_name": b["block_name"],
                                "total_population": b.get("total_population", 50000),
                                "total_households": b.get("total_households", 10000)
                            }
                            for b in d.get("blocks", [])
                        ]
        return []

    def get_villages(self, state_code: int, district_code: int, block_code: int) -> List[Dict[str, Any]]:
        for s in self.lgd_data.get("states", []):
            if s["state_code"] == state_code:
                for d in s.get("districts", []):
                    if d["district_code"] == district_code:
                        for b in d.get("blocks", []):
                            if b["block_code"] == block_code:
                                return [
                                    {
                                        "village_code": v["village_code"],
                                        "village_name": v["village_name"],
                                        "population": v.get("population", 3000),
                                        "power_availability_hours_per_day": v.get("power_availability_hours_per_day", 18),
                                        "has_local_mandi": v.get("has_local_mandi", False),
                                        "competitor_density": v.get("competitor_density", {})
                                    }
                                    for v in b.get("villages", [])
                                ]
        return []

    def get_geo_context(
        self,
        state_code: int,
        district_code: int,
        block_code: int,
        village_code: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Retrieves grounded demographic and market indicators,
        handling graceful fallback (Village -> Block -> District).
        """
        state_match = next((s for s in self.lgd_data.get("states", []) if s["state_code"] == state_code), None)
        if not state_match:
            return {"fallback_level": "DISTRICT", "demographics": {"name": "Regional Catchment", "population": 100000}}

        district_match = next((d for d in state_match.get("districts", []) if d["district_code"] == district_code), None)
        if not district_match:
            return {"fallback_level": "STATE", "state_name": state_match["state_name"]}

        block_match = next((b for b in district_match.get("blocks", []) if b["block_code"] == block_code), None)
        if not block_match:
            return {
                "fallback_level": "DISTRICT",
                "district_name": district_match["district_name"],
                "sc_population_percentage": district_match.get("sc_population_percentage", 16.0),
                "primary_crops": district_match.get("primary_crops", [])
            }

        if village_code:
            village_match = next((v for v in block_match.get("villages", []) if v["village_code"] == village_code), None)
            if village_match:
                return {
                    "fallback_level": "VILLAGE",
                    "village_name": village_match["village_name"],
                    "population": village_match["population"],
                    "power_hours": village_match["power_availability_hours_per_day"],
                    "has_mandi": village_match["has_local_mandi"],
                    "competitor_density": village_match.get("competitor_density", {}),
                    "block_name": block_match["block_name"],
                    "district_name": district_match["district_name"],
                    "sc_pop_pct": district_match.get("sc_population_percentage", 16.0),
                    "crops": district_match.get("primary_crops", [])
                }

        # Fallback to Block level
        return {
            "fallback_level": "BLOCK",
            "block_name": block_match["block_name"],
            "population": block_match["total_population"],
            "households": block_match["total_households"],
            "district_name": district_match["district_name"],
            "sc_pop_pct": district_match.get("sc_population_percentage", 16.0),
            "crops": district_match.get("primary_crops", [])
        }

    def get_archetypes(self) -> List[Dict[str, Any]]:
        return self.archetypes_data.get("archetypes", [])

    def get_archetype_by_id(self, archetype_id: str) -> Optional[Dict[str, Any]]:
        return self.archetypes.get(archetype_id)

geo_service = GeoService()
