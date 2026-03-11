from typing import List, Dict, Optional
from datetime import datetime, timedelta
import asyncio
import uuid
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class GoogleCalendarService:
    """Google Calendar integration service"""
    
    def __init__(self):
        self.client_id = settings.google_client_id
        self.client_secret = settings.google_client_secret
        self.redirect_uri = settings.google_redirect_uri
        self.scopes = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
        ]
    
    def get_auth_url(self, state: Optional[str] = None) -> str:
        """Generate OAuth2 authorization URL"""
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [self.redirect_uri]
                }
            },
            scopes=self.scopes,
            redirect_uri=self.redirect_uri
        )
        
        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=state
        )
        
        return auth_url
    
    async def exchange_code_for_token(self, code: str) -> Dict:
        """Exchange authorization code for access token"""
        try:
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [self.redirect_uri]
                    }
                },
                scopes=self.scopes,
                redirect_uri=self.redirect_uri
            )
            
            flow.fetch_token(code=code)
            credentials = flow.credentials
            
            return {
                "success": True,
                "access_token": credentials.token,
                "refresh_token": credentials.refresh_token,
                "expires_at": credentials.expiry.isoformat() if credentials.expiry else None
            }
        except Exception as e:
            logger.error(f"Token exchange error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _get_calendar_service(self, access_token: str):
        """Get authenticated calendar service"""
        credentials = Credentials(token=access_token)
        return build('calendar', 'v3', credentials=credentials)
    
    async def get_free_busy(
        self,
        access_token: str,
        calendar_id: str = 'primary',
        time_min: Optional[datetime] = None,
        time_max: Optional[datetime] = None
    ) -> List[Dict]:
        """Get free/busy information for a calendar"""
        try:
            if not time_min:
                time_min = datetime.utcnow()
            if not time_max:
                time_max = time_min + timedelta(days=7)
            
            # Run in executor since googleapiclient is synchronous
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                self._get_free_busy_sync,
                access_token,
                calendar_id,
                time_min,
                time_max
            )
            
            return result
        except Exception as e:
            logger.error(f"Free/busy error: {e}")
            return []
    
    def _get_free_busy_sync(
        self,
        access_token: str,
        calendar_id: str,
        time_min: datetime,
        time_max: datetime
    ) -> List[Dict]:
        """Synchronous method to get free/busy info"""
        service = self._get_calendar_service(access_token)
        
        body = {
            "timeMin": time_min.isoformat() + 'Z',
            "timeMax": time_max.isoformat() + 'Z',
            "items": [{"id": calendar_id}]
        }
        
        result = service.freebusy().query(body=body).execute()
        
        busy_times = result.get('calendars', {}).get(calendar_id, {}).get('busy', [])
        return busy_times
    
    async def find_available_slots(
        self,
        access_token: str,
        duration_minutes: int = 30,
        calendar_id: str = 'primary',
        days_ahead: int = 7,
        working_hours: Tuple[int, int] = (9, 17)
    ) -> List[datetime]:
        """Find available time slots"""
        try:
            now = datetime.utcnow()
            end_date = now + timedelta(days=days_ahead)
            
            # Get busy times
            busy_times = await self.get_free_busy(
                access_token, calendar_id, now, end_date
            )
            
            # Convert busy times to datetime objects
            busy_periods = []
            for busy in busy_times:
                start = datetime.fromisoformat(busy['start'].replace('Z', '+00:00'))
                end = datetime.fromisoformat(busy['end'].replace('Z', '+00:00'))
                busy_periods.append((start, end))
            
            # Find available slots
            available_slots = []
            current_time = now.replace(hour=working_hours[0], minute=0, second=0, microsecond=0)
            
            while current_time < end_date:
                # Skip weekends
                if current_time.weekday() >= 5:
                    current_time += timedelta(days=1)
                    current_time = current_time.replace(hour=working_hours[0], minute=0)
                    continue
                
                # Skip non-working hours
                if current_time.hour < working_hours[0] or current_time.hour >= working_hours[1]:
                    if current_time.hour >= working_hours[1]:
                        current_time += timedelta(days=1)
                        current_time = current_time.replace(hour=working_hours[0], minute=0)
                    else:
                        current_time = current_time.replace(hour=working_hours[0], minute=0)
                    continue
                
                # Check if slot is available
                slot_end = current_time + timedelta(minutes=duration_minutes)
                is_available = True
                
                for busy_start, busy_end in busy_periods:
                    if not (slot_end <= busy_start or current_time >= busy_end):
                        is_available = False
                        break
                
                if is_available and current_time > now:
                    available_slots.append(current_time)
                    if len(available_slots) >= 5:  # Return max 5 slots
                        break
                
                current_time += timedelta(minutes=30)  # Check every 30 minutes
            
            return available_slots
            
        except Exception as e:
            logger.error(f"Find slots error: {e}")
            return []
    
    async def create_event(
        self,
        access_token: str,
        summary: str,
        description: str,
        start_time: datetime,
        end_time: datetime,
        attendees: List[str],
        location: Optional[str] = None,
        calendar_id: str = 'primary'
    ) -> Dict:
        """Create a calendar event"""
        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                self._create_event_sync,
                access_token,
                summary,
                description,
                start_time,
                end_time,
                attendees,
                location,
                calendar_id
            )
            
            return result
        except Exception as e:
            logger.error(f"Create event error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _create_event_sync(
        self,
        access_token: str,
        summary: str,
        description: str,
        start_time: datetime,
        end_time: datetime,
        attendees: List[str],
        location: Optional[str],
        calendar_id: str
    ) -> Dict:
        """Synchronous method to create event"""
        service = self._get_calendar_service(access_token)
        
        event = {
            'summary': summary,
            'description': description,
            'start': {
                'dateTime': start_time.isoformat() + 'Z',
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': end_time.isoformat() + 'Z',
                'timeZone': 'UTC',
            },
            'attendees': [{'email': email} for email in attendees],
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 60},
                    {'method': 'popup', 'minutes': 15},
                ],
            },
        }
        
        if location:
            event['location'] = location
            
        # Add Google Meet link
        event['conferenceData'] = {
            'createRequest': {
                'requestId': str(uuid.uuid4()),
                'conferenceSolutionKey': {'type': 'hangoutsMeet'}
            }
        }
        
        result = service.events().insert(
            calendarId=calendar_id,
            body=event,
            conferenceDataVersion=1
        ).execute()
        
        return {
            "success": True,
            "event_id": result.get('id'),
            "event_link": result.get('htmlLink'),
            "meet_link": result.get('hangoutLink')
        }