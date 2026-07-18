# BridgeCare AI - Complete Project Specification

## 1. PROJECT OVERVIEW

**BridgeCare AI** is an AI-powered hospital implementation officer platform that helps hospital leaders identify gaps between their current Standard Operating Procedures (SOPs) and latest medical guidelines, then provides actionable recommendations with rollout plans.

### Problem Statement
Hospitals sit on a goldmine of unimplemented medical evidence. Hospital leaders struggle to:
- Identify which innovations from medical research apply to their hospital
- Prioritize which to implement first
- Plan realistic implementation timelines
- Track implementation progress

### Solution
BridgeCare AI solves this by:
1. Ingesting hospital SOPs (PDFs)
2. Extracting structured data (departments, protocols, equipment)
3. Comparing against latest medical guidelines using RAG (Retrieval-Augmented Generation)
4. Generating prioritized, actionable recommendations
5. Creating 4-week deployment timelines with success metrics

### Target Users
- Hospital CEOs & Chief Medical Officers
- Quality & Innovation Directors
- Department Heads (ICU, Emergency, Surgery, etc.)

---

## 2. TECH STACK

### Frontend
- **Framework:** Next.js 16.2.10 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui components
- **UI Components:** lucide-react icons, recharts for dashboards
- **Theme:** Anime-hospital themed with soft pastels and character illustrations
- **Build:** ESLint for code quality

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Server:** Uvicorn
- **Database:** PostgreSQL (primary data store)
- **Vector Database:** Qdrant (for semantic search/RAG)
- **Document Processing:** PyMuPDF (fitz) for PDF parsing
- **LLM Integration:** Google Gemini API & OpenAI GPT-4
- **Embeddings:** BAAI/bge-small-en via Hugging Face
- **Authentication:** JWT (PyJWT)
- **API Communication:** Pydantic for validation

### External Integrations (Optional for MVP+)
- Gnani AI: Voice query interface
- Mem0: Hospital profile/recommendation history storage
- Slashy: Multi-agent workflow visualization
- Keploy: API testing

---

## 3. DATABASE SCHEMA

### Core Tables

#### `hospitals`
```
- id: UUID (primary key)
- name: String
- location: String
- beds: Integer
- founded_year: Integer
- created_at: Timestamp
- updated_at: Timestamp
```

#### `departments`
```
- id: UUID
- hospital_id: UUID (FK)
- name: String (e.g., "ICU", "Emergency", "Surgery")
- head_name: String
- equipment_list: JSON (e.g., ["Ventilators", "Monitors"])
- current_protocols: JSON
- created_at: Timestamp
```

#### `sop_documents`
```
- id: UUID
- hospital_id: UUID (FK)
- department_id: UUID (FK)
- filename: String
- file_path: String (S3 or local)
- extracted_text: Text
- processed_chunks: JSON (for RAG)
- uploaded_at: Timestamp
- status: Enum ("uploaded", "processing", "processed", "error")
```

#### `medical_guidelines`
```
- id: UUID
- title: String
- source: String (WHO, CDC, etc.)
- category: String (e.g., "Sepsis Management", "ICU Protocols")
- content: Text
- embeddings: Vector (for Qdrant)
- published_date: Timestamp
```

#### `gaps`
```
- id: UUID
- hospital_id: UUID (FK)
- department_id: UUID (FK)
- missing_innovation: String
- description: Text
- guideline_id: UUID (FK)
- gap_score: Float (0-100, based on importance & urgency)
- priority: Enum ("High", "Medium", "Low")
- impact: Enum ("High", "Medium", "Low")
- difficulty: Enum ("High", "Medium", "Low")
- readiness_score: Float (0-100, hospital readiness to implement)
- identified_at: Timestamp
- status: Enum ("identified", "planned", "in_progress", "completed")
```

#### `recommendations`
```
- id: UUID
- gap_id: UUID (FK)
- hospital_id: UUID (FK)
- generated_text: Text (AI-generated implementation advice)
- resource_requirements: JSON (equipment, staff, budget)
- training_needs: JSON
- estimated_timeline_weeks: Integer
- created_at: Timestamp
```

#### `rollout_plans`
```
- id: UUID
- recommendation_id: UUID (FK)
- hospital_id: UUID (FK)
- week_1_description: Text
- week_2_description: Text
- week_3_description: Text
- week_4_description: Text
- success_metrics: JSON
- owner: String (assigned to whom)
- start_date: Date
- created_at: Timestamp
```

#### `users`
```
- id: UUID
- email: String (unique)
- hashed_password: String
- hospital_id: UUID (FK)
- role: Enum ("admin", "doctor", "manager", "viewer")
- first_name: String
- last_name: String
- created_at: Timestamp
```

---

