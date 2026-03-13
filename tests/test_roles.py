import pytest
from httpx import AsyncClient
from app.models import UserRole, Lead

@pytest.mark.asyncio
class TestRolePermissions:
    async def test_admin_can_update_company(self, client: AsyncClient, admin_token_headers):
        response = await client.patch(
            "/api/auth/company",
            json={"name": "New Company Name"},
            headers=admin_token_headers
        )
        assert response.status_code == 200

    async def test_write_user_cannot_update_company(self, client: AsyncClient, write_token_headers):
        response = await client.patch(
            "/api/auth/company",
            json={"name": "Forbidden Name"},
            headers=write_token_headers
        )
        assert response.status_code == 403
        assert "Requires Admin role" in response.json()["detail"]

    async def test_read_user_cannot_update_company(self, client: AsyncClient, read_token_headers):
        response = await client.patch(
            "/api/auth/company",
            json={"name": "Forbidden Name"},
            headers=read_token_headers
        )
        assert response.status_code == 403

    async def test_write_user_can_create_lead(self, client: AsyncClient, write_token_headers, sample_lead_data):
        response = await client.post(
            "/api/leads/",
            json=sample_lead_data,
            headers=write_token_headers
        )
        assert response.status_code == 200

    async def test_read_user_cannot_create_lead(self, client: AsyncClient, read_token_headers, sample_lead_data):
        response = await client.post(
            "/api/leads/",
            json=sample_lead_data,
            headers=read_token_headers
        )
        assert response.status_code == 403
        assert "Requires Write access" in response.json()["detail"]

    async def test_read_user_can_list_leads(self, client: AsyncClient, read_token_headers):
        response = await client.get("/api/leads/", headers=read_token_headers)
        assert response.status_code == 200

    async def test_admin_can_change_user_role(self, client: AsyncClient, admin_token_headers):
        # Admin can update their own role (or others)
        response = await client.patch(
            "/api/auth/me",
            json={"role": UserRole.WRITE},
            headers=admin_token_headers
        )
        assert response.status_code == 200
        assert response.json()["role"] == UserRole.WRITE

    async def test_write_user_cannot_change_role(self, client: AsyncClient, write_token_headers):
        response = await client.patch(
            "/api/auth/me",
            json={"role": UserRole.ADMIN},
            headers=write_token_headers
        )
        assert response.status_code == 403
        assert "Only admins can change roles" in response.json()["detail"]
