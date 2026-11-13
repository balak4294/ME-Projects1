import { useEffect, useState } from 'react';
import {
  Activity,
  BookOpen,
  Building2,
  ClipboardCheck,
  FileBarChart2,
  FileSpreadsheet,
  FolderKanban,
  History,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Settings,
  ShieldAlert,
  Sliders,
  Sparkles,
  UserCircle2,
  Users,
  X,
} from 'lucide-react';
import { AdminClassesScreen } from './components/AdminClassesScreen';
import { AlertRulesScreen } from './components/AlertRulesScreen';
import { BrandLogo } from './components/BrandLogo';
import { FacultyAcademicEntryScreen } from './components/FacultyAcademicEntryScreen';
import { FacultyClassesScreen } from './components/FacultyClassesScreen';
import { FacultyManagementScreen } from './components/FacultyManagementScreen';
import { FacultyOverviewScreen } from './components/FacultyOverviewScreen';
import {
  FacultyProfileScreen,
  FacultySettingsScreen,
} from './components/FacultyProfileSettingsScreen';
import { FacultyRiskAnalysisScreen } from './components/FacultyRiskAnalysisScreen';
import { FacultyStudentManagementScreen } from './components/FacultyStudentManagementScreen';
import { FacultySubjectManagementScreen } from './components/FacultySubjectManagementScreen';
import { InterventionsScreen } from './components/InterventionsScreen';
import { LoginScreen } from './components/LoginScreen';
import { OverviewScreen } from './components/OverviewScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { StudentDashboard } from './components/StudentDashboard';
import { StudentDetailDrawer } from './components/StudentDetailDrawer';
import { StudentsScreen } from './components/StudentsScreen';
import {
  COHORT_WEEKLY_SERIES,
  COURSE_BOTTLENECKS,
  SEED_CLASSES,
  SEED_FACULTY,
  SEED_INTERVENTIONS,
  SEED_STUDENTS,
  SEED_SUBJECTS,
} from './data/seedData';
import type {
  AcademicClass,
  AuthSession,
  FacultyMember,
  FacultyNotificationPrefs,
  Intervention,
  InterventionChannel,
  InterventionStatus,
  RiskThresholds,
  RiskTier,
  ScreenId,
  Student,
  StudentSubjectRecord,
  SubjectItem,
  UserRole,
  YearOfStudy,
} from './types/edupredict';
import {
  createBaselineSubjectRecords,
  DEFAULT_THRESHOLDS,
  formatDateDDMMYYYY,
  getScopedClassesForFaculty,
  getScopedStudentsForRole,
  getStudentRiskSummary,
  parseStudentCsvImport,
  recalculateBaseRiskScoreFromRecord,
  recalculateStudentFromSubjectRecords,
  semesterToYearOfStudy,
} from './utils/riskEngine';

const STORAGE_KEY = 'edupulse_tn_state_v1';

const DEFAULT_FACULTY_PREFS: FacultyNotificationPrefs = {
  emailAlertsForHighRisk: true,
  attendanceWarningThreshold: 75,
  internalMarksWarningThreshold: 60,
  weeklyClassSummaryDigest: true,
};

interface PersistedState {
  session: AuthSession | null;
  students: Student[];
  facultyList: FacultyMember[];
  classes: AcademicClass[];
  subjects: SubjectItem[];
  interventions: Intervention[];
  thresholds: RiskThresholds;
  facultyPrefs: FacultyNotificationPrefs;
}

function loadInitialState(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        session: null,
        students: SEED_STUDENTS,
        facultyList: SEED_FACULTY,
        classes: SEED_CLASSES,
        subjects: SEED_SUBJECTS,
        interventions: SEED_INTERVENTIONS,
        thresholds: DEFAULT_THRESHOLDS,
        facultyPrefs: DEFAULT_FACULTY_PREFS,
      };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      session: parsed.session ?? null,
      students:
        Array.isArray(parsed.students) && parsed.students.length > 0
          ? parsed.students
          : SEED_STUDENTS,
      facultyList:
        Array.isArray(parsed.facultyList) && parsed.facultyList.length > 0
          ? parsed.facultyList
          : SEED_FACULTY,
      classes:
        Array.isArray(parsed.classes) && parsed.classes.length > 0
          ? parsed.classes
          : SEED_CLASSES,
      subjects:
        Array.isArray(parsed.subjects) && parsed.subjects.length > 0
          ? parsed.subjects
          : SEED_SUBJECTS,
      interventions: Array.isArray(parsed.interventions)
        ? parsed.interventions
        : SEED_INTERVENTIONS,
      thresholds: parsed.thresholds
        ? { ...DEFAULT_THRESHOLDS, ...parsed.thresholds }
        : DEFAULT_THRESHOLDS,
      facultyPrefs: parsed.facultyPrefs
        ? { ...DEFAULT_FACULTY_PREFS, ...parsed.facultyPrefs }
        : DEFAULT_FACULTY_PREFS,
    };
  } catch {
    return {
      session: null,
      students: SEED_STUDENTS,
      facultyList: SEED_FACULTY,
      classes: SEED_CLASSES,
      subjects: SEED_SUBJECTS,
      interventions: SEED_INTERVENTIONS,
      thresholds: DEFAULT_THRESHOLDS,
      facultyPrefs: DEFAULT_FACULTY_PREFS,
    };
  }
}

function defaultScreenForRole(role: UserRole): ScreenId {
  if (role === 'admin') return 'overview';
  if (role === 'faculty') return 'overview';
  return 'student_pulse';
}