## 4. BACKEND API ENDPOINTS

### Authentication Endpoints

#### `POST /auth/register`
**Description:** Register a new hospital admin user
**Request:**
```json
{
  "email": "admin@hospital.com",
  "password": "secure_password",
  "hospital_name": "City Hospital",
  "first_name": "John",
  "last_name": "Doe",
  "location": "New York, NY"
}
```
**Response:** `{ "user_id": "uuid", "token": "jwt_token" }`
**Status:** 201 Created / 400 Bad Request

#### `POST /auth/login`
**Description:** Login user
**Request:**
```json
{
  "email": "admin@hospital.com",
  "password": "secure_password"
}
```
**Response:** `{ "token": "jwt_token", "user": {...} }`
**Status:** 200 OK / 401 Unauthorized

#### `POST /auth/refresh`
**Description:** Refresh JWT token
**Response:** `{ "token": "new_jwt_token" }`

---

### Hospital Management Endpoints

#### `POST /hospitals`
**Description:** Create hospital profile
**Auth:** Required (JWT)
**Request:**
```json
{
  "name": "City Hospital",
  "location": "New York, NY",
  "beds": 500,
  "founded_year": 1990
}
```
**Response:** `{ "id": "uuid", "name": "City Hospital", ... }`

#### `GET /hospitals/{hospital_id}`
**Description:** Get hospital details
**Auth:** Required
**Response:** Hospital object with aggregated stats

---

### Department Management Endpoints

#### `POST /hospitals/{hospital_id}/departments`
**Description:** Create/register a department
**Auth:** Required
**Request:**
```json
{
  "name": "ICU",
  "head_name": "Dr. Smith",
  "equipment_list": ["Ventilators", "Monitors", "IV Pumps"]
}
```
**Response:** `{ "id": "uuid", "name": "ICU", ... }`

#### `GET /hospitals/{hospital_id}/departments`
**Description:** List all departments in hospital
**Response:** `[{ "id": "uuid", "name": "ICU", ... }]`

---

### Document Upload & Processing Endpoints

#### `POST /hospitals/{hospital_id}/documents/upload`
**Description:** Upload SOP PDF
**Auth:** Required (multipart form)
**Request:** `Content-Type: multipart/form-data` with file
**Processing Steps:**
1. Save file to storage (S3 or local)
2. Extract text using PyMuPDF
3. Chunk text (512-token chunks with 50-token overlap)
4. Generate embeddings using BAAI/bge-small
5. Store chunks in Qdrant vector DB
6. Store metadata in PostgreSQL

**Response:**
```json
{
  "document_id": "uuid",
  "status": "processing",
  "department": "ICU",
  "chunks_extracted": 45,
  "equipment_detected": ["Ventilators", "Monitors"]
}
```

#### `GET /hospitals/{hospital_id}/documents/{document_id}/status`
**Description:** Check document processing status
**Response:**
```json
{
  "id": "uuid",
  "status": "processed",
  "chunks_count": 45,
  "processing_time_seconds": 23
}
```

---

### Gap Analysis Endpoints

#### `POST /hospitals/{hospital_id}/analysis/run-gap-finder`
**Description:** Trigger gap analysis for hospital
**Auth:** Required
**Request:**
```json
{
  "department_id": "uuid",
  "use_custom_guidelines": false
}
```
**Processing:**
1. Retrieve all processed SOP chunks for department from Qdrant
2. Load medical guidelines into Qdrant
3. For each guideline: semantic search against SOP chunks
4. Calculate gap score (guideline relevance - SOP coverage)
5. Calculate readiness score (equipment present, staff capacity, budget)
6. Generate gaps, store in PostgreSQL
7. Trigger AI recommendation generation

**Response:**
```json
{
  "analysis_id": "uuid",
  "status": "completed",
  "gaps_found": 14,
  "gaps": [
    {
      "id": "uuid",
      "missing_innovation": "Sepsis Screening Protocol",
      "gap_score": 85,
      "priority": "High",
      "impact": "High",
      "difficulty": "Low",
      "readiness_score": 72
    }
  ],
  "timestamp": "2026-07-18T10:30:00Z"
}
```

#### `GET /hospitals/{hospital_id}/gaps`
**Description:** List all gaps for hospital
**Query Params:** `?department_id=uuid&priority=High&status=identified`
**Response:** Array of gap objects

#### `GET /hospitals/{hospital_id}/gaps/{gap_id}`
**Description:** Get gap details with recommendations
**Response:** Gap object + associated recommendations

---

### Recommendation Endpoints

