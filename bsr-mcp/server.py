"""
BSR Quality Checker MCP Server
Exposes BSR submission and organisation data as tools for Claude.
Requires the backend running on http://localhost:3001
"""

import httpx
from fastmcp import FastMCP

mcp = FastMCP("BSR Quality Checker")

BASE_URL = "http://localhost:3001/api"

# Admin credentials — set via env vars or hardcode for local dev
import os
ADMIN_EMAIL = os.getenv("BSR_ADMIN_EMAIL", "george@attlee.ai")
ADMIN_PASSWORD = os.getenv("BSR_ADMIN_PASSWORD", "")

# Shared httpx client with session cookie persistence
_client: httpx.AsyncClient | None = None
_authenticated = False


async def get_client() -> httpx.AsyncClient:
    global _client, _authenticated
    if _client is None:
        _client = httpx.AsyncClient(base_url=BASE_URL, timeout=30.0)
    if not _authenticated and ADMIN_PASSWORD:
        resp = await _client.post("/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
        })
        if resp.status_code == 200:
            _authenticated = True
    return _client


@mcp.tool
async def get_submissions(
    org_name: str = "",
    status: str = "",
    from_date: str = "",
    to_date: str = "",
    limit: int = 20,
) -> dict:
    """
    List BSR compliance submissions with optional filters.

    Args:
        org_name: Filter by organisation name (partial match)
        status:   Filter by status (e.g. 'completed', 'failed', 'processing')
        from_date: ISO date string, e.g. '2025-01-01'
        to_date:   ISO date string, e.g. '2025-12-31'
        limit:     Max results to return (default 20, max 200)
    """
    client = await get_client()
    params: dict = {"limit": str(limit)}
    if org_name:
        params["orgName"] = org_name
    if status:
        params["status"] = status
    if from_date:
        params["from"] = from_date
    if to_date:
        params["to"] = to_date

    resp = await client.get("/admin/submissions", params=params)
    resp.raise_for_status()
    data = resp.json()

    return {
        "total": data.get("total", 0),
        "stats": data.get("stats", {}),
        "submissions": data.get("submissions", []),
    }


@mcp.tool
async def get_submission_stats() -> dict:
    """
    Get high-level stats across all BSR submissions:
    total count, average readiness score, average processing time, AI cost.
    """
    client = await get_client()
    resp = await client.get("/admin/submissions", params={"limit": "1"})
    resp.raise_for_status()
    data = resp.json()
    return data.get("stats", {})


@mcp.tool
async def get_organisations(is_pilot: bool = False) -> list:
    """
    List all organisations that have used the BSR checker.

    Args:
        is_pilot: If True, return only pilot organisations (L&Q, Peabody, Clarion, Notting Hill Genesis)
    """
    client = await get_client()
    resp = await client.get("/admin/organisations")
    resp.raise_for_status()
    orgs = resp.json()
    if is_pilot:
        orgs = [o for o in orgs if o.get("isPilot")]
    return orgs


@mcp.tool
async def get_clients() -> list:
    """
    List all clients (housing associations / consultants) in the system with their pack counts.
    """
    client = await get_client()
    resp = await client.get("/clients")
    resp.raise_for_status()
    return resp.json()


@mcp.tool
async def get_submission_detail(submission_id: str) -> dict:
    """
    Get full detail for a single BSR submission by ID, including
    check results, readiness score, failure categories, and AI cost.

    Args:
        submission_id: The UUID of the submission
    """
    client = await get_client()
    resp = await client.get(f"/admin/submissions/{submission_id}")
    resp.raise_for_status()
    return resp.json()


@mcp.tool
async def get_ai_costs(from_date: str = "", to_date: str = "") -> dict:
    """
    Get total AI API costs (tokens in/out, estimated GBP) across submissions,
    optionally filtered by date range.

    Args:
        from_date: ISO date string, e.g. '2025-01-01'
        to_date:   ISO date string, e.g. '2025-12-31'
    """
    client = await get_client()
    params: dict = {"limit": "200"}
    if from_date:
        params["from"] = from_date
    if to_date:
        params["to"] = to_date

    resp = await client.get("/admin/submissions", params=params)
    resp.raise_for_status()
    data = resp.json()
    submissions = data.get("submissions", [])

    total_cost = sum(s.get("estimatedApiCostGbp") or 0 for s in submissions)
    total_tokens_in = sum(s.get("tokensInput") or 0 for s in submissions)
    total_tokens_out = sum(s.get("tokensOutput") or 0 for s in submissions)
    total_api_calls = sum(s.get("apiCallsMade") or 0 for s in submissions)

    return {
        "submissionsAnalysed": len(submissions),
        "totalEstimatedCostGbp": round(total_cost, 4),
        "totalTokensInput": total_tokens_in,
        "totalTokensOutput": total_tokens_out,
        "totalApiCalls": total_api_calls,
    }


if __name__ == "__main__":
    mcp.run()
