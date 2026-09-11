"""Service layer for interacting with the Renault API."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import aiohttp

from renault_api.kamereon.enums import AssetPictureSize
from renault_api.renault_client import RenaultClient

@dataclass
class RenaultSession:
    """Everything needed to act on behalf of a logged-in Renault user."""

    login_token: str
    account_id: str
    vin: str


async def authenticate(email: str, password: str) -> RenaultSession:
    """Authenticate with Renault and discover the account/vehicle to use."""
    async with aiohttp.ClientSession() as session:
        client = RenaultClient(websession=session, locale="sv_SE")
        await client.session.login(email, password)

        account_id: str | None = None
        vin: str | None = None
        for account in await client.get_api_accounts():
            vehicles = await account.get_api_vehicles()
            if vehicles:
                account_id = account.account_id
                vin = vehicles[0].vin
                await vehicles[0].get_details()
                break

        if account_id is None or vin is None:
            raise RuntimeError("No vehicle found on this Renault account.")

        login_token = client.session.login_token

    if not login_token:
        raise RuntimeError("Renault did not return a login token.")
    return RenaultSession(login_token=login_token, account_id=account_id, vin=vin)


async def _get_vehicle(session: aiohttp.ClientSession, renault_session: RenaultSession):
    """Authenticate and return a RenaultVehicle proxy."""
    client = RenaultClient(websession=session, locale="sv_SE")
    client.session.set_login_token(renault_session.login_token)
    account = await client.get_api_account(renault_session.account_id)
    return await account.get_api_vehicle(renault_session.vin)


async def get_car_picture(renault_session: RenaultSession) -> dict:
    """Fetch vehicle picture URL and basic model info."""
    async with aiohttp.ClientSession() as session:
        vehicle = await _get_vehicle(session, renault_session)
        details = await vehicle.get_details()

    return {
        "brand": details.get_brand_label(),
        "model": details.get_model_label(),
        "pictureUrl": details.get_picture(AssetPictureSize.LARGE),
    }


async def get_car_status(renault_session: RenaultSession) -> dict:
    """Fetch battery status, cockpit (mileage) and location for the logged-in user's vehicle."""
    async with aiohttp.ClientSession() as session:
        vehicle = await _get_vehicle(session, renault_session)

        # Fire requests concurrently
        import asyncio

        battery_task = asyncio.create_task(vehicle.get_battery_status())
        cockpit_task = asyncio.create_task(vehicle.get_cockpit())
        location_task = asyncio.create_task(vehicle.get_location())

        battery = await battery_task
        cockpit = await cockpit_task
        location = await location_task

    return {
        "battery": {
            "level": battery.batteryLevel,
            "autonomy": battery.batteryAutonomy,
            "plugStatus": battery.plugStatus,
            "chargingStatus": battery.chargingStatus,
            "remainingTime": battery.chargingRemainingTime,
        },
        "cockpit": {
            "totalMileage": cockpit.totalMileage,
        },
        "location": {
            "latitude": location.gpsLatitude,
            "longitude": location.gpsLongitude,
            "lastUpdated": location.lastUpdateTime,
        },
    }


async def get_charge_history(renault_session: RenaultSession, days: int = 90) -> list[dict]:
    """Fetch individual charge sessions (kWh, duration, avg charging speed) for the past `days` days."""
    async with aiohttp.ClientSession() as session:
        vehicle = await _get_vehicle(session, renault_session)
        await vehicle.get_details()
        end = datetime.now(timezone.utc)
        start = end - timedelta(days=days)
        response = await vehicle.get_charges(start=start, end=end)

    charges = (response.raw_data or {}).get("charges", [])

    sessions = []
    for item in charges:
        start_raw = item.get("chargeStartDate")
        end_raw = item.get("chargeEndDate")
        # chargeDuration's unit (seconds vs minutes) is unreliable across vehicle
        # models, so derive duration from the actual start/end timestamps instead.
        duration_minutes = None
        if start_raw and end_raw:
            try:
                start_dt = datetime.fromisoformat(start_raw.replace("Z", "+00:00"))
                end_dt = datetime.fromisoformat(end_raw.replace("Z", "+00:00"))
                duration_minutes = (end_dt - start_dt).total_seconds() / 60
            except ValueError:
                duration_minutes = None
        energy_kwh = item.get("chargeEnergyRecovered")
        avg_power_kw = (
            energy_kwh / (duration_minutes / 60)
            if energy_kwh is not None and duration_minutes
            else None
        )
        sessions.append(
            {
                "startDate": start_raw,
                "endDate": end_raw,
                "durationMinutes": duration_minutes,
                "energyKwh": energy_kwh,
                "startBatteryLevel": item.get("chargeStartBatteryLevel"),
                "endBatteryLevel": item.get("chargeEndBatteryLevel"),
                "avgPowerKw": avg_power_kw,
            }
        )

    sessions.sort(key=lambda s: s["startDate"] or "")
    return sessions
