"""
Mortgage + Refi Campaign Templates
Source: 8Twelve Mortgage — Mortgage_Refi Campaign + Nurture

Two distinct initial campaigns (Mortgage vs Refi) sharing the same nurture sequence.
Detection is based on lead.interest / lead.industry keywords.

Variables: {first_name}, {agent_name}, {company_name}

Usage:
    msg = get_campaign_message(lead, outbound_sms_count, agent_name, company_name)
    if msg is None: campaign exhausted.
"""

from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from app.models import Lead


# ── Shared nurture campaign — Days 2–180 post initial 7-day window ──────────
# Used by both Mortgage and Refi tracks.

NURTURE_CAMPAIGN = [
    # 0 — Day 2
    "{first_name}?",
    # 1 — Day 4
    "If it's easier, we can always set up a meeting closer to your work. Would that make more sense?",
    # 2 — Day 6  [mortgage: real estate agent | refi: current lender — resolved at dispatch]
    None,  # placeholder; resolved per-campaign below
    # 3 — Day 10
    "Hey {first_name}. I definitely don't want to spam you, but I just want to make sure I'm here to help with your loan needs. Are you still interested?",
    # 4 — Day 13
    "There are a couple openings in the calendar tomorrow — did you want me to set something up over the phone?",
    # 5 — Day 17
    "Hey {first_name}, rates are changing quickly. Do you have a few minutes to connect today?",
    # 6 — Day 21
    "Is now a good time for a call {first_name}?",
    # 7 — Day 24
    "Hope you're doing well {first_name}! You contacted us recently about your home loan. Let me know if I can help!",
    # 8 — Day 28
    "Hi {first_name}, I want to make sure I'm providing value. Are you still looking to see what you qualify for?",
    # 9 — Day 34
    "{first_name}, is there a specific price range you need a home loan for? I'd be happy to pull up some basic rates.",
    # 10 — Day 43
    "I know you might not be ready to do anything now. I just wanted to touch base — is there any info I should be providing that you're not finding online?",
    # 11 — Day 55
    "{first_name}?",
    # 12 — Day 69
    "Is now a better time for us to catch up?",
    # 13 — Day 80
    "Hey! Just checking in with you!",
    # 14 — Day 97
    "Hey {first_name}! I'm just circling back to some missed connections. Are you looking for a First Time Home Buyer program or a refinance?",
    # 15 — Day 110
    "Some folks prefer to meet in person — when can we grab a coffee and go over your options?",
    # 16 — Day 125
    "Hey {first_name}! I just wanted to touch base and see if now was a good time to discuss your home loan?",
    # 17 — Day 140
    "It's been a while since you first reached out and there have been a lot of changes. I'd love to catch you up — when can we grab a couple minutes to talk?",
    # 18 — Day 153
    "It's been a few months. I'd love to find a moment for us to chat and figure out how we can best help you. How does this week look?",
    # 19 — Day 168
    "{first_name}?",
    # 20 — Day 180
    "Hey {first_name}. I definitely don't want to spam you, but I do want to help you find the right home loan. Are you still interested?",
]

# ── Mortgage purchase campaign — initial 9 SMS (Days 1–7) ───────────────────

MORTGAGE_INITIAL = [
    # 0 — Day 1, 1st contact
    (
        "Hi {first_name}, this is {agent_name} on behalf of {company_name}. "
        "We received your inquiry online re: your potential mortgage. "
        "I just have a few questions before I can connect you with the best "
        "team member to assist. I can give you a quick call, or do you prefer to continue by text?"
    ),
    # 1 — Day 1, +15 min
    "Is there a more convenient time to talk?",
    # 2 — Day 1, +45 min
    "Still interested?",
    # 3 — Day 1, +1 hr
    "I just have a few questions before I can get you scheduled with one of our top rated mortgage advisors. Is now a good time for a quick call?",
    # 4 — Day 2
    (
        "Hey {first_name}! One thing our clients appreciate is a review of your monthly rent/mortgage. "
        "With this, your agent will ONLY show homes in your budget. When can we chat?"
    ),
    # 5 — Day 3
    "Let me know if there's a better time to connect. Happy to chat by text or I can give you a quick call if you prefer.",
    # 6 — Day 5
    "Hi {first_name}, it's {agent_name} here with {company_name}. Is now a good time to chat?",
    # 7 — Day 6
    "Would it help if I connected you with a mortgage specialist to discuss your goals?",
    # 8 — Day 7
    (
        "One thing we always say — it's better to start the approval process BEFORE finding the home. "
        "That way, you know your buying power! Can we jump on a call soon?"
    ),
]

MORTGAGE_NURTURE_DAY6 = "Are you working with a real estate agent yet?"

# ── Refi campaign — initial 9 SMS (Days 1–7) ────────────────────────────────