#### `POST /gaps/{gap_id}/recommendations/generate`
**Description:** AI-generate recommendations for a gap
**Auth:** Required
**Processing:**
1. Get gap details
2. Fetch relevant medical guidelines (semantic search in Qdrant)
3. Fetch hospital context (equipment, staff, budget from departments)
4. Call Gemini API with prompt:
   - Gap description
   - Guidelines context
   - Hospital constraints
5. Parse response into structured format
6. Store in recommendations table

**Request:** `{}`
**Response:**
```json
{
  "recommendation_id": "uuid",
  "gap_id": "uuid",
  "generated_text": "Implement Sepsis Bundle protocol: (1) Blood culture before antibiotics, (2) Broad-spectrum antibiotics within 1 hour, ...",
  "resource_requirements": {
    "equipment": ["Sepsis lab kit", "IV access kits"],
    "staff_training_hours": 16,
    "estimated_budget_usd": 25000
  },
  "training_needs": ["Clinical staff", "Lab technicians"],
  "estimated_timeline_weeks": 4
}
```

#### `GET /hospitals/{hospital_id}/recommendations`
**Description:** List all recommendations for hospital
**Query Params:** `?gap_id=uuid&status=pending`
**Response:** Array of recommendation objects

---

### Rollout Plan Endpoints

#### `POST /recommendations/{recommendation_id}/rollout-plan/generate`
**Description:** AI-generate 4-week rollout plan
**Auth:** Required
**Processing:**
1. Get recommendation details
2. Get gap & hospital context
3. Call Gemini API with prompt:
   - "Create a 4-week hospital deployment plan for [recommendation]. Week 1: Training. Week 2: Pilot. Week 3: Eval. Week 4: Deploy. Include daily tasks, success metrics, risk mitigation."
4. Parse response into structured format
5. Store each week's plan in database

**Request:**
```json
{
  "owner_email": "dept_head@hospital.com",
  "start_date": "2026-08-01"
}
```

**Response:**
```json
{
  "rollout_plan_id": "uuid",
  "week_1": {
    "title": "Training & Protocol Review",
    "daily_tasks": [
      "Day 1: Stakeholder kickoff meeting",
      "Days 2-3: Clinical staff training (8 hours)",
      "Days 4-5: Lab setup & equipment testing",
      "Day 6-7: Protocol documentation review"
    ],
    "success_metrics": ["100% staff trained", "All equipment tested"],
    "risk_mitigation": "Have backup protocols ready"
  },
  "week_2": { ... },
  "week_3": { ... },
  "week_4": { ... },
  "success_metrics_overall": ["Adoption rate > 80%", "Zero protocol violations", "Patient safety maintained"],
  "owner": "Dr. Smith",
  "start_date": "2026-08-01",
  "estimated_completion": "2026-08-28"
}
```

---

### Dashboard Endpoints

#### `GET /hospitals/{hospital_id}/dashboard`
**Description:** Get aggregated dashboard stats
**Auth:** Required
**Response:**
```json
{
  "hospital_name": "City Hospital",
  "total_gaps": 14,
  "gaps_by_priority": {
    "High": 5,
    "Medium": 6,
    "Low": 3
  },
  "gap_score": 62,
  "readiness_score": 38,
  "departments": [
    {
      "name": "ICU",
      "gap_score": 71,
      "readiness_score": 45,
      "gaps": 8
    },
    {
      "name": "Emergency",
      "gap_score": 52,
      "readiness_score": 31,
      "gaps": 6
    }
  ],
  "top_recommendations": [
    {
      "id": "uuid",
      "gap_title": "Sepsis Screening Protocol",
      "action": "Implement standardized Sepsis Bundle",
      "priority": "High",
      "estimated_timeline_weeks": 4
    }
  ],
  "rollout_plans_in_progress": 2,
  "last_analysis_run": "2026-07-17T14:30:00Z"
}
```

---

## 5. FRONTEND PAGES & COMPONENTS

### Layout & Navigation
- **Navigation Bar:** BridgeCare logo + user dropdown + notifications
- **Sidebar:** Hospital name, departments, quick links (Dashboard, Upload, Gaps, Rollouts)
- **Anime Theme:** Soft pastel colors (pinks, blues, lavenders), rounded corners, cute mascot character in corner

### Authentication Flow

#### Page: `/auth/register`
- Hospital registration form
- Fields: Hospital name, location, beds, CEO email, password
- Anime mascot (cute nurse character) guides user
- Submission → creates hospital + user account → redirects to `/auth/login`

#### Page: `/auth/login`
- Email & password form
- "Forgot password?" link
- Cute loading animation with mascot
- Submission → JWT token stored in localStorage → redirects to dashboard

---

### Core Pages

