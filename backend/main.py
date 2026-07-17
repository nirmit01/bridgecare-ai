# backend/main.py
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import uvicorn

app = FastAPI(title="BridgeCare AI MVP")

# Allow Next.js frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Change to your Vercel URL later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models for MVP ---
class Gap(BaseModel):
    id: int
    missing_innovation: str
    priority: str
    impact: str
    difficulty: str

class DashboardStats(BaseModel):
    gap_score: int
    readiness_score: int
    gaps_found: int
    top_recommendations: List[dict]

# --- Endpoints ---

@app.post("/upload")
async def upload_sop(file: UploadFile = File(...)):
    # TODO: Pass file to PyMuPDF and Ingestion Agent
    return {
        "status": "success", 
        "department": "ICU", 
        "equipment_extracted": ["Ventilators", "Pulse Oximeters"]
    }

@app.post("/gaps/find/{department_id}")
async def find_gaps(department_id: int):
    # TODO: Trigger Gap Finder Agent (Qdrant similarity search)
    return {"message": "RAG analysis complete. Gaps generated."}

@app.get("/gaps/{department_id}", response_model=List[Gap])
async def list_gaps(department_id: int):
    # Mock data for immediate frontend building
    return [
        {"id": 1, "missing_innovation": "Sepsis Screening Protocol", "priority": "High", "impact": "High", "difficulty": "Low"},
        {"id": 2, "missing_innovation": "AI Workflow Triage", "priority": "Medium", "impact": "High", "difficulty": "High"}
    ]

@app.get("/dashboard/{hospital_id}", response_model=DashboardStats)
async def get_dashboard(hospital_id: int):
    # Mock aggregation
    return {
        "gap_score": 62,
        "readiness_score": 38,
        "gaps_found": 14,
        "top_recommendations": [
            {"id": 1, "text": "Implement standardized Sepsis protocol. Equipment already present."},
            {"id": 2, "text": "Upgrade ICU monitoring software to support continuous telemetry."}
        ]
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)