REFI_INITIAL = [
    # 0 — Day 1, 1st contact
    (
        "Hi {first_name}, this is {agent_name} on behalf of {company_name}. "
        "We just received your inquiry online re: your potential ReFi. "
        "I just have a few questions before I can connect you with the best "
        "team member to assist. I can give you a quick call, or do you prefer to continue by text?"
    ),
    # 1 — Day 1, +15 min
    "Is there a more convenient time to talk?",
    # 2 — Day 1, +45 min
    "Still interested?",
    # 3 — Day 1, +1 hr
    "I just have a few questions before I can get you scheduled with one of our top rated loan officers. Is now a good time for a quick call?",
    # 4 — Day 2
    (
        "Hey {first_name}! One thing our clients appreciate is a review of their current mortgage rate. "
        "With this, we can help you get the best rates possible. When can we chat?"
    ),
    # 5 — Day 3
    "Let me know if there's a better time to connect. Happy to chat by text or I can give you a quick call if you prefer.",
    # 6 — Day 5
    "Hi {first_name}, it's {agent_name} here with {company_name}. Is now a good time to chat?",
    # 7 — Day 6
    "Would it help if I connected you directly with a specialist to discuss your refinancing goals?",
    # 8 — Day 7
    (
        "One thing we always say — it's better to start the refinancing process earlier than later. "
        "That way, you know which rates work best for you! Can we jump on a call soon?"
    ),
]

REFI_NURTURE_DAY6 = "Are you working with a lender on your current loan?"


# ── Dispatch ─────────────────────────────────────────────────────────────────

def _is_refi(lead: "Lead") -> bool:
    """True when the lead's interest or industry indicates a refinance."""
    haystack = " ".join(filter(None, [
        lead.interest or "",
        lead.industry or "",
    ])).lower()
    return any(kw in haystack for kw in ("refi", "refinanc", "rate reduction", "lower rate"))


def get_campaign_message(
    lead: "Lead",
    outbound_sms_count: int,
    agent_name: str,
    company_name: str,
) -> Optional[str]:
    """
    Return the next sequenced campaign message for a mortgage/refi lead.

    Selects initial vs nurture campaign and mortgage vs refi track based on
    the lead's interest/industry fields.

    Returns None when the full campaign is exhausted.
    """
    # Only applies to mortgage/refi industry leads
    if not is_mortgage_lead(lead):
        return None

    first_name = lead.name.strip().split()[0] if lead.name and lead.name.strip() else "there"
    refi = _is_refi(lead)

    initial = REFI_INITIAL if refi else MORTGAGE_INITIAL
    nurture_day6 = REFI_NURTURE_DAY6 if refi else MORTGAGE_NURTURE_DAY6

    total_initial = len(initial)
    total_nurture = len(NURTURE_CAMPAIGN)

    if outbound_sms_count < total_initial:
        template = initial[outbound_sms_count]

    elif outbound_sms_count < total_initial + total_nurture:
        nurture_idx = outbound_sms_count - total_initial
        template = NURTURE_CAMPAIGN[nurture_idx]
        # Index 2 is the campaign-specific day-6 nurture message
        if template is None:
            template = nurture_day6

    else:
        return None  # Campaign exhausted

    return template.format(
        first_name=first_name,
        agent_name=agent_name,
        company_name=company_name,
    )


def is_mortgage_lead(lead: "Lead") -> bool:
    """True when the lead belongs to the mortgage/refi vertical."""
    haystack = " ".join(filter(None, [
        lead.interest or "",
        lead.industry or "",
    ])).lower()
    return any(kw in haystack for kw in (
        "mortgage", "refi", "refinanc", "home loan", "real estate",
        "rate reduction", "lower rate", "fha", "va loan",
    ))


# ── AI tone guide injected into the system prompt for mortgage leads ─────────

MORTGAGE_TONE_GUIDE = """
MORTGAGE / REFI MESSAGING STYLE:
- Keep every SMS to 1–2 sentences. End with a question.
- Use their first name on the first message only; sparingly after that.
- Position as a knowledgeable advisor, not a salesperson. Low pressure.
- Key talking points (use naturally — not all at once):
  * Pre-approval before finding a home = knowing your exact buying power
  * Rate changes affect monthly payments — free 15-minute consult offered
  * Refinancing earlier = more time to lock in better rates
  * Options: FHA, VA, First Time Home Buyer, conventional, refi
- If they ask about rates: offer to pull basic rates or schedule a quick specialist call.
- If they mention a timeline or situation: acknowledge it first, then ask one follow-up question.
- Never quote specific rates or guarantee approvals.
- Never send booking links — tell them you'll handle the scheduling.
- Tone: warm, patient, like a knowledgeable friend. Not a call centre script.
"""
