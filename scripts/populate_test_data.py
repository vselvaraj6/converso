#!/usr/bin/env python3
"""
Populate test data for Converso application.

This script adds sample companies and leads to test the SMS workflow.
Run this after starting the application.
"""

import asyncio
import httpx
import sys
from datetime import datetime

# Test data
TEST_COMPANY = {
    "name": "Test Company",
    "industry": "Technology",
    "ai_config": {
        "temperature": 0.7,
        "tone": "friendly and professional",
        "prompt_template": "You are a helpful sales assistant for {company}. Be {tone} and guide leads toward booking a demo."
    }
}

TEST_LEADS = [
    {
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+14165551234",  # Replace with your test phone
        "title": "CEO",
        "company": "Doe Industries",
        "industry": "Manufacturing",
        "source": "website",
        "interest": "Automation solutions"
    },
    {
        "name": "Jane Smith",
        "email": "jane.smith@example.com",
        "phone": "+14165555678",  # Replace with another test phone
        "title": "Marketing Director",
        "company": "Smith Corp",
        "industry": "Retail",
        "source": "referral",
        "interest": "Lead generation"
    },
    {
        "name": "Bob Johnson",
        "email": "bob.johnson@example.com",
        "phone": "+14165559999",
        "title": "CTO",
        "company": "Tech Innovations",
        "industry": "Technology",
        "source": "linkedin",
        "interest": "AI integration"
    }
]


async def main():
    """Populate test data."""
    base_url = "http://localhost:8000"
    
    # Check if API is running
    try:
        async with httpx.AsyncClient() as client:
            health = await client.get(f"{base_url}/api/health")
            if health.status_code != 200:
                print("❌ API is not running. Start the application first.")
                return
    except Exception as e:
        print(f"❌ Cannot connect to API: {e}")
        print("Make sure the application is running with 'make dev'")
        return
    
    print("✅ API is running")
    
    # Create leads
    async with httpx.AsyncClient() as client:
        created_count = 0
        
        for lead_data in TEST_LEADS:
            try:
                response = await client.post(
                    f"{base_url}/api/leads",
                    json=lead_data
                )
                if response.status_code == 200:
                    lead = response.json()
                    print(f"✅ Created lead: {lead_data['name']} ({lead_data['phone']})")
                    created_count += 1
                elif response.status_code == 400 and "already exists" in response.text:
                    print(f"⚠️  Lead already exists: {lead_data['email']}")
                else:
                    print(f"❌ Failed to create lead {lead_data['name']}: {response.text}")
            except Exception as e:
                print(f"❌ Error creating lead {lead_data['name']}: {e}")
        
        print(f"\n📊 Summary: Created {created_count} new leads")
        
        # List all leads
        response = await client.get(f"{base_url}/api/leads")
        if response.status_code == 200:
            data = response.json()
            print(f"📋 Total leads in system: {data['total']}")
            print("\n🎯 Test SMS workflow:")
            print("1. Send an SMS to your Twilio phone number from any of these phones:")
            for lead in TEST_LEADS:
                print(f"   - {lead['phone']} ({lead['name']})")
            print("2. You should receive an AI-generated reply!")
            print("\n💡 Tip: Check the logs to see the processing:")
            print("   docker-compose logs -f app")


if __name__ == "__main__":
    asyncio.run(main())