# EduPulse AI — Student Academic Risk Prediction & Mentoring System

**EduPulse AI** is a frontend academic early-warning and student mentoring prototype built with React, TypeScript, Vite, and Tailwind CSS for Tamil Nadu engineering institutions (Kongu Institute of Technology · Anna University curriculum demo).

> **Demo & Risk Simulation Notice:** This is a strictly frontend prototype using `localStorage` persistence (`edupulse_tn_state_v2`) and deterministic simulated risk heuristics. Demo role login is for interactive exploration only—not production authentication—and risk scores are rule-based calculations rather than trained machine-learning inference.

## Key Portals & Features

### 1. Admin Portal (`principal@kongutech.edu.in`)
- **Cohort Overview:** Institution-wide KPI cards, 10-week retention trajectory chart, simulated risk tier distribution, priority attention queue, and dynamic subject bottleneck watchlist.
- **Classes & Subjects:** Inspect all 8 classes across 7 Tamil Nadu engineering departments (`CSE`, `IT`, `ECE`, `EEE`, `MECH`, `Civil Engineering`, `AI & DS`), view subject allocations, and reassign class ownership across faculty mentors.
- **Student Directory:** Filter 50 seeded students by risk tier, department, faculty advisor, or register number; inspect academic profiles; batch-assign improvement plans; add new students; export CSV.
- **Faculty & Departments:** Monitor faculty caseloads, department-level CGPA/attendance metrics, toggle faculty status, and rebalance student-to-faculty assignments.
- **Improvement Plans, Reports & Alert Rules:** Track intervention completion, compare department metrics, and calibrate simulated risk thresholds (`highRiskMin`, `mediumRiskMin`, `attendanceFloor`).

### 2. Faculty Portal (`senthilkumar.r@kongutech.edu.in` and 6 other faculty accounts)
Structured 10-view academic workflow scoped strictly to the logged-in faculty member's classes and students:
1. **Dashboard:** Faculty caseload KPIs, quick workflow steps, and priority students.
2. **My Classes:** Create and edit academic classes (ownership automatically locked to the logged-in faculty account).
3. **Student Management:** Enroll students, edit profiles, import rosters via CSV/Excel export, and remove students with confirmation.
4. **Subject Management:** Create Theory/Practical Anna University subjects and move subjects across classes with confirmation—automatically archiving prior student marks into `historicalSubjectRecords`, initializing baseline records for the target class, and recalculating affected risk scores.
5. **Academic Data Entry:** Enter subject-wise attendance, IA1/IA2/IA3 marks, practical/assignment marks, participation, and task submissions (`DD-MM-YYYY`).
6. **AI Risk Analysis:** Review simulated risk classifications, drivers, and subject averages per class.
7. **Improvement Plans, Reports, Profile & Settings:** Assign/update mentoring plans, export class CSVs, and adjust local threshold preferences.

### 3. Student Portal (`arun.kumar25@kongutech.edu.in` and 49 student accounts)
- **My Academic Pulse:** Read-only view of enrolled class, subject-wise attendance, IA marks, simulated risk insights, and mentor remarks.
- **Improvement Plan:** Track faculty-assigned improvement plans and check off personal action items.
- **Progress & History:** Review 6-week risk score history, IA1/IA2/IA3 exam breakdown, and assignment submission tracking.

## Scripts

```bash
# Install dependencies
npm install

# Run development server on port 3000
npm run dev

# Run unit tests (Node built-in test runner via tsx)
npm test

# Lint TypeScript & codebase
npm run lint

# Build production bundle
npm run build
```
