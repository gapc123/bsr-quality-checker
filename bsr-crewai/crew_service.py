"""
BSR CrewAI Microservice
HTTP API wrapping the BSR specialist crew.
Runs on port 8001, called by the Node.js backend after assessment.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any
import uvicorn
import logging

from bsr_crew import build_bsr_crew

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="BSR CrewAI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "https://www.attlee.ai"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


class ReviewRequest(BaseModel):
    context: dict[str, Any]
    results: list[dict[str, Any]]


class ReviewResponse(BaseModel):
    domain_reviews: dict[str, str]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/review", response_model=ReviewResponse)
async def review(req: ReviewRequest):
    if not req.results:
        raise HTTPException(status_code=400, detail="No assessment results provided")

    logger.info(
        f"Starting specialist review: {len(req.results)} checks, "
        f"HRB={req.context.get('isHRB')}, London={req.context.get('isLondon')}"
    )

    try:
        domain_reviews = build_bsr_crew(req.context, req.results)
        logger.info("Specialist review complete")
        return ReviewResponse(domain_reviews=domain_reviews)
    except Exception as e:
        logger.error(f"Crew review failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=False)
