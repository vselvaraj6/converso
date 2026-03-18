"""
Email service using Resend HTTP API for booking confirmation emails.
Uses httpx (already a project dependency) so no extra packages are needed.
"""

import logging
from typing import Dict

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


def _booking_html(
    lead_name: str,
    meeting_time: str,
    agent_name: str,
    company_name: str,
    meeting_link: str,
) -> str:
    link_block = (
        f'<p style="margin:16px 0"><a href="{meeting_link}" '
        f'style="background:#4f46e5;color:#fff;padding:10px 20px;'
        f'border-radius:6px;text-decoration:none;font-weight:bold">Join Meeting</a></p>'
        if meeting_link
        else ""
    )
    first = lead_name.strip().split()[0] if lead_name else "there"
    return f"""
<html><body style="font-family:sans-serif;color:#1f2937;max-width:520px;margin:0 auto;padding:24px">
  <h2 style="color:#111827">Your meeting is confirmed</h2>
  <p>Hi {first},</p>
  <p>Your meeting with <strong>{agent_name}</strong> from <strong>{company_name}</strong> is all set.</p>
  <p style="font-size:18px;font-weight:bold;color:#4f46e5">{meeting_time}</p>
  {link_block}
  <p>If you need to reschedule, just reply to this email and we'll sort it out.</p>
  <p>Talk soon,<br/>{agent_name}<br/>{company_name}</p>
</body></html>
"""


class EmailService:
    """Send transactional emails via the Resend HTTP API."""

    RESEND_API_URL = "https://api.resend.com/emails"

    async def send_booking_confirmation(
        self,
        to_email: str,
        lead_name: str,
        meeting_time: str,
        agent_name: str,
        company_name: str,
        meeting_link: str = "",
    ) -> Dict:
        if not settings.resend_api_key:
            logger.warning("RESEND_API_KEY not configured — skipping booking confirmation email")
            return {"success": False, "error": "resend_api_key_not_configured"}

        from_address = f"{company_name} <noreply@{settings.email_from_domain}>"
        payload = {
            "from": from_address,
            "to": [to_email],
            "subject": f"Your meeting with {agent_name} is confirmed",
            "html": _booking_html(lead_name, meeting_time, agent_name, company_name, meeting_link),
        }
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(
                    self.RESEND_API_URL,
                    json=payload,
                    headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                )
                response.raise_for_status()
                data = response.json()
                logger.info(f"Booking confirmation email sent to {to_email}: id={data.get('id')}")
                return {"success": True, "id": data.get("id")}
        except Exception as e:
            logger.error(f"Email send error to {to_email}: {e}")
            return {"success": False, "error": str(e)}