const SCREEN_META: Record<ScreenId, { title: string; subtitle: string }> = {
  overview: {
    title: 'Cohort Overview',
    subtitle:
      'Institution-wide attendance, internal assessment metrics, and simulated academic risk insights.',
  },
  admin_classes: {
    title: 'Classes & Subjects',
    subtitle:
      'Monitor all faculty-created classes, assigned subjects, and risk classifications across departments.',
  },
  students: {
    title: 'Student Directory',
    subtitle:
      'Filterable student academic risk directory with register numbers, class details, and mentor actions.',
  },
  faculty: {
    title: 'Faculty & Departments',
    subtitle:
      'Manage faculty members, assign student caseloads, and monitor department-wise performance.',
  },
  interventions: {
    title: 'Improvement Plans',
    subtitle:
      'Create, assign, and monitor structured academic improvement plans with faculty remarks.',
  },
  reports: {
    title: 'Reports & Analytics',
    subtitle:
      'Semester retention benchmarks, department comparisons, faculty progress, and CSV exports.',
  },
  rules: {
    title: 'Early Warning Rules',
    subtitle:
      'Calibrate simulated risk thresholds, attendance floors, and assignment warning triggers.',
  },
  fac_classes: {
    title: 'My Classes',
    subtitle:
      'Step 1 · Create and manage academic classes by department, semester, section, and batch.',
  },
  fac_students: {
    title: 'Student Management',
    subtitle:
      'Step 2 · Enroll students into classes, import via CSV/Excel, and filter by performance or risk.',
  },
  fac_subjects: {
    title: 'Subject Management',
    subtitle:
      'Step 3 · Create theory or practical subjects and assign faculty mentors to each class.',
  },
  fac_data_entry: {
    title: 'Academic Data Entry',
    subtitle:
      'Step 4 · Enter subject-wise attendance, IA1/IA2/IA3 marks, assignments, and engagement scores.',
  },
  fac_risk_analysis: {
    title: 'AI Risk Analysis',
    subtitle:
      'Step 5 · Review simulated risk predictions, contributing factors, and subject-wise performance.',
  },
  fac_profile: {
    title: 'Faculty Profile',
    subtitle:
      'Your institutional profile, campus contact details, and assigned academic classes.',
  },
  fac_settings: {
    title: 'Mentoring Settings',
    subtitle:
      'Configure class attendance warning thresholds and weekly mentoring digest preferences.',
  },
  student_pulse: {
    title: 'My Academic Pulse',
    subtitle:
      'Read-only overview of your enrolled class, subject attendance, IA marks, and simulated risk.',
  },
  student_plan: {
    title: 'Improvement Plan',
    subtitle:
      'View faculty-assigned improvement plans and track your personal action checklist.',
  },
  student_history: {
    title: 'Progress & History',
    subtitle:
      'Review weekly risk score history, IA1/IA2/IA3 marks, and assignment submission status.',
  },
};

