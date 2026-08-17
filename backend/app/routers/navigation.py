from fastapi import APIRouter, Query

from ..services import maps

router = APIRouter()


@router.get("/directions")
async def directions(
    origin: str = Query(..., description='"lat,lng" or a human-readable address'),
    destination: str = Query(..., description='"lat,lng" or a human-readable address'),
    mode: str = Query("walking", pattern="^(walking|driving|bicycling|transit)$"),
):
    routes = await maps.directions(origin, destination, mode)
    return {"routes": routes}
