import pytest
from httpx import AsyncClient
from uuid import uuid4
from sqlalchemy import select
from app.models import Company, User

@pytest.mark.asyncio
class TestPlatformAdmin:
    async def test_list_companies_as_superuser(self, client: AsyncClient, superuser_token_headers):
        response = await client.get("/api/platform/companies", headers=superuser_token_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert "user_count" in data[0]
        assert "lead_count" in data[0]

    async def test_list_companies_forbidden_for_regular_user(self, client: AsyncClient, normal_user_token_headers):
        response = await client.get("/api/platform/companies", headers=normal_user_token_headers)
        assert response.status_code == 403
        assert response.json()["detail"] == "The user does not have enough privileges"

    async def test_get_company_details(self, client: AsyncClient, superuser_token_headers, test_company):
        response = await client.get(f"/api/platform/companies/{test_company.id}", headers=superuser_token_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["company"]["id"] == str(test_company.id)
        assert "users" in data
        assert isinstance(data["users"], list)

    async def test_update_company_as_admin(self, client: AsyncClient, superuser_token_headers, test_company):
        new_name = "Platform Overridden Name"
        response = await client.patch(
            f"/api/platform/companies/{test_company.id}",
            json={"name": new_name, "industry": "Enterprise"},
            headers=superuser_token_headers
        )
        assert response.status_code == 200
        assert response.json()["name"] == new_name
        assert response.json()["industry"] == "Enterprise"

    async def test_delete_company_as_admin(self, client: AsyncClient, superuser_token_headers, db_session):
        # Create a temporary company to delete
        new_co = Company(name="To Be Deleted", industry="Temporary")
        db_session.add(new_co)
        await db_session.commit()
        await db_session.refresh(new_co)
        
        response = await client.delete(
            f"/api/platform/companies/{new_co.id}",
            headers=superuser_token_headers
        )
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        
        # Verify it's gone from DB
        deleted_co = await db_session.get(Company, new_co.id)
        assert deleted_co is None
