import pytest
import io
import pandas as pd
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Lead, LeadStatus, User
from unittest.mock import patch


class TestLeadImportAPI:
    """Test mass lead import functionality"""

    @pytest.mark.asyncio
    async def test_import_csv_success(
        self, 
        auth_client: AsyncClient, 
        db_session: AsyncSession,
        test_user: User
    ):
        """Test importing leads from a valid CSV file"""
        # Create CSV data
        csv_content = (
            "name,email,phone,company,industry\n"
            "Imported User 1,import1@example.com,1112223333,Co 1,Tech\n"
            "Imported User 2,import2@example.com,4445556666,Co 2,Finance\n"
        )
        files = {
            "file": ("leads.csv", csv_content.encode(), "text/csv")
        }

        response = await auth_client.post("/api/leads/import", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success_count"] == 2
        assert data["error_count"] == 0

        # Verify DB entries
        from sqlalchemy import select
        result = await db_session.execute(select(Lead).where(Lead.source == "import"))
        leads = result.scalars().all()
        assert len(leads) == 2
        assert leads[0].assigned_agent_id == test_user.id

    @pytest.mark.asyncio
    async def test_import_excel_success(
        self, 
        auth_client: AsyncClient, 
        db_session: AsyncSession,
        test_user: User
    ):
        """Test importing leads from a valid Excel file"""
        # Create Excel data using pandas
        df = pd.DataFrame([
            {"name": "Excel User", "email": "excel@example.com", "phone": "9998887777"}
        ])
        excel_file = io.BytesIO()
        df.to_excel(excel_file, index=False)
        excel_file.seek(0)

        files = {
            "file": ("leads.xlsx", excel_file.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        }

        response = await auth_client.post("/api/leads/import", files=files)
        
        assert response.status_code == 200
        assert response.json()["success_count"] == 1

    @pytest.mark.asyncio
    async def test_import_missing_columns(self, auth_client: AsyncClient):
        """Test importing file with missing required columns"""
        csv_content = "name,email\nUser,email@test.com\n"
        files = {
            "file": ("bad.csv", csv_content.encode(), "text/csv")
        }

        response = await auth_client.post("/api/leads/import", files=files)
        
        assert response.status_code == 400
        assert "Missing required columns" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_import_duplicate_emails(
        self, 
        auth_client: AsyncClient, 
        db_session: AsyncSession,
        test_user: User
    ):
        """Test that duplicate emails are handled correctly during import"""
        # Pre-create a lead
        existing_lead = Lead(
            company_id=test_user.company_id,
            name="Existing",
            email="duplicate@example.com",
            phone="0000000000"
        )
        db_session.add(existing_lead)
        await db_session.commit()

        csv_content = (
            "name,email,phone\n"
            "New User,new@example.com,1112223333\n"
            "Dup User,duplicate@example.com,4445556666\n"
        )
        files = {
            "file": ("leads.csv", csv_content.encode(), "text/csv")
        }

        response = await auth_client.post("/api/leads/import", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success_count"] == 1
        assert data["error_count"] == 1
        assert "already exists" in data["errors"][0]