#### Page: `/dashboard`
**Component Structure:**
```
<Layout>
  <Header title="BridgeCare AI Dashboard" subtitle="Hospital Name">
    <Button onClick={openUploadModal}>📄 Upload SOP</Button>
    <Button onClick={runAnalysis}>🔍 Run Analysis</Button>
  </Header>
  
  <StatsGrid>
    <StatCard 
      title="Translation Gap Score" 
      value={62} 
      total={100}
      status="warning"
      icon={AlertTriangle}
    />
    <StatCard 
      title="Readiness Score" 
      value={38}
      total={100}
      status="info"
      icon={Target}
    />
    <StatCard 
      title="Gaps Identified" 
      value={14}
      status="danger"
      icon={Zap}
    />
    <StatCard 
      title="Rollouts In Progress" 
      value={2}
      status="success"
      icon={CheckCircle}
    />
  </StatsGrid>
  
  <DepartmentBreakdown>
    {departments.map(dept => (
      <DeptCard 
        name={dept.name}
        gapScore={dept.gap_score}
        readinessScore={dept.readiness_score}
        gapCount={dept.gaps}
        onClick={() => navigate(`/departments/${dept.id}`)}
      />
    ))}
  </DepartmentBreakdown>
  
  <TopRecommendations>
    {topRecs.map(rec => (
      <RecCard 
        title={rec.gap_title}
        priority={rec.priority}
        action={rec.action}
        timeline={rec.estimated_timeline_weeks}
        onClick={() => navigate(`/recommendations/${rec.id}`)}
      />
    ))}
  </TopRecommendations>
  
  <CharacterCorner />  <!-- Anime mascot reacting to progress -->
</Layout>
```

**Key Features:**
- Real-time stats from `/hospitals/{id}/dashboard` endpoint
- Color-coded priority indicators (red/orange/yellow)
- Hover animations for cards
- Anime character mascot with changing expressions based on scores

---

#### Page: `/hospitals/{id}/setup` (Hospital Profile Setup)
**Component Structure:**
```
<Form>
  <FormSection title="Hospital Information">
    <Input label="Hospital Name" placeholder="City Hospital" />
    <Input label="Location" placeholder="New York, NY" />
    <Input label="Number of Beds" type="number" />
    <Input label="Founded Year" type="number" />
  </FormSection>
  
  <FormSection title="Add Departments">
    <DepartmentList>
      {departments.map(dept => (
        <DeptInput 
          key={dept.id}
          name={dept.name}
          headName={dept.head_name}
          equipment={dept.equipment_list}
          onEdit={() => editDept(dept.id)}
          onDelete={() => deleteDept(dept.id)}
        />
      ))}
    </DepartmentList>
    <Button onClick={addDepartment}>+ Add Department</Button>
  </FormSection>
  
  <Button type="submit">Save Hospital Profile</Button>
</Form>
```

**Key Features:**
- Multi-step form
- Add/edit/delete departments dynamically
- Equipment selection with autocomplete suggestions
- Validation before submission

---

#### Page: `/documents`
**Component Structure:**
```
<Layout>
  <Header title="SOP Management" />
  
  <UploadSection>
    <DragDropZone 
      onDrop={handleFileUpload}
      acceptedFormats=".pdf"
    />
    <Or />
    <Button onClick={openFileBrowser}>Browse Files</Button>
  </UploadSection>
  
  <DocumentList>
    {documents.map(doc => (
      <DocumentCard
        filename={doc.filename}
        department={doc.department}
        uploadedAt={doc.uploaded_at}
        status={doc.status}
        progress={doc.processing_progress}
        chunks={doc.chunks_count}
        onView={() => viewDocument(doc.id)}
        onDelete={() => deleteDocument(doc.id)}
      />
    ))}
  </DocumentList>
  
  <CharacterCorner />
</Layout>
```

**Key Features:**
- Drag-and-drop file upload
- Real-time processing status (uploading → processing → processed)
- Show chunk count and embeddings status
- Delete uploaded documents

---

#### Page: `/departments/{id}`
**Component Structure:**
```
<Layout>
  <Header title={department.name}>
    <Button onClick={runAnalysisForDept}>Run Gap Analysis</Button>
  </Header>
  
  <DeptInfo>
    <InfoCard label="Department Head" value={department.head_name} />
    <InfoCard label="Equipment" value={department.equipment_list.join(", ")} />
  </DeptInfo>
  
  <GapsList>
    {gaps.map(gap => (
      <GapCard
        title={gap.missing_innovation}
        description={gap.description}
        priority={gap.priority}
        impact={gap.impact}
        difficulty={gap.difficulty}
        gapScore={gap.gap_score}
        readinessScore={gap.readiness_score}
        onClick={() => navigate(`/gaps/${gap.id}`)}
      />
    ))}
  </GapsList>
</Layout>
```

---

