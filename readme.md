# BridgeCare AI 🏥🤖

**The AI Implementation Officer for Hospitals**

## 🚨 Problem & Solution
Hospitals sit on a goldmine of unimplemented medical evidence because research, WHO guidelines, and daily hospital SOPs are completely disconnected. Hospital leaders constantly struggle to identify which innovations they should adopt next. 

**BridgeCare AI** solves this. It ingests a hospital's own SOPs, compares them against the latest medical guidelines using a RAG pipeline, and outputs prioritized, actionable recommendations complete with a 4-week rollout plan. We bridge the translation gap between evidence and practice.

## ✨ Features
- **Hospital Profile Upload:** Automatically extracts department details, protocols, and equipment from PDF SOPs.
- **Translation Gap Finder:** Identifies missing innovations by comparing hospital data against guidelines.
- **Recommendation Engine:** Generates plain-language, actionable implementation advice based on a custom Readiness Score.
- **Rollout Planner:** Instantly generates a 4-week deployment timeline (Training -> Pilot -> Eval -> Deploy).
- **Executive Dashboard:** Visualizes Gap Scores, Readiness Scores, and top priorities at a glance.

## 🛠️ Tech Stack
- **Frontend:** Next.js, TailwindCSS, shadcn/ui, Recharts
- **Backend:** Python, FastAPI
- **Database & AI:** PostgreSQL, Qdrant (Vector DB), PyMuPDF (Document Parsing)
- **Embeddings & LLM:** BAAI/bge-small, Gemini / GPT-4.1

## 🚀 Setup & Run Locally

### Prerequisites
- Node.js (v18+)
- Python (3.11+)

### 1. Start the Backend
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload


### 2. Start the Frontend
cd frontend
npm install
npm run dev
Dashboard will run at http://localhost:3000

🤝 Hackathon Partner Integrations
This MVP actively integrates the following partner technologies:

Gnani AI: Voice-activated hospital queries hook.

Mem0: Storage of hospital profiles and recommendation history.

Slashy: Multi-agent workflow visualization.

Keploy: API endpoint testing configuration.