export default function App() {
  const [initial] = useState<PersistedState>(() => loadInitialState());
  const [session, setSession] = useState<AuthSession | null>(initial.session);
  const [students, setStudents] = useState<Student[]>(initial.students);
  const [facultyList, setFacultyList] = useState<FacultyMember[]>(
    initial.facultyList
  );
  const [classes, setClasses] = useState<AcademicClass[]>(initial.classes);
  const [subjects, setSubjects] = useState<SubjectItem[]>(initial.subjects);
  const [interventions, setInterventions] = useState<Intervention[]>(
    initial.interventions
  );
  const [thresholds, setThresholds] = useState<RiskThresholds>(
    initial.thresholds
  );
  const [facultyPrefs, setFacultyPrefs] = useState<FacultyNotificationPrefs>(
    initial.facultyPrefs
  );

  const [activeScreen, setActiveScreen] = useState<ScreenId>(() =>
    initial.session ? defaultScreenForRole(initial.session.role) : 'overview'
  );
  const [studentTierFilter, setStudentTierFilter] = useState<'all' | RiskTier>(
    'all'
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initial.classes[0]?.id ?? 'cls-cse-2a'
  );
  const [selectedEntryStudentId, setSelectedEntryStudentId] = useState<string>(
    initial.students[0]?.id ?? 'stu-01'
  );
  const [preselectedPlanStudentId, setPreselectedPlanStudentId] = useState<
    string | null
  >(null);
  const [inspectedStudentId, setInspectedStudentId] = useState<string | null>(
    null
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [activeScreen, session]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          session,
          students,
          facultyList,
          classes,
          subjects,
          interventions,
          thresholds,
          facultyPrefs,
        })
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [
    session,
    students,
    facultyList,
    classes,
    subjects,
    interventions,
    thresholds,
    facultyPrefs,
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  };

  const handleLogin = (nextSession: AuthSession) => {
    setSession(nextSession);
    setActiveScreen(defaultScreenForRole(nextSession.role));
    setStudentTierFilter('all');
    setInspectedStudentId(null);
    setPreselectedPlanStudentId(null);
    setMobileMenuOpen(false);
    if (nextSession.role === 'faculty') {
      const facClasses = getScopedClassesForFaculty(classes, nextSession.userId);
      if (facClasses[0]) {
        setSelectedClassId(facClasses[0].id);
        const firstStu = students.find((s) => s.classId === facClasses[0].id);
        if (firstStu) setSelectedEntryStudentId(firstStu.id);
      }
    }
    showToast(`Signed in as ${nextSession.displayName}`);
  };

  const handleSignOut = () => {
    setSession(null);
    setInspectedStudentId(null);
    setPreselectedPlanStudentId(null);
    setMobileMenuOpen(false);
  };

  if (!session) {
    return (
      <LoginScreen
        facultyList={facultyList}
        students={students}
        onLogin={handleLogin}
      />
    );
  }

  const currentFaculty =
    session.role === 'faculty'
      ? facultyList.find((f) => f.id === session.userId) ?? facultyList[0]
      : facultyList[0];

  const scopedClasses =
    session.role === 'faculty'
      ? getScopedClassesForFaculty(classes, session.userId)
      : classes;

  const scopedClassIds = new Set(scopedClasses.map((c) => c.id));

  const scopedStudents =
    session.role === 'faculty'
      ? students.filter(
          (s) => s.facultyId === session.userId || scopedClassIds.has(s.classId)
        )
      : getScopedStudentsForRole(students, session.role, session.userId);

  const scopedStudentIds = new Set(scopedStudents.map((s) => s.id));
  const scopedSubjects =
    session.role === 'faculty'
      ? subjects.filter(
          (sub) =>
            scopedClassIds.has(sub.classId) ||
            sub.assignedFacultyId === session.userId
        )
      : subjects;

  const scopedInterventions =
    session.role === 'admin'
      ? interventions
      : interventions.filter(
          (i) =>
            scopedStudentIds.has(i.studentId) ||
            (session.role === 'faculty' && i.facultyId === session.userId)
        );

  const inspectedStudent =
    scopedStudents.find((stu) => stu.id === inspectedStudentId) ?? null;

  const activeFacultyClassId =
    scopedClasses.some((c) => c.id === selectedClassId)
      ? selectedClassId
      : scopedClasses[0]?.id ?? '';

  const assignAiPathwaysForIds = (
    targetIds: string[],
    source: 'ai_recommended' | 'batch_rule' = 'ai_recommended'
  ) => {
    const existingActiveIds = new Set(
      interventions
        .filter((i) => i.status === 'in_progress' || i.status === 'pending')
        .map((i) => i.studentId)
    );

    const created: Intervention[] = [];
    const today = '13-11-2026';
    const targetDate = '25-11-2026';

    for (const id of targetIds) {
      if (existingActiveIds.has(id)) continue;
      const stu = scopedStudents.find((s) => s.id === id);
      if (!stu) continue;
      const topDriver = stu.riskDrivers[0];
      created.push({
        id: `int-${Date.now()}-${stu.id}`,
        studentId: stu.id,
        studentName: stu.name,
        studentCode: stu.studentCode,
        classId: stu.classId,
        className: stu.className,
        major: stu.major,
        title: stu.recommendedPathway.title,
        identifiedProblem:
          topDriver?.label ??
          `Attendance at ${stu.attendanceRate}% and IA avg ${stu.internalMarksAvg}%`,
        recommendedAction: stu.recommendedPathway.rationale,
        channel: stu.recommendedPathway.channel,
        advisor: stu.advisor,
        facultyId: stu.facultyId,
        status: 'in_progress',
        dueDate: targetDate,
        createdAt: today,
        facultyRemarks: 'Assigned via simulated risk workflow; initial check-in scheduled.',
        source,
      });
    }

    if (created.length === 0) {
      showToast('Selected students already have pending or in-progress improvement plans.');
      return;
    }

    setInterventions((prev) => [...created, ...prev]);
    if (created.length === 1) {
      showToast(`Assigned improvement plan to ${created[0].studentName}.`);
    } else {
      showToast(`Assigned improvement plans to ${created.length} students.`);
    }
  };

  const handleLaunchBatchHighRisk = () => {
    const activeIds = new Set(
      interventions
        .filter((i) => i.status === 'in_progress' || i.status === 'pending')
        .map((i) => i.studentId)
    );
    const unaddressedHighIds = scopedStudents
      .filter(
        (s) =>
          getStudentRiskSummary(s, thresholds).tier === 'high' &&
          !activeIds.has(s.id)
      )
      .map((s) => s.id);

    assignAiPathwaysForIds(unaddressedHighIds, 'batch_rule');
  };

  // --- Step 1: Class Management ---
  const handleCreateClass = (payload: Omit<AcademicClass, 'id'>) => {
    const newClass: AcademicClass = {
      ...payload,
      id: `cls-${Date.now()}`,
    };
    setClasses((prev) => [newClass, ...prev]);
    setSelectedClassId(newClass.id);
    showToast(`Created class "${newClass.className}".`);
  };

  const handleUpdateClass = (
    classId: string,
    payload: Omit<AcademicClass, 'id'>
  ) => {
    setClasses((prev) =>
      prev.map((c) => (c.id === classId ? { ...payload, id: classId } : c))
    );
    setStudents((prev) =>
      prev.map((s) =>
        s.classId === classId
          ? {
              ...s,
              className: payload.className,
              department: payload.department,
              semester: payload.semester,
              section: payload.section,
              batch: payload.batch,
              classYear: semesterToYearOfStudy(payload.semester),
              facultyId: payload.assignedFacultyId,
              advisor: payload.assignedFacultyName,
            }
          : s
      )
    );
    showToast(`Updated class "${payload.className}".`);
  };

  // --- Step 2: Faculty Student Management & CSV Import ---
  const buildNewClassStudent = (params: {
    cls: AcademicClass;
    name: string;
    registerNumber: string;
    department: string;
    classYear: YearOfStudy;
    semester: number;
    section: string;
    email: string;
    mobile: string;
    location: string;
    attendanceRate?: number;
    internalMarksAvg?: number;
    missingAssignments?: number;
  }): Student => {
    const classSubjects = subjects.filter((sub) => sub.classId === params.cls.id);
    const att = params.attendanceRate ?? 82;
    const marks = params.internalMarksAvg ?? 75;
    const missing = params.missingAssignments ?? 1;
    const baselineRecords = createBaselineSubjectRecords(
      classSubjects,
      att,
      marks,
      missing
    );

    const baseStudent: Student = {
      id: `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      studentCode: params.registerNumber,
      name: params.name,
      email: params.email,
      mobile: params.mobile,
      location: params.location,
      classId: params.cls.id,
      className: params.cls.className,
      major: params.department,
      department: params.department,
      classYear: params.classYear,
      semester: params.semester,
      section: params.section,
      batch: params.cls.batch,
      advisor: params.cls.assignedFacultyName,
      facultyId: params.cls.assignedFacultyId,
      gpa: Number(((marks / 10) * 0.98).toFixed(2)),
      gpaDelta: 0,
      internalMarksAvg: marks,
      attendanceRate: att,
      lmsEngagement: Math.max(40, att - 5),
      lmsInactiveDays: att < 75 ? 6 : 2,
      assignmentsCompleted: 4,
      assignmentsTotal: 5,
      missingAssignments: missing,
      creditsEnrolled: classSubjects.reduce((s, c) => s + c.credits, 0) || 15,
      riskScore: recalculateBaseRiskScoreFromRecord({
        attendanceRate: att,
        internalMarksAvg: marks,
        missingAssignments: missing,
        lmsInactiveDays: att < 75 ? 6 : 2,
      }),
      weeklyRiskHistory: [32, 34, 35, 36, 36, 36],
      riskDrivers: [
        {
          id: `drv-${Date.now()}`,
          label: 'Baseline semester monitoring initialized',
          impactPoints: 6,
          category: 'engagement',
          detail: `Enrolled in ${params.cls.className} with ${classSubjects.length} assigned subjects.`,
        },
      ],
      subjectMarks: [],
      subjectRecords: baselineRecords,
      improvementActivities: [
        {
          id: `act-${Date.now()}`,
          title: 'Complete initial IA1 readiness checklist',
          category: 'Mentoring',
          dueDate: '24-11-2026',
          completed: false,
          pointsLift: 6,
        },
      ],
      recommendedPathway: {
        title: `${params.cls.className} Mentoring Sync`,
        channel: 'Faculty Mentoring',
        rationale: 'Establish regular IA & attendance cadence across class subjects.',
        expectedRiskReduction: 12,
      },
      caseNotes: [],
    };

    return baselineRecords.length > 0
      ? recalculateStudentFromSubjectRecords(baseStudent, baselineRecords)
      : baseStudent;
  };

  const handleAddStudentToClass = (payload: {
    classId: string;
    name: string;
    registerNumber: string;
    department: string;
    classYear: YearOfStudy;
    semester: number;
    section: string;
    email: string;
    mobile: string;
    location: string;
  }) => {
    const cls = classes.find((c) => c.id === payload.classId) ?? classes[0];
    if (!cls) return;
    const newStudent = buildNewClassStudent({ cls, ...payload });
    setStudents((prev) => [newStudent, ...prev]);
    setSelectedEntryStudentId(newStudent.id);
    showToast(`Added ${newStudent.name} (${newStudent.studentCode}) to ${cls.className}.`);
  };

  const handleUpdateStudentInfo = (
    studentId: string,
    payload: {
      name: string;
      registerNumber: string;
      department: string;
      classYear: YearOfStudy;
      semester: number;
      section: string;
      email: string;
      mobile: string;
      location: string;
    }
  ) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              name: payload.name,
              studentCode: payload.registerNumber,
              department: payload.department,
              classYear: payload.classYear,
              semester: payload.semester,
              section: payload.section,
              email: payload.email,
              mobile: payload.mobile,
              location: payload.location,
            }
          : s
      )
    );
    showToast(`Updated details for ${payload.name}.`);
  };

  const handleRemoveStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setInterventions((prev) => prev.filter((i) => i.studentId !== studentId));
    showToast('Removed student from class roster.');
  };

  const handleImportStudentsCsv = (
    classId: string,
    rows: ReturnType<typeof parseStudentCsvImport>
  ) => {
    const cls = classes.find((c) => c.id === classId) ?? classes[0];
    if (!cls || rows.length === 0) return;
    const created = rows.map((row) =>
      buildNewClassStudent({
        cls,
        name: row.name,
        registerNumber: row.registerNumber,
        department: cls.department,
        classYear: semesterToYearOfStudy(cls.semester),
        semester: cls.semester,
        section: cls.section,
        email: row.email,
        mobile: row.mobile,
        location: row.location,
        attendanceRate: row.attendanceRate,
        internalMarksAvg: row.internalMarksAvg,
        missingAssignments: row.attendanceRate < 75 ? 2 : 0,
      })
    );
    setStudents((prev) => [...created, ...prev]);
    showToast(`Imported ${created.length} students into ${cls.className}.`);
  };

  // --- Step 3: Subject Management ---
  const handleAddSubject = (payload: Omit<SubjectItem, 'id'>) => {
    const newSub: SubjectItem = {
      ...payload,
      id: `sub-${Date.now()}`,
    };
    setSubjects((prev) => [...prev, newSub]);

    // Sync new subject record into all students enrolled in that class
    setStudents((prev) =>
      prev.map((stu) => {
        if (stu.classId !== payload.classId) return stu;
        const [baseline] = createBaselineSubjectRecords(
          [newSub],
          stu.attendanceRate,
          stu.internalMarksAvg,
          0
        );
        const nextRecords = [...stu.subjectRecords, baseline];
        return {
          ...recalculateStudentFromSubjectRecords(stu, nextRecords),
          creditsEnrolled: stu.creditsEnrolled + newSub.credits,
        };
      })
    );
    showToast(`Assigned ${newSub.code} – ${newSub.name} to class.`);
  };

  const handleUpdateSubject = (
    subjectId: string,
    payload: Omit<SubjectItem, 'id'>
  ) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === subjectId ? { ...payload, id: subjectId } : s))
    );
    setStudents((prev) =>
      prev.map((stu) => {
        if (stu.classId !== payload.classId) return stu;
        const nextRecords = stu.subjectRecords.map((rec) =>
          rec.subjectId === subjectId
            ? {
                ...rec,
                subjectCode: payload.code,
                subjectName: payload.name,
                subjectType: payload.type,
                credits: payload.credits,
              }
            : rec
        );
        return recalculateStudentFromSubjectRecords(stu, nextRecords);
      })
    );
    showToast(`Updated subject ${payload.code} – ${payload.name}.`);
  };

  const handleRemoveSubject = (subjectId: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
    setStudents((prev) =>
      prev.map((stu) => {
        const hasSub = stu.subjectRecords.some((r) => r.subjectId === subjectId);
        if (!hasSub) return stu;
        const nextRecords = stu.subjectRecords.filter(
          (r) => r.subjectId !== subjectId
        );
        return nextRecords.length > 0
          ? recalculateStudentFromSubjectRecords(stu, nextRecords)
          : { ...stu, subjectRecords: [], subjectMarks: [] };
      })
    );
    showToast('Removed subject from class.');
  };

  // --- Step 4: Academic Data Entry ---
  const handleSaveSubjectRecord = (
    studentId: string,
    updatedRecord: StudentSubjectRecord
  ) => {
    setStudents((prev) =>
      prev.map((stu) => {
        if (stu.id !== studentId) return stu;
        const exists = stu.subjectRecords.some(
          (r) => r.subjectId === updatedRecord.subjectId
        );
        const nextRecords = exists
          ? stu.subjectRecords.map((r) =>
              r.subjectId === updatedRecord.subjectId ? updatedRecord : r
            )
          : [...stu.subjectRecords, updatedRecord];
        return recalculateStudentFromSubjectRecords(stu, nextRecords);
      })
    );
    showToast(
      `Saved ${updatedRecord.subjectCode} academic data & recalculated simulated risk.`
    );
  };

  // --- Step 6: Improvement Plans ---
  const handleAdvanceInterventionStatus = (
    interventionId: string,
    nextStatus: InterventionStatus
  ) => {
    setInterventions((prev) =>
      prev.map((item) =>
        item.id === interventionId ? { ...item, status: nextStatus } : item
      )
    );
    showToast(
      nextStatus === 'completed'
        ? 'Improvement plan marked as completed.'
        : 'Improvement plan moved to In Progress.'
    );
  };

  const handleUpdateInterventionRemarks = (
    interventionId: string,
    remarks: string
  ) => {
    setInterventions((prev) =>
      prev.map((item) =>
        item.id === interventionId ? { ...item, facultyRemarks: remarks } : item
      )
    );
    showToast('Saved faculty remarks.');
  };

  const handleCreateIntervention = (payload: {
    studentId: string;
    title: string;
    identifiedProblem: string;
    recommendedAction: string;
    channel: InterventionChannel;
    dueDate: string;
    facultyRemarks: string;
  }) => {
    const stu = scopedStudents.find((s) => s.id === payload.studentId);
    if (!stu) return;

    const newItem: Intervention = {
      id: `int-${Date.now()}`,
      studentId: stu.id,
      studentName: stu.name,
      studentCode: stu.studentCode,
      classId: stu.classId,
      className: stu.className,
      major: stu.major,
      title: payload.title,
      identifiedProblem: payload.identifiedProblem,
      recommendedAction: payload.recommendedAction,
      channel: payload.channel,
      advisor: stu.advisor,
      facultyId: stu.facultyId,
      status: 'pending',
      dueDate: formatDateDDMMYYYY(payload.dueDate),
      createdAt: '13-11-2026',
      facultyRemarks: payload.facultyRemarks,
      source: 'advisor_manual',
    };

    setInterventions((prev) => [newItem, ...prev]);
    setPreselectedPlanStudentId(null);
    showToast(`Created improvement plan "${payload.title}" for ${stu.name}.`);
  };

  const handleCreatePlanForStudent = (studentId: string) => {
    setPreselectedPlanStudentId(studentId);
    setActiveScreen('interventions');
  };

  const handleAddCaseNote = (studentId: string, body: string) => {
    setStudents((prev) =>
      prev.map((stu) => {
        if (stu.id !== studentId) return stu;
        return {
          ...stu,
          caseNotes: [
            {
              id: `note-${Date.now()}`,
              author: session.displayName,
              role:
                session.role === 'admin'
                  ? 'Institutional Admin'
                  : 'Faculty Mentor',
              createdAt: '13-11-2026',
              body,
            },
            ...stu.caseNotes,
          ],
        };
      })
    );
    showToast('Faculty mentoring note saved.');
  };

  const handleUpdateAcademicRecord = (
    studentId: string,
    payload: {
      attendanceRate: number;
      internalMarksAvg: number;
      missingAssignments: number;
      facultyId?: string;
    }
  ) => {
    setStudents((prev) =>
      prev.map((stu) => {
        if (stu.id !== studentId) return stu;
        const nextFaculty = payload.facultyId
          ? facultyList.find((f) => f.id === payload.facultyId)
          : undefined;
        const nextRiskScore = recalculateBaseRiskScoreFromRecord({
          attendanceRate: payload.attendanceRate,
          internalMarksAvg: payload.internalMarksAvg,
          missingAssignments: payload.missingAssignments,
          lmsInactiveDays: stu.lmsInactiveDays,
          engagementScore: stu.lmsEngagement,
        });
        const nextCompleted = Math.max(
          0,
          stu.assignmentsTotal - payload.missingAssignments
        );
        return {
          ...stu,
          attendanceRate: payload.attendanceRate,
          internalMarksAvg: payload.internalMarksAvg,
          missingAssignments: payload.missingAssignments,
          assignmentsCompleted: nextCompleted,
          gpa: Number(Math.min(9.95, Math.max(4.0, (payload.internalMarksAvg / 10) * 0.98)).toFixed(2)),
          riskScore: nextRiskScore,
          facultyId: nextFaculty ? nextFaculty.id : stu.facultyId,
          advisor: nextFaculty ? nextFaculty.name : stu.advisor,
        };
      })
    );
    showToast('Academic record updated and simulated risk recalculated.');
  };

  const handleAddStudent = (payload: {
    name: string;
    registerNumber: string;
    email: string;
    mobile: string;
    location: string;
    classId: string;
    department: string;
    classYear: Student['classYear'];
    semester: number;
    section: string;
    facultyId: string;
    attendanceRate: number;
    internalMarksAvg: number;
    missingAssignments: number;
  }) => {
    const cls = classes.find((c) => c.id === payload.classId) ?? classes[0];
    const assignedFaculty =
      facultyList.find((f) => f.id === payload.facultyId) ?? facultyList[0];
    if (!cls) return;

    const created = buildNewClassStudent({
      cls: {
        ...cls,
        assignedFacultyId: assignedFaculty?.id ?? cls.assignedFacultyId,
        assignedFacultyName: assignedFaculty?.name ?? cls.assignedFacultyName,
      },
      name: payload.name,
      registerNumber: payload.registerNumber,
      department: payload.department,
      classYear: payload.classYear,
      semester: payload.semester,
      section: payload.section,
      email: payload.email,
      mobile: payload.mobile,
      location: payload.location,
      attendanceRate: payload.attendanceRate,
      internalMarksAvg: payload.internalMarksAvg,
      missingAssignments: payload.missingAssignments,
    });

    setStudents((prev) => [created, ...prev]);
    showToast(`Added ${created.name} (${created.studentCode}) to ${cls.className}.`);
  };

  const handleAddFaculty = (payload: {
    name: string;
    email: string;
    mobile: string;
    location: string;
    department: string;
    title: string;
  }) => {
    const newFac: FacultyMember = {
      id: `fac-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      mobile: payload.mobile,
      location: payload.location,
      institution: 'Kongu Institute of Technology',
      department: payload.department,
      title: payload.title,
      status: 'active',
    };
    setFacultyList((prev) => [...prev, newFac]);
    showToast(`Added faculty member ${payload.name}.`);
  };

  const handleToggleFacultyStatus = (facultyId: string) => {
    setFacultyList((prev) =>
      prev.map((f) =>
        f.id === facultyId
          ? { ...f, status: f.status === 'active' ? 'on_leave' : 'active' }
          : f
      )
    );
    showToast('Updated faculty status.');
  };

  const handleAssignStudentToFaculty = (studentId: string, facultyId: string) => {
    const fac = facultyList.find((f) => f.id === facultyId);
    if (!fac) return;
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, facultyId: fac.id, advisor: fac.name } : s
      )
    );
    showToast(`Assigned student to ${fac.name}.`);
  };

  const handleToggleStudentActivity = (studentId: string, activityId: string) => {
    setStudents((prev) =>
      prev.map((stu) => {
        if (stu.id !== studentId) return stu;
        const nextActivities = stu.improvementActivities.map((act) =>
          act.id === activityId ? { ...act, completed: !act.completed } : act
        );
        return { ...stu, improvementActivities: nextActivities };
      })
    );
    showToast('Checklist item updated.');
  };

  const handleResetDemo = () => {
    setStudents(SEED_STUDENTS);
    setFacultyList(SEED_FACULTY);
    setClasses(SEED_CLASSES);
    setSubjects(SEED_SUBJECTS);
    setInterventions(SEED_INTERVENTIONS);
    setThresholds(DEFAULT_THRESHOLDS);
    setFacultyPrefs(DEFAULT_FACULTY_PREFS);
    setStudentTierFilter('all');
    setInspectedStudentId(null);
    setPreselectedPlanStudentId(null);
    showToast('Demo data restored to initial Tamil Nadu dataset.');
  };

  const navigateToStudents = (tier?: 'high' | 'medium' | 'low') => {
    setStudentTierFilter(tier ?? 'all');
    setActiveScreen('students');
    setMobileMenuOpen(false);
  };

  const openAcademicEntryForStudent = (studentId: string) => {
    const stu = students.find((s) => s.id === studentId);
    if (stu) setSelectedClassId(stu.classId);
    setSelectedEntryStudentId(studentId);
    setActiveScreen('fac_data_entry');
  };

  // Role-specific sidebar navigation
  const navItems: Array<{
    id: ScreenId;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: number;
  }> =
    session.role === 'admin'
      ? [
          { id: 'overview', label: 'Cohort Overview', icon: LayoutDashboard },
          {
            id: 'admin_classes',
            label: 'Classes & Subjects',
            icon: FolderKanban,
            badge: classes.length,
          },
          {
            id: 'students',
            label: 'Student Directory',
            icon: Users,
            badge: scopedStudents.length,
          },
          {
            id: 'faculty',
            label: 'Faculty & Depts',
            icon: Building2,
            badge: facultyList.length,
          },
          {
            id: 'interventions',
            label: 'Improvement Plans',
            icon: ClipboardCheck,
            badge: scopedInterventions.filter((i) => i.status !== 'completed')
              .length,
          },
          { id: 'reports', label: 'Reports', icon: FileBarChart2 },
          { id: 'rules', label: 'Alert Rules', icon: Sliders },
        ]
      : session.role === 'faculty'
        ? [
            { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
            {
              id: 'fac_classes',
              label: 'My Classes',
              icon: FolderKanban,
              badge: scopedClasses.length,
            },
            {
              id: 'fac_students',
              label: 'Student Management',
              icon: Users,
              badge: scopedStudents.length,
            },
            {
              id: 'fac_subjects',
              label: 'Subject Management',
              icon: BookOpen,
              badge: scopedSubjects.length,
            },
            {
              id: 'fac_data_entry',
              label: 'Academic Data Entry',
              icon: FileSpreadsheet,
            },
            {
              id: 'fac_risk_analysis',
              label: 'AI Risk Analysis',
              icon: ShieldAlert,
            },
            {
              id: 'interventions',
              label: 'Improvement Plans',
              icon: ClipboardCheck,
              badge: scopedInterventions.filter((i) => i.status !== 'completed')
                .length,
            },
            { id: 'reports', label: 'Reports', icon: FileBarChart2 },
            { id: 'fac_profile', label: 'Profile', icon: UserCircle2 },
            { id: 'fac_settings', label: 'Settings', icon: Settings },
          ]
        : [
            { id: 'student_pulse', label: 'My Academic Pulse', icon: Activity },
            {
              id: 'student_plan',
              label: 'Improvement Plan',
              icon: ListChecks,
              badge:
                scopedStudents[0]?.improvementActivities.filter(
                  (a) => !a.completed
                ).length ?? 0,
            },
            { id: 'student_history', label: 'Progress & History', icon: History },
          ];

  const meta = SCREEN_META[activeScreen] ?? SCREEN_META.overview;
  const pageTitle =
    session.role === 'faculty' && activeScreen === 'overview'
      ? 'Faculty Dashboard'
      : meta.title;

  const loggedInStudent = scopedStudents[0] ?? students[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-[#E2E8F0]">
        <div className="h-16 px-5 flex items-center border-b border-[#F1F5F9]">
          <BrandLogo size="md" />
        </div>

        <nav aria-label="Primary Sidebar" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveScreen(item.id)}
                className={`w-full flex items-center justify-between gap-2.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                    : 'text-[#434655] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                <span className="flex items-center gap-2.5 whitespace-nowrap truncate">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {typeof item.badge === 'number' && (
                  <span
                    className={`tabular-nums text-xs font-semibold shrink-0 ${
                      isActive ? 'text-[#2563EB]' : 'text-[#64748B]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#F1F5F9] space-y-2.5">
          <div className="px-2">
            <p className="text-xs font-semibold text-[#0F172A] truncate">
              {session.displayName}
            </p>
            <p className="text-[11px] text-[#434655] truncate">
              {session.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5 text-[#434655]" aria-hidden="true" />
            <span>Sign Out</span>
          </button>

          {session.role === 'admin' && (
            <button
              type="button"
              onClick={handleResetDemo}
              className="w-full rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] px-3 py-1.5 text-[11px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              Reset Demo Dataset
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#0F172A]/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-[82vw] bg-white h-full border-r border-[#E2E8F0] flex flex-col z-10">
            <div className="h-16 px-4 flex items-center justify-between border-b border-[#F1F5F9]">
              <BrandLogo size="sm" />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-1.5 rounded-lg text-[#434655] hover:text-[#0F172A]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Mobile Navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeScreen === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveScreen(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 rounded-lg px-3.5 py-2 text-sm font-medium ${
                      isActive
                        ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                        : 'text-[#434655] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span className="flex items-center gap-3 truncate">
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {typeof item.badge === 'number' && (
                      <span className="tabular-nums text-xs shrink-0">{item.badge}</span>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-[#F1F5F9] space-y-2">
              <p className="text-xs font-semibold text-[#0F172A]">
                {session.displayName}
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-semibold text-[#0F172A]"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur border-b border-[#E2E8F0] px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden rounded-lg border border-[#E2E8F0] p-2 text-[#0F172A]"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="sm:hidden font-display font-bold text-[#0F172A] whitespace-nowrap">
                EduPulse AI
              </span>
              <span className="hidden sm:inline text-[#64748B] whitespace-nowrap">
                {session.role === 'admin'
                  ? 'Admin Portal'
                  : session.role === 'faculty'
                    ? 'Faculty Portal'
                    : 'Student Portal'}
              </span>
              <span className="hidden sm:inline text-[#CBD5E1]" aria-hidden="true">
                /
              </span>
              <span className="hidden sm:inline font-semibold text-[#0F172A] truncate">
                {pageTitle}
              </span>
              <span className="hidden md:inline text-[#CBD5E1]" aria-hidden="true">
                ·
              </span>
              <span className="hidden md:inline text-xs text-[#434655] whitespace-nowrap tabular-nums">
                2026–2027 · Odd Sem · Week 10
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {session.role === 'student' ? (
              <button
                type="button"
                onClick={() => setActiveScreen('student_plan')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] px-3.5 sm:px-4 py-2 text-xs font-semibold text-white transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sm:hidden">My Plan</span>
                <span className="hidden sm:inline">View Improvement Plan</span>
              </button>
            ) : session.role === 'faculty' ? (
              <button
                type="button"
                onClick={() =>
                  setActiveScreen(
                    activeScreen === 'fac_risk_analysis'
                      ? 'interventions'
                      : 'fac_risk_analysis'
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] px-3.5 sm:px-4 py-2 text-xs font-semibold text-white transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sm:hidden">
                  {activeScreen === 'fac_risk_analysis' ? 'Plans' : 'Risk View'}
                </span>
                <span className="hidden sm:inline">
                  {activeScreen === 'fac_risk_analysis'
                    ? 'Open Improvement Plans'
                    : 'Run AI Risk Analysis'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (activeScreen === 'overview') {
                    navigateToStudents('high');
                  } else {
                    handleLaunchBatchHighRisk();
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] px-3.5 sm:px-4 py-2 text-xs font-semibold text-white transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sm:hidden">
                  {activeScreen === 'overview' ? 'High-Risk' : 'Batch Assign'}
                </span>
                <span className="hidden sm:inline">
                  {activeScreen === 'overview'
                    ? 'Review High-Risk Queue'
                    : 'Assign AI Improvement Plans'}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Page Heading + Main View */}
        <main className="flex-1 px-4 sm:px-8 py-6 max-w-[1400px] w-full mx-auto space-y-6">
          <div>
            <h1 className="font-display text-2xl sm:text-[28px] font-bold leading-9 text-[#0F172A]">
              {pageTitle}
            </h1>
            <p className="mt-1 text-sm text-[#434655] max-w-[72ch]">
              {meta.subtitle}
            </p>
          </div>

          {/* ADMIN VIEWS */}
          {session.role === 'admin' && activeScreen === 'overview' && (
            <OverviewScreen
              students={scopedStudents}
              interventions={scopedInterventions}
              thresholds={thresholds}
              weeklySeries={COHORT_WEEKLY_SERIES}
              bottlenecks={COURSE_BOTTLENECKS}
              onInspectStudent={(id) => setInspectedStudentId(id)}
              onAssignAiPathway={(id) =>
                assignAiPathwaysForIds([id], 'ai_recommended')
              }
              onLaunchBatchHighRisk={handleLaunchBatchHighRisk}
              onNavigateToStudents={navigateToStudents}
            />
          )}

          {session.role === 'admin' && activeScreen === 'admin_classes' && (
            <AdminClassesScreen
              classes={classes}
              subjects={subjects}
              students={students}
              thresholds={thresholds}
              onInspectStudent={(id) => setInspectedStudentId(id)}
            />
          )}

          {session.role === 'admin' && activeScreen === 'faculty' && (
            <FacultyManagementScreen
              facultyList={facultyList}
              classes={classes}
              students={students}
              interventions={interventions}
              thresholds={thresholds}
              onAddFaculty={handleAddFaculty}
              onToggleFacultyStatus={handleToggleFacultyStatus}
              onAssignStudentToFaculty={handleAssignStudentToFaculty}
            />
          )}

          {session.role === 'admin' && activeScreen === 'rules' && (
            <AlertRulesScreen
              thresholds={thresholds}
              students={students}
              onApplyThresholds={(next) => {
                setThresholds(next);
                showToast('Early-warning thresholds updated across institution.');
              }}
            />
          )}

          {/* FACULTY VIEWS (10-item structured workflow) */}
          {session.role === 'faculty' && activeScreen === 'overview' && (
            <FacultyOverviewScreen
              facultyName={session.displayName}
              classes={scopedClasses}
              subjects={scopedSubjects}
              students={scopedStudents}
              interventions={scopedInterventions}
              thresholds={thresholds}
              onInspectStudent={(id) => setInspectedStudentId(id)}
              onAssignAiPathway={(id) =>
                assignAiPathwaysForIds([id], 'ai_recommended')
              }
              onNavigate={(screen) => setActiveScreen(screen)}
            />
          )}

          {session.role === 'faculty' &&
            activeScreen === 'fac_classes' &&
            currentFaculty && (
              <FacultyClassesScreen
                faculty={currentFaculty}
                facultyList={facultyList}
                classes={scopedClasses}
                students={scopedStudents}
                subjects={scopedSubjects}
                thresholds={thresholds}
                selectedClassId={activeFacultyClassId}
                onSelectClassAndOpenStudents={(classId) => {
                  setSelectedClassId(classId);
                  setActiveScreen('fac_students');
                }}
                onCreateClass={handleCreateClass}
                onUpdateClass={handleUpdateClass}
              />
            )}

          {session.role === 'faculty' && activeScreen === 'fac_students' && (
            <FacultyStudentManagementScreen
              classes={scopedClasses}
              selectedClassId={activeFacultyClassId}
              onSelectClass={(classId) => setSelectedClassId(classId)}
              students={scopedStudents}
              thresholds={thresholds}
              onAddStudentToClass={handleAddStudentToClass}
              onUpdateStudentInfo={handleUpdateStudentInfo}
              onRemoveStudent={handleRemoveStudent}
              onImportStudentsCsv={handleImportStudentsCsv}
              onOpenAcademicEntry={openAcademicEntryForStudent}
              onGoToSubjects={() => setActiveScreen('fac_subjects')}
            />
          )}

          {session.role === 'faculty' &&
            activeScreen === 'fac_subjects' &&
            currentFaculty && (
              <FacultySubjectManagementScreen
                faculty={currentFaculty}
                facultyList={facultyList}
                classes={scopedClasses}
                selectedClassId={activeFacultyClassId}
                onSelectClass={(classId) => setSelectedClassId(classId)}
                subjects={scopedSubjects}
                onAddSubject={handleAddSubject}
                onUpdateSubject={handleUpdateSubject}
                onRemoveSubject={handleRemoveSubject}
                onProceedToAcademicEntry={() => setActiveScreen('fac_data_entry')}
              />
            )}

          {session.role === 'faculty' && activeScreen === 'fac_data_entry' && (
            <FacultyAcademicEntryScreen
              classes={scopedClasses}
              selectedClassId={activeFacultyClassId}
              onSelectClass={(classId) => setSelectedClassId(classId)}
              students={scopedStudents}
              selectedStudentId={selectedEntryStudentId}
              onSelectStudent={(stuId) => setSelectedEntryStudentId(stuId)}
              thresholds={thresholds}
              onSaveSubjectRecord={handleSaveSubjectRecord}
              onGoToRiskAnalysis={() => setActiveScreen('fac_risk_analysis')}
            />
          )}

          {session.role === 'faculty' && activeScreen === 'fac_risk_analysis' && (
            <FacultyRiskAnalysisScreen
              classes={scopedClasses}
              selectedClassId={activeFacultyClassId}
              onSelectClass={(classId) => setSelectedClassId(classId)}
              students={scopedStudents}
              thresholds={thresholds}
              onCreatePlanForStudent={handleCreatePlanForStudent}
              onOpenAcademicEntry={openAcademicEntryForStudent}
            />
          )}

          {session.role === 'faculty' &&
            activeScreen === 'fac_profile' &&
            currentFaculty && (
              <FacultyProfileScreen
                faculty={currentFaculty}
                classes={scopedClasses}
                students={scopedStudents}
              />
            )}

          {session.role === 'faculty' && activeScreen === 'fac_settings' && (
            <FacultySettingsScreen
              prefs={facultyPrefs}
              onSavePrefs={(next) => {
                setFacultyPrefs(next);
                showToast('Saved faculty mentoring & alert preferences.');
              }}
            />
          )}

          {/* SHARED ADMIN & FACULTY SCREENS */}
          {session.role === 'admin' && activeScreen === 'students' && (
            <StudentsScreen
              role={session.role}
              students={scopedStudents}
              classes={classes}
              facultyList={facultyList}
              interventions={scopedInterventions}
              thresholds={thresholds}
              tierFilter={studentTierFilter}
              onTierFilterChange={setStudentTierFilter}
              onInspectStudent={(id) => setInspectedStudentId(id)}
              onBatchAssignPathway={(ids) =>
                assignAiPathwaysForIds(ids, 'batch_rule')
              }
              onAddStudent={handleAddStudent}
            />
          )}

          {session.role !== 'student' && activeScreen === 'interventions' && (
            <InterventionsScreen
              interventions={scopedInterventions}
              students={scopedStudents}
              preselectedStudentId={preselectedPlanStudentId}
              onClearPreselectedStudent={() => setPreselectedPlanStudentId(null)}
              onAdvanceStatus={handleAdvanceInterventionStatus}
              onUpdateRemarks={handleUpdateInterventionRemarks}
              onCreateIntervention={handleCreateIntervention}
              onInspectStudent={(id) => setInspectedStudentId(id)}
            />
          )}

          {session.role !== 'student' && activeScreen === 'reports' && (
            <ReportsScreen
              role={session.role}
              classes={scopedClasses}
              students={scopedStudents}
              facultyList={
                session.role === 'admin'
                  ? facultyList
                  : currentFaculty
                    ? [currentFaculty]
                    : facultyList
              }
              interventions={scopedInterventions}
              thresholds={thresholds}
              weeklySeries={COHORT_WEEKLY_SERIES}
            />
          )}

          {/* STUDENT VIEWS */}
          {session.role === 'student' && loggedInStudent && (
            <StudentDashboard
              student={loggedInStudent}
              interventions={scopedInterventions}
              thresholds={thresholds}
              activeTab={activeScreen}
              onToggleActivity={handleToggleStudentActivity}
              onNavigate={(screen) => setActiveScreen(screen)}
            />
          )}
        </main>
      </div>

      {/* Student Detail & Simulated Risk Drawer (Admin & Faculty) */}
      {session.role !== 'student' && (
        <StudentDetailDrawer
          role={session.role}
          student={inspectedStudent}
          facultyList={facultyList}
          interventions={scopedInterventions}
          thresholds={thresholds}
          onClose={() => setInspectedStudentId(null)}
          onAssignAiPathway={(id) =>
            assignAiPathwaysForIds([id], 'ai_recommended')
          }
          onAddCaseNote={handleAddCaseNote}
          onUpdateAcademicRecord={handleUpdateAcademicRecord}
        />
      )}

      {/* Action Confirmation Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 rounded-xl bg-[#0F172A] text-white px-4 py-3 text-xs font-medium shadow-lg border border-[#1E293B]"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