#### Page: `/gaps/{id}`
**Component Structure:**
```
<Layout>
  <Header title={gap.missing_innovation} />
  
  <GapDetails>
    <DetailSection>
      <Label>Gap Description</Label>
      <Text>{gap.description}</Text>
      
      <MetricsGrid>
        <Metric label="Priority" value={gap.priority} />
        <Metric label="Impact" value={gap.impact} />
        <Metric label="Difficulty" value={gap.difficulty} />
        <Metric label="Gap Score" value={gap.gap_score} />
        <Metric label="Readiness Score" value={gap.readiness_score} />
        <Metric label="Status" value={gap.status} />
      </MetricsGrid>
      
      <RelatedGuideline>
        <Label>Medical Guideline</Label>
        <Text>{gap.guideline.title}</Text>
        <Text>{gap.guideline.content}</Text>
      </RelatedGuideline>
    </DetailSection>
  </GapDetails>
  
  <RecommendationsSection>
    <Button onClick={generateRecommendation}>
      ✨ Generate AI Recommendation
    </Button>
    
    {recommendations.map(rec => (
      <RecommendationCard
        text={rec.generated_text}
        resources={rec.resource_requirements}
        training={rec.training_needs}
        timeline={rec.estimated_timeline_weeks}
        onClick={() => navigate(`/recommendations/${rec.id}`)}
      />
    ))}
  </RecommendationsSection>
  
  <CharacterCorner />
</Layout>
```

**Key Features:**
- Display full gap details with metrics
- Related guideline reference
- Generate recommendations with loading animation
- Show existing recommendations

---

#### Page: `/recommendations/{id}`
**Component Structure:**
```
<Layout>
  <Header title="Recommendation Details" />
  
  <RecommendationContent>
    <Card>
      <CardTitle>{gap_title}</CardTitle>
      <CardContent>
        <Text>{recommendation.generated_text}</Text>
      </CardContent>
    </Card>
    
    <ResourcesCard>
      <CardTitle>Resource Requirements</CardTitle>
      <List>
        {recommendation.resource_requirements.equipment.map(eq => (
          <ListItem>{eq}</ListItem>
        ))}
      </List>
      <EstimatedBudget>
        ${recommendation.resource_requirements.estimated_budget_usd}
      </EstimatedBudget>
    </ResourcesCard>
    
    <TrainingCard>
      <CardTitle>Training Needs</CardTitle>
      <List>
        {recommendation.training_needs.map(need => (
          <ListItem>{need}</ListItem>
        ))}
      </List>
      <TrainingHours>
        {recommendation.resource_requirements.staff_training_hours} hours
      </TrainingHours>
    </TrainingCard>
    
    <TimelineCard>
      <CardTitle>Implementation Timeline</CardTitle>
      <Timeline>{recommendation.estimated_timeline_weeks} weeks</Timeline>
    </TimelineCard>
    
    <Button 
      onClick={generateRolloutPlan}
      size="lg"
    >
      🚀 Generate 4-Week Rollout Plan
    </Button>
  </RecommendationContent>
  
  <CharacterCorner />
</Layout>
```

---

#### Page: `/rollout-plans/{id}`
**Component Structure:**
```
<Layout>
  <Header title="4-Week Rollout Plan" />
  
  <PlanOverview>
    <InfoBar>
      <Info label="Owner" value={plan.owner} />
      <Info label="Start Date" value={plan.start_date} />
      <Info label="Completion Date" value={plan.estimated_completion} />
    </InfoBar>
  </PlanOverview>
  
  <WeeklyTimeline>
    {[week_1, week_2, week_3, week_4].map((week, idx) => (
      <WeekCard key={idx} weekNumber={idx + 1}>
        <WeekTitle>{week.title}</WeekTitle>
        
        <DailyTasks>
          {week.daily_tasks.map(task => (
            <TaskItem>{task}</TaskItem>
          ))}
        </DailyTasks>
        
        <SuccessMetrics>
          <Label>Success Metrics</Label>
          {week.success_metrics.map(metric => (
            <Metric>{metric}</Metric>
          ))}
        </SuccessMetrics>
        
        <RiskMitigation>
          <Label>Risk Mitigation</Label>
          <Text>{week.risk_mitigation}</Text>
        </RiskMitigation>
      </WeekCard>
    ))}
  </WeeklyTimeline>
  
  <OverallMetrics>
    <CardTitle>Overall Success Metrics</CardTitle>
    {plan.success_metrics_overall.map(metric => (
      <MetricCheckbox>{metric}</MetricCheckbox>
    ))}
  </OverallMetrics>
  
  <Actions>
    <Button variant="outline">📧 Share with Team</Button>
    <Button variant="outline">📥 Download PDF</Button>
    <Button onClick={markAsStarted}>▶️ Mark as Started</Button>
  </Actions>
  
  <CharacterCorner />
</Layout>
```

