# Face Recognition Attendance System

A modern, real-time, privacy-first face recognition attendance system with offline kiosk support, manual resolution queue, and OTP fallback. Designed for universities and colleges.

---

## Features

- **Four roles**: Admin · Faculty · Student · Kiosk
- Real-time attendance via WebSocket
- Offline-capable kiosk (IndexedDB + Service Worker queue)
- Edge or server-side embedding computation
- Manual unresolved queue with top candidate suggestions
- OTP fallback for missed/unresolved students
- Automatic raw image purging (privacy compliant)
- CSV export & full audit trail
- Minimal liveness check (prevents photo spoofing)
- Role-based access with JWT

---

## High-Level Architecture

┌─────────────────────────────────────┐
│ Frontend (React PWA) │
│ Admin │ Faculty │ Student │ Kiosk │
└───────────────↑↓────────────────────┘
│ REST + WebSocket
┌───────────────▼────────────────────┐
│ Backend (FastAPI - Python) │
└───────────────↑↓────────────────────┘
┌───────────────▼────────────────────┐
│ PostgreSQL + Local/S3 File Store │
└───────────────↑↓────────────────────┘
│ ML Inference
┌───────────────▼────────────────────┐
│ InsightFace / ArcFace / FaceNet │
└────────────────────────────────────┘

yaml
Copy code

---

## Frontend (React PWA)

Progressive Web App with role-based routing and offline kiosk support.

### Admin Panel
- Student management (CRUD): enrollment_no, name, semester, email
- Subject management & bulk student assignment
- Enrollment image upload:
  - Multi-file upload
  - Webcam capture (auto-capture N frames or manual)
- **Train/Index** button → recompute embeddings & canonical vectors
- Model version + training timestamp display
- Export attendance CSV (date, subject filters)
- View prediction logs & unresolved entries

### Faculty Dashboard
- Start/Stop attendance window (set duration)
- Live attendance feed (WebSocket)
- Unresolved queue with:
  - Thumbnail preview
  - Top 3 nearest candidates
  - Actions: Manual Mark · Send OTP · Reject
- Attendance reports & CSV export per subject/date range

### Student Portal
- View enrolled subjects
- Attendance percentage & detailed history
- "Request Help" → triggers OTP if missed during active window
- Simple profile page

### Kiosk Mode (Offline-First)
- Fullscreen, auto-start ready
- "No active session" screen when idle
- Active session:
  - Live webcam preview
  - Continuous detection & recognition
  - Instant visual feedback:
    - ✔ Matched (green)
    - ✖ Unknown (red)
    - ✖ No face / Multiple faces
    - ✖ Low confidence
- Local queue (IndexedDB) when offline → auto-sync on reconnect
- Configurable classroom/location ID

---

## Backend (FastAPI - Python)

### Core Features
- REST API + WebSocket for real-time updates
- Minimal auth for Admin/Faculty (username/password)
- JWT protection for sensitive endpoints
- Rate limiting on recognition & OTP routes
- HTTPS/TLS enforced

---

## Key Endpoints

| Method | Endpoint                | Description |
|--------|-------------------------|-------------|
| POST   | `/students`             | Create student |
| GET    | `/students/{id}`        | Get student details |
| POST   | `/students/{id}/images` | Upload enrollment images (multipart) |
| POST   | `/admin/train`          | Recompute embeddings & canonical vectors |
| POST   | `/windows/arm`          | Start attendance window |
| POST   | `/windows/close`        | End attendance window |
| GET    | `/windows/active`       | Get current active window |
| POST   | `/recognize`            | Submit embedding/cropped face for match |
| WS     | `/ws`                   | Real-time updates |
| POST   | `/otp/request`          | Student requests OTP |
| POST   | `/otp/verify`           | Verify OTP & mark attendance |

---

## Database Schema (PostgreSQL)

```sql
students
└── enrollment_no (PK), name, semester, email, consent_ts, created_at

subjects
└── id (PK), code, name, semester

student_subjects
└── id, enrollment_no FK, subject_id FK

student_images
└── id, enrollment_no FK, file_path, processed_path, captured_at

embeddings
└── id, enrollment_no FK, vector BYTEA, image_id FK

student_profile
└── enrollment_no (PK), canonical_embedding BYTEA, updated_at

attendance_windows
└── id, subject_id, faculty_id, start_ts, end_ts, status

attendance_records
└── id, enrollment_no, subject_id, timestamp, method, confidence, window_id

prediction_logs
└── id, attempted_at, predicted_enrollment, confidence, status, note, window_id
```

## Indexes

- `attendance_records(subject_id, timestamp)`
- `embeddings(enrollment_no)`
- `prediction_logs(window_id)`

---

## Data Retention

- **Raw images** → auto-purge after **30 days**
- **Embeddings** → retained unless student removed
- **Logs** → retained for **1 year**

---

## Machine Learning Pipeline

### Face Detection
- InsightFace or OpenCV DNN
- Configurable: `scaleFactor`, `minNeighbors`

### Preprocessing
- Optional landmark alignment
- Resize to **112×112** or **160×160**
- Normalize pixel values

### Embedding Model
- **ArcFace** (recommended) or **FaceNet**
- 512-dimensional **L2-normalized** vectors

### Matching
- Canonical embedding = mean of all normalized enrollment embeddings
- Similarity metric → **Cosine similarity**
- Default threshold → **0.65**
- Return **top-3 candidates** for unresolved cases

### Liveness (MVP)
Compare **two consecutive frames**:
- Embedding distance < **0.3**
- Low motion difference  
Helps prevent basic photo spoofing.

### Optional Indexing
- **FAISS** index recommended for datasets **>10,000 students**

---

## Configuration (`.env`)

```env
MATCH_THRESHOLD=0.65
MIN_ENROLLMENT_IMAGES=8
IMAGE_PURGE_DAYS=30
OTP_RATE_LIMIT=3/hour
RECOGNITION_RATE_LIMIT=5/sec
EMBEDDING_MODE=edge
DATABASE_URL=postgresql://user:password@localhost/db
JWT_SECRET=your_secret_key
```

otp_requests
└── id, student_enrollment, window_id, hashed_otp, expires_at, status
