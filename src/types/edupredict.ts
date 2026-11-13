export type RiskTier = 'high' | 'medium' | 'low';

export type UserRole = 'admin' | 'faculty' | 'student';

export type ScreenId =
  | 'overview'
  | 'admin_classes'
  | 'students'
  | 'interventions'
  | 'faculty'
  | 'reports'
  | 'rules'
  | 'fac_classes'
  | 'fac_students'
  | 'fac_subjects'
  | 'fac_data_entry'
  | 'fac_risk_analysis'
  | 'fac_profile'
  | 'fac_settings'
  | 'student_pulse'
  | 'student_plan'
  | 'student_history';

export type InterventionStatus = 'pending' | 'in_progress' | 'completed';

export type InterventionChannel =
  | 'Faculty Mentoring'
  | 'Additional Coaching'
  | 'Attendance Counseling'
  | 'Lab & Practical Support'
  | 'Scholarship & Fee Guidance';

export type YearOfStudy = 'I Year' | 'II Year' | 'III Year' | 'IV Year';

export interface AuthSession {
  role: UserRole;
  userId: string;
  displayName: string;
  subtitle: string;
  email: string;
}

export interface FacultyMember {
  id: string;
  name: string;
  email: string;
  mobile: string;
  department: string;
  title: string;
  location: string;
  institution: string;
  status: 'active' | 'on_leave';
}

export interface AcademicClass {
  id: string;
  className: string;
  department: string;
  academicYear: string;
  semester: number;
  section: string;
  batch: string;
  description: string;
  assignedFacultyId: string;
  assignedFacultyName: string;
}

export interface SubjectItem {
  id: string;
  classId: string;
  code: string;
  name: string;
  type: 'Theory' | 'Practical';
  credits: number;
  assignedFacultyId: string;
  assignedFacultyName: string;
  semester: number;
}

export interface AssignmentEntry {
  id: string;
  name: string;
  status: 'Submitted' | 'Pending' | 'Late';
  submissionDate: string; // DD-MM-YYYY or '-'
  marksObtained: number;
  maxMarks: number;
}

export interface StudentSubjectRecord {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  subjectType: 'Theory' | 'Practical';
  credits: number;
  totalWorkingDays: number;
  daysPresent: number;
  daysAbsent: number;
  attendancePct: number;
  ia1: number; // out of 100
  ia2: number; // out of 100
  ia3: number; // out of 100
  assignmentMarks: number; // out of 100
  practicalMarks: number; // out of 100 (used for Practical subjects)
  internalAvg: number; // out of 100
  assignments: AssignmentEntry[];
  classParticipation: number; // 0-100
  assignmentCompletionPct: number; // 0-100
  engagementScore: number; // 0-100
}

export interface RiskDriver {
  id: string;
  label: string;
  impactPoints: number;
  category: 'attendance' | 'lms' | 'assessment' | 'engagement';
  detail: string;
}

export interface CaseNote {
  id: string;
  author: string;
  role: string;
  createdAt: string; // DD-MM-YYYY
  body: string;
}

export interface SubjectMark {
  courseCode: string;
  courseTitle: string;
  internalMarks: number;
  attendanceRate: number;
  assignmentsDone: number;
  assignmentsTotal: number;
}

export interface ImprovementActivity {
  id: string;
  title: string;
  category: string;
  dueDate: string; // DD-MM-YYYY
  completed: boolean;
  pointsLift: number;
}

export interface Student {
  id: string;
  studentCode: string; // Register Number e.g. 711725104001
  name: string;
  email: string;
  mobile: string; // +91 format
  location: string;
  classId: string;
  className: string;
  major: string;
  department: string;
  classYear: YearOfStudy;
  semester: number;
  section: string;
  batch: string;
  advisor: string;
  facultyId: string;
  gpa: number; // CGPA out of 10.0
  gpaDelta: number;
  internalMarksAvg: number; // 0-100
  attendanceRate: number; // 0-100
  lmsEngagement: number; // Academic Engagement Score 0-100
  lmsInactiveDays: number;
  assignmentsCompleted: number;
  assignmentsTotal: number;
  missingAssignments: number;
  creditsEnrolled: number;
  riskScore: number; // 0-100
  weeklyRiskHistory: number[];
  riskDrivers: RiskDriver[];
  subjectMarks: SubjectMark[];
  subjectRecords: StudentSubjectRecord[];
  improvementActivities: ImprovementActivity[];
  recommendedPathway: {
    title: string;
    channel: InterventionChannel;
    rationale: string;
    expectedRiskReduction: number;
  };
  caseNotes: CaseNote[];
}

export interface Intervention {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  classId?: string;
  className?: string;
  major: string;
  title: string;
  identifiedProblem: string;
  recommendedAction: string;
  channel: InterventionChannel;
  advisor: string;
  facultyId: string;
  status: InterventionStatus;
  dueDate: string; // DD-MM-YYYY
  createdAt: string; // DD-MM-YYYY
  facultyRemarks: string;
  source: 'ai_recommended' | 'advisor_manual' | 'batch_rule';
}

export interface RiskThresholds {
  highRiskMinScore: number;
  mediumRiskMinScore: number;
  lmsInactivityAlertDays: number;
  attendanceFloorPct: number;
  autoFlagMissingAssignments: number;
}

export interface FacultyNotificationPrefs {
  emailAlertsForHighRisk: boolean;
  attendanceWarningThreshold: number;
  internalMarksWarningThreshold: number;
  weeklyClassSummaryDigest: boolean;
}

export interface SimulationInput {
  targetAttendanceRate: number;
  tutoringHoursPerWeek: number;
  assignmentsRecovered: number;
}

export interface CohortWeeklyPoint {
  week: string;
  predictedRetention: number;
  baselineRetention: number;
  avgEngagement: number;
  flaggedCount: number;
}

export interface CourseBottleneck {
  courseCode: string;
  courseName: string;
  department: string;
  enrolled: number;
  atRiskCount: number;
  dfwRate: number;
}

export interface DepartmentStats {
  department: string;
  studentCount: number;
  classCount: number;
  avgGpa: number;
  avgAttendance: number;
  avgInternalMarks: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
}

export interface FacultyPerformance {
  faculty: FacultyMember;
  classCount: number;
  assignedCount: number;
  highRiskCount: number;
  avgAttendance: number;
  avgGpa: number;
  activeInterventions: number;
  completedInterventions: number;
}