**Key Features:**
- Visual timeline with 4 weeks
- Daily tasks breakdown per week
- Success metrics and risk mitigation
- Share & PDF export buttons
- Progress tracking

---

### Reusable Components

#### `<StatCard />`
Props: `title`, `value`, `total`, `status` ("success"/"warning"/"info"/"danger"), `icon`
- Anime-themed card with icon
- Progress bar or percentage
- Color-coded based on status

#### `<GapCard />`
Props: `title`, `priority`, `impact`, `difficulty`, `scores`, `onClick`
- Horizontal card layout
- Priority badge (color-coded)
- Impact/difficulty indicators
- Score visualization

#### `<RecommendationCard />`
Props: `text`, `resources`, `training`, `timeline`, `onClick`
- Large card with recommendation text
- Resource quick view
- Timeline indicator

#### `<WeekCard />`
Props: `weekNumber`, `title`, `tasks`, `metrics`
- Week breakdown card
- Task checklist
- Metrics display

#### `<CharacterCorner />`
- Anime mascot (cute nurse character)
- Placed in bottom-right corner
- Expressions change based on metrics:
  - Happy/energetic when scores are high
  - Concerned/encouraging when scores are low
  - Celebrating on completion milestones
- Occasional tooltips: "Gap score is improving! 📈"

---

## 6. ANIME THEME DESIGN GUIDELINES

### Color Palette
- **Primary Blue:** `#6B8DD9` (soft, calming)
- **Accent Pink:** `#F5B5E8` (medical warmth)
- **Danger Red:** `#FF6B6B` (for high gaps)
- **Success Green:** `#51CF66` (for progress)
- **Warning Yellow:** `#FFD93D` (for medium priority)
- **Neutral Lavender:** `#E8D5F2` (backgrounds)
- **Pure White:** `#FFFFFF` (cards, text areas)
- **Dark Charcoal:** `#2C2C2C` (text)

### Typography
- **Headings:** Rounded, friendly font (e.g., "Poppins" or similar)
- **Body:** Clean, readable sans-serif (Geist Sans)
- **Accent:** Slightly larger, softer letter spacing

### Visual Elements
- **Rounded Corners:** Use 12-16px border radius throughout
- **Shadows:** Soft, diffuse shadows (not harsh)
- **Icons:** Cute, hand-drawn style (use lucide-react with customization)
- **Animations:**
  - Fade-in on load
  - Slide-up transitions for cards
  - Smooth color transitions on hover
  - Pulse animation for loading states
  - Bounce animation for important buttons

### Mascot Character
- **Design:** Cute anime nurse character with:
  - Large, expressive eyes
  - Friendly smile
  - Medical cap/uniform
  - Soft color palette (pastels)
- **Interactions:**
  - Bottom-right corner float
  - Reacts to user actions
  - Occasional helpful tooltips
  - Celebratory animations on success

---

## 7. KEY IMPLEMENTATION DETAILS

### Backend Workflow

#### Document Ingestion Pipeline
```
1. User uploads PDF
   ↓
2. FastAPI saves file to storage
   ↓
3. PyMuPDF extracts text
   ↓
4. Text chunking (512 tokens, 50 token overlap)
   ↓
5. Generate embeddings (BAAI/bge-small)
   ↓
6. Store in Qdrant + PostgreSQL metadata
   ↓
7. Mark as "processed" in DB
   ↓
8. Frontend notification: "SOP ready for analysis"
```

#### Gap Analysis Pipeline
```
1. Retrieve SOP chunks from Qdrant
   ↓
2. Load medical guidelines from Qdrant
   ↓
3. For each guideline:
   - Semantic search SOP chunks
   - Calculate coverage score (similarity)
   ↓
4. Calculate gap score = guideline importance - coverage
   ↓
5. Calculate readiness score:
   - Equipment presence: +20 points
   - Staff availability: +30 points
   - Budget availability: +25 points
   - Infrastructure: +25 points
   ↓
6. Generate gaps, store in DB
   ↓
7. Trigger recommendation generation
```

#### Recommendation Generation Pipeline
```
1. Get gap details + medical guideline
   ↓
2. Fetch hospital context (equipment, staff, budget)
   ↓
3. Call Gemini API with structured prompt:
   ---
   You are a hospital implementation expert. Given:
   
   Gap: [gap title + description]
   Medical Guideline: [guideline content]
   Hospital Context: [equipment, staff, budget]
   
   Generate a detailed, plain-language implementation plan including:
   - Step-by-step protocol
   - Resource requirements
   - Training needs
   - Success metrics
   - Risk mitigation
   
   Format as JSON.
   ---
   ↓
4. Parse Gemini response
   ↓
5. Store in recommendations table
   ↓
6. Frontend notification: "Recommendation ready"
```

