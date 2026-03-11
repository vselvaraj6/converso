"""
Cal.com integration for meeting scheduling.

Connects to a self-hosted Cal.com instance via the v2 REST API.
Handles availability checks, booking creation, and webhook verification.
"""

import hashlib
import hmac
import logging
from typing import Dict, List, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

_client_config = {
    "base_url": settings.calcom_base_url.rstrip("/"),
    "headers": {
        "Authorization": f"Bearer {settings.calcom_api_key}",
        "cal-api-version": "2024-08-13",
        "Content-Type": "application/json",
    },
    "timeout": 15.0,
}


class CalComService:
    """Cal.com v2 API client for scheduling operations."""

    # ── Availability ──────────────────────────────────────────────────────────

    async def get_available_slots(
        self,
        event_type_id: int,
        start_time: str,
        end_time: str,
    ) -> List[Dict]:
        """
        Return available slots for an event type.

        Args:
            event_type_id: Cal.com event type ID (maps to a round-robin team event).
            start_time: ISO-8601 string, e.g. "2025-03-15T00:00:00Z"
            end_time:   ISO-8601 string, e.g. "2025-03-22T00:00:00Z"

        Returns:
            List of slot dicts: [{"time": "2025-03-15T09:00:00Z"}, ...]
        """
        try:
            async with httpx.AsyncClient(**_client_config) as client:
                resp = await client.get(
                    "/slots/available",
                    params={
                        "eventTypeId": event_type_id,
                        "startTime": start_time,
                        "endTime": end_time,
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                # Cal.com v2 returns {"status": "success", "data": {"slots": {...}}}
                slots_by_day = data.get("data", {}).get("slots", {})
                # Flatten to a list ordered by time
                flat = []
                for day_slots in slots_by_day.values():
                    flat.extend(day_slots)
                flat.sort(key=lambda s: s["time"])
                return flat
        except Exception as e:
            logger.error(f"Cal.com get_available_slots error: {e}")
            return []

    # ── Bookings ──────────────────────────────────────────────────────────────

    async def create_booking(
        self,
        event_type_id: int,
        start_time: str,
        attendee_name: str,
        attendee_email: str,
        attendee_phone: Optional[str] = None,
        notes: Optional[str] = None,
        timezone: str = "UTC",
    ) -> Dict:
        """
        Create a booking on Cal.com.

        Returns dict with keys: success, booking_uid, meeting_url, error.
        """
        try:
            attendee: Dict = {
                "name": attendee_name,
                "email": attendee_email,
                "timeZone": timezone,
            }
            if attendee_phone:
                attendee["phoneNumber"] = attendee_phone

            body: Dict = {
                "eventTypeId": event_type_id,
                "start": start_time,
                "attendee": attendee,
            }
            if notes:
                body["metadata"] = {"notes": notes}

            async with httpx.AsyncClient(**_client_config) as client:
                resp = await client.post("/bookings", json=body)
                resp.raise_for_status()
                data = resp.json().get("data", {})

            return {
                "success": True,
                "booking_uid": data.get("uid"),
                "meeting_url": data.get("meetingUrl"),
                "start": data.get("start"),
                "end": data.get("end"),
            }
        except httpx.HTTPStatusError as e:
            logger.error(f"Cal.com create_booking HTTP error {e.response.status_code}: {e.response.text}")
            return {"success": False, "error": f"HTTP {e.response.status_code}"}
        except Exception as e:
            logger.error(f"Cal.com create_booking error: {e}")
            return {"success": False, "error": str(e)}

    async def cancel_booking(self, booking_uid: str, reason: str = "") -> bool:
        """Cancel an existing booking by UID."""
        try:
            async with httpx.AsyncClient(**_client_config) as client:
                resp = await client.delete(
                    f"/bookings/{booking_uid}/cancel",
                    json={"cancellationReason": reason},
                )
                resp.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"Cal.com cancel_booking error: {e}")
            return False

    # ── Webhook verification ──────────────────────────────────────────────────

    @staticmethod
    def verify_webhook(payload_bytes: bytes, signature_header: str) -> bool:
        """
        Verify Cal.com webhook signature.

        Cal.com signs the raw request body with HMAC-SHA256 using the
        webhook secret configured in the Cal.com dashboard.
        Header name: X-Cal-Signature-256
        """
        if not settings.calcom_webhook_secret:
            # Signature verification disabled — only acceptable in local dev
            logger.warning("calcom_webhook_secret not set; skipping signature check")
            return True

        try:
            expected = hmac.new(
                settings.calcom_webhook_secret.encode(),
                payload_bytes,
                hashlib.sha256,
            ).hexdigest()
            # Header format: "sha256=<hex>"
            provided = signature_header.removeprefix("sha256=")
            return hmac.compare_digest(expected, provided)
        except Exception as e:
            logger.error(f"Webhook signature verification error: {e}")
            return False