#### Rollout Plan Generation Pipeline
```
1. Get recommendation details
   ↓
2. Call Gemini API with structured prompt:
   ---
   You are a hospital project manager. Create a detailed 4-week 
   implementation plan for: [recommendation]
   
   Format:
   Week 1: Training & Preparation
   - Day 1: [task]
   - Day 2: [task]
   ...
   Success Metrics: [metrics]
   Risk Mitigation: [risks]
   
   Repeat for weeks 2, 3, 4.
   ---
   ↓
3. Parse response into structured format
   ↓
4. Store in rollout_plans table
   ↓
5. Frontend notification + display plan
```

### Frontend State Management
- Use React Context API or Zustand for global state:
  - Current hospital
  - Current user
  - Authentication token
  - Cached dashboard data
- Fetch on-demand with React Query/SWR for API calls
- Real-time updates via WebSocket (optional for MVP+)

### Error Handling
- **Backend:** Return standard error responses:
  ```json
  {
    "error": "error_code",
    "message": "Human-readable message",
    "details": {...}
  }
  ```
- **Frontend:** Show user-friendly error toast notifications with retry buttons

---

## 8. ENVIRONMENT VARIABLES

### Backend `.env`
```
DATABASE_URL=postgresql://user:password@localhost:5432/bridgecare
QDRANT_HOST=localhost
QDRANT_PORT=6333
GOOGLE_GENERATIVE_AI_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key (optional)
JWT_SECRET=your_jwt_secret
ALLOWED_ORIGINS=http://localhost:3000,https://bridgecare-ai.vercel.app
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_HOSPITAL_ID=default_hospital_uuid (for demo)
```

---

## 9. TESTING STRATEGY

### Backend Testing
- Unit tests for gap calculation logic
- Integration tests for API endpoints
- Mock Gemini API responses for testing
- Test document parsing with sample PDFs

### Frontend Testing
- Component tests with React Testing Library
- E2E tests with Cypress/Playwright
- Visual regression testing for anime theme
- Performance testing (Lighthouse)

---

## 10. DEPLOYMENT CHECKLIST

- [ ] PostgreSQL database setup (production)
- [ ] Qdrant vector DB setup (production)
- [ ] Gemini API keys provisioned
- [ ] Backend deployed to Render/Railway/Heroku
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] CORS settings locked down
- [ ] Database migrations run
- [ ] SSL/TLS certificates configured
- [ ] Monitoring & logging setup (Sentry, DataDog)
- [ ] Rate limiting configured
- [ ] Backup strategy implemented

---

## 11. FOLDER STRUCTURE

### Backend
```
backend/
├── main.py                 # FastAPI app entry point
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables
├── config.py               # Configuration settings
├── database.py             # PostgreSQL connection
├── qdrant_client.py        # Qdrant vector DB setup
├── auth/
│   ├── __init__.py
│   ├── routes.py           # Auth endpoints
│   ├── models.py           # User, Token schemas
│   ├── jwt_handler.py      # JWT creation/validation
│   └── password_utils.py   # Hashing
├── hospitals/
│   ├── __init__.py
│   ├── routes.py           # Hospital endpoints
│   ├── models.py           # Hospital schema
│   └── services.py         # Business logic
├── departments/
│   ├── __init__.py
│   ├── routes.py
│   ├── models.py
│   └── services.py
├── documents/
│   ├── __init__.py
│   ├── routes.py           # Upload/process endpoints
│   ├── models.py
│   ├── services.py
│   ├── pdf_parser.py       # PyMuPDF extraction
│   ├── embedding_service.py # BAAI embeddings
│   └── qdrant_service.py    # Qdrant operations
├── gaps/
│   ├── __init__.py
│   ├── routes.py           # Gap analysis endpoints
│   ├── models.py
│   ├── services.py         # Gap scoring logic
│   ├── gap_finder.py       # Core gap analysis
│   └── readiness_calculator.py
├── recommendations/
│   ├── __init__.py
│   ├── routes.py
│   ├── models.py
│   ├── services.py
│   └── ai_generator.py     # Gemini API calls
├── rollout/
│   ├── __init__.py
│   ├── routes.py
│   ├── models.py
│   ├── services.py
│   └── plan_generator.py   # Rollout plan AI generation
├── utils/
│   ├── __init__.py
│   ├── logging.py
│   ├── constants.py
│   └── validators.py
└── tests/
    ├── test_auth.py
    ├── test_documents.py
    ├── test_gaps.py
    └── test_recommendations.py
```

### Frontend
```
frontend/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Dashboard page
│   ├── globals.css         # Global styles
│   ├── auth/
│   │   ├── register/page.tsx
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── hospitals/
│   │   ├── [id]/
│   │   │   ├── page.tsx    # Hospital detail
│   │   │   ├── setup/page.tsx
│   │   │   └── layout.tsx
│   │   └── layout.tsx
│   ├── documents/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── departments/
│   │   ├── [id]/page.tsx
│   │   └── layout.tsx
│   ├── gaps/
│   │   ├── page.tsx        # All gaps list
│   │   ├── [id]/page.tsx   # Gap detail
│   │   └── layout.tsx
│   ├── recommendations/
│   │   ├── [id]/page.tsx
│   │   └── layout.tsx
│   └── rollout-plans/
│       ├── [id]/page.tsx
│       └── layout.tsx
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── dropdown.tsx
│   │   ├── modal.tsx
│   │   └── toast.tsx
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   ├── GapCard.tsx
│   │   ├── RecommendationCard.tsx
│   │   └── DepartmentBreakdown.tsx
│   ├── documents/
│   │   ├── UploadZone.tsx
│   │   └── DocumentList.tsx
│   ├── gaps/
│   │   ├── GapsList.tsx
│   │   └── GapDetail.tsx
│   ├── recommendations/
│   │   └── RecommendationDetail.tsx
│   ├── rollout/
│   │   ├── WeekCard.tsx
│   │   ├── RolloutTimeline.tsx
│   │   └── RolloutDetail.tsx
│   ├── layout/
│   │   ├── Navigation.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── common/
│   │   ├── CharacterCorner.tsx (Mascot)
│   │   ├── LoadingAnimation.tsx
│   │   └── ErrorBoundary.tsx
│   └── forms/
│       ├── HospitalForm.tsx
│       ├── DepartmentForm.tsx
│       └── LoginForm.tsx
├── lib/
│   ├── api.ts              # API client
│   ├── utils.ts            # Utility functions
│   ├── auth.ts             # Auth helpers
│   ├── constants.ts        # Constants
│   └── hooks/
│       ├── useAuth.ts
│       ├── useHospital.ts
│       ├── useFetch.ts
│       └── useCharacter.ts (Mascot state)
├── styles/
│   ├── anime-theme.css     # Theme customizations
│   ├── animations.css      # Animation keyframes
│   └── variables.css       # CSS variables
├── public/
│   ├── images/
│   │   ├── mascot.svg      # Anime character
│   │   └── icons/
│   └── fonts/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── .env.local
```

---

## 12. MVP vs FULL FEATURE SET

### MVP (2-3 weeks)
- ✅ User registration/login
- ✅ Hospital profile setup
- ✅ SOP upload & PDF parsing
- ✅ Basic gap analysis (keyword matching)
- ✅ Mock recommendations (template-based)
- ✅ Dashboard with basic stats
- ✅ Anime-themed UI basics

### Full Feature Set (4-6 weeks)
- ✅ All MVP features
- ✅ RAG pipeline with Qdrant
- ✅ AI-powered recommendations (Gemini)
- ✅ 4-week rollout plan generation
- ✅ Department-level analysis
- ✅ Readiness scoring algorithm
- ✅ Full anime theme with mascot
- ✅ Rollout tracking & progress
- ✅ Team collaboration features
- ✅ PDF export of plans
- ✅ External integrations (Gnani, Mem0, Slashy)

---

## 13. SUCCESS METRICS

- Hospital registration: < 5 minutes
- SOP upload to analysis ready: < 2 minutes
- Gap analysis completion: < 30 seconds
- Recommendation generation: < 10 seconds
- Rollout plan generation: < 10 seconds
- UI responsiveness: < 100ms interaction delay
- User satisfaction: > 4.5/5 stars

---

## 14. NOTES FOR DEVELOPERS

1. **RAG Pipeline:** The gap analysis depends on quality embeddings. Use BAAI/bge-small which is optimized for semantic similarity in medical/business contexts.

2. **Gemini API:** Keep prompts structured and include hospital context. Test with sample hospitals before production deployment.

3. **Database Migrations:** Use Alembic for Python backend to manage schema changes.

4. **Frontend Components:** Build atomic components (buttons, cards) first, then compose into pages.

5. **Error Messages:** Keep them friendly and actionable, aligned with anime theme.

6. **Performance:** Cache dashboard stats, implement pagination for gaps/documents lists.

7. **Security:** 
   - Never expose API keys in frontend
   - Use HTTPS in production
   - Implement rate limiting on API endpoints
   - Validate all inputs server-side

8. **Testing:** Aim for >80% backend coverage, >60% frontend coverage.

---

This specification is comprehensive and ready to hand off to other developers. They have everything needed to build both backend and frontend independently.
