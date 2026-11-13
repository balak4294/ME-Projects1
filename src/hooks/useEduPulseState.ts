import { useEffect, useState } from 'react';
import {
  SEED_CLASSES,
  SEED_FACULTY,
  SEED_INTERVENTIONS,
  SEED_STUDENTS,
  SEED_SUBJECTS,
} from '../data/seedData';
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
} from '../types/edupredict';
import {
  clamp,
  computeSubjectBottlenecks,
  createBaselineSubjectRecords,
  DEFAULT_THRESHOLDS,
  formatDateDDMMYYYY,
  getScopedClassesForFaculty,
  getScopedStudentsForRole,
  getStudentRiskSummary,
  parseStudentCsvImport,
  reassignSubjectAcrossClasses,
  recalculateBaseRiskScoreFromRecord,
  recalculateStudentFromSubjectRecords,
  removeSubjectFromClass,
  semesterToYearOfStudy,
  validateAuthSession,
} from '../utils/riskEngine';

const STORAGE_KEY = 'edupulse_tn_state_v2';

const DEFAULT_FACULTY_PREFS: FacultyNotificationPrefs = {
  emailAlertsForHighRisk: true,
  attendanceWarningThreshold: 75,
  internalMarksWarningThreshold: 60,
  weeklyClassSummaryDigest: true,
};

interface PersistedState {
  session: AuthSession | null;
  activeScreen?: ScreenId;
  students: Student[];
  facultyList: FacultyMember[];
  classes: AcademicClass[];
  subjects: SubjectItem[];
  interventions: Intervention[];
  thresholds: RiskThresholds;
  facultyPrefs: FacultyNotificationPrefs;
}

const ROLE_ALLOWED_SCREENS: Record<UserRole, ScreenId[]> = {
  admin: ['overview', 'admin_classes', 'students', 'faculty', 'interventions', 'reports', 'rules'],
  faculty: [
    'overview',
    'fac_classes',
    'fac_students',
    'fac_subjects',
    'fac_data_entry',
    'fac_risk_analysis',
    'interventions',
    'reports',
    'fac_profile',
    'fac_settings',
  ],
  student: ['student_pulse', 'student_plan', 'student_history'],
};

export function defaultScreenForRole(role: UserRole): ScreenId {
  if (role === 'student') return 'student_pulse';
  return 'overview';
}

function resolveScreenForRole(role: UserRole, screen?: ScreenId): ScreenId {
  if (screen && ROLE_ALLOWED_SCREENS[role].includes(screen)) {
    return screen;
  }
  return defaultScreenForRole(role);
}

function loadInitialState(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        session: null,
        activeScreen: 'overview',
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
    const students =
      Array.isArray(parsed.students) && parsed.students.length > 0
        ? parsed.students
        : SEED_STUDENTS;
    const facultyList =
      Array.isArray(parsed.facultyList) && parsed.facultyList.length > 0
        ? parsed.facultyList
        : SEED_FACULTY;
    const classes =
      Array.isArray(parsed.classes) && parsed.classes.length > 0
        ? parsed.classes
        : SEED_CLASSES;
    const subjects =
      Array.isArray(parsed.subjects) && parsed.subjects.length > 0
        ? parsed.subjects
        : SEED_SUBJECTS;
    const validatedSession = validateAuthSession(
      parsed.session,
      facultyList,
      students
    );

    return {
      session: validatedSession,
      activeScreen: validatedSession
        ? resolveScreenForRole(validatedSession.role, parsed.activeScreen)
        : 'overview',
      students,
      facultyList,
      classes,
      subjects,
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
      activeScreen: 'overview',
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

export function useEduPulseState() {
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
    initial.session
      ? resolveScreenForRole(initial.session.role, initial.activeScreen)
      : 'overview'
  );
  const [studentTierFilter, setStudentTierFilter] = useState<'all' | RiskTier>(
    'all'
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    if (initial.session?.role === 'faculty') {
      const facCls = getScopedClassesForFaculty(
        initial.classes,
        initial.session.userId
      );
      return facCls[0]?.id ?? initial.classes[0]?.id ?? 'cls-cse-2a';
    }
    return initial.classes[0]?.id ?? 'cls-cse-2a';
  });
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
          activeScreen,
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
    activeScreen,
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
    }, 3400);
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
      } else {
        setSelectedClassId('');
      }
    }
    showToast(`Signed in as ${nextSession.displayName}`);
  };

  const handleSignOut = () => {
    setSession(null);
    setActiveScreen('overview');
    setStudentTierFilter('all');
    setInspectedStudentId(null);
    setPreselectedPlanStudentId(null);
    setMobileMenuOpen(false);
  };

  const currentFaculty =
    session?.role === 'faculty'
      ? facultyList.find((f) => f.id === session.userId) ?? facultyList[0]
      : facultyList[0];

  const scopedClasses =
    session?.role === 'faculty'
      ? getScopedClassesForFaculty(classes, session.userId)
      : classes;

  const scopedClassIds = new Set(scopedClasses.map((c) => c.id));

  const scopedStudents = !session
    ? []
    : session.role === 'faculty'
      ? students.filter(
          (s) => s.facultyId === session.userId || scopedClassIds.has(s.classId)
        )
      : getScopedStudentsForRole(students, session.role, session.userId);

  const scopedStudentIds = new Set(scopedStudents.map((s) => s.id));
  const scopedSubjects =
    session?.role === 'faculty'
      ? subjects.filter(
          (sub) =>
            scopedClassIds.has(sub.classId) ||
            sub.assignedFacultyId === session.userId
        )
      : subjects;

  const scopedInterventions = !session
    ? []
    : session.role === 'admin'
      ? interventions
      : interventions.filter(
          (i) =>
            scopedStudentIds.has(i.studentId) ||
            (session.role === 'faculty' && i.facultyId === session.userId)
        );

  const inspectedStudent =
    scopedStudents.find((stu) => stu.id === inspectedStudentId) ?? null;

  const activeFacultyClassId = scopedClasses.some((c) => c.id === selectedClassId)
    ? selectedClassId
    : scopedClasses[0]?.id ?? '';

  const subjectBottlenecks = computeSubjectBottlenecks(
    scopedStudents,
    scopedSubjects,
    thresholds
  );

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
        facultyRemarks:
          'Assigned via simulated risk workflow; initial check-in scheduled.',
        source,
      });
    }

    if (created.length === 0) {
      showToast(
        'Selected students already have pending or in-progress improvement plans.'
      );
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

  // --- Class Management ---
  const handleCreateClass = (payload: Omit<AcademicClass, 'id'>) => {
    const ownerFaculty =
      session?.role === 'faculty' && currentFaculty ? currentFaculty : null;
    const newClass: AcademicClass = {
      ...payload,
      assignedFacultyId: ownerFaculty
        ? ownerFaculty.id
        : payload.assignedFacultyId,
      assignedFacultyName: ownerFaculty
        ? ownerFaculty.name
        : payload.assignedFacultyName,
      id: `cls-${Date.now()}`,
    };
    setClasses((prev) => [newClass, ...prev]);
    setSelectedClassId(newClass.id);
    showToast(`Created class "${newClass.className}" under ${newClass.assignedFacultyName}.`);
  };

  const handleUpdateClass = (
    classId: string,
    payload: Omit<AcademicClass, 'id'>
  ) => {
    const existingClass = classes.find((c) => c.id === classId);
    const lockedPayload =
      session?.role === 'faculty' && existingClass
        ? {
            ...payload,
            assignedFacultyId: existingClass.assignedFacultyId,
            assignedFacultyName: existingClass.assignedFacultyName,
          }
        : payload;

    setClasses((prev) =>
      prev.map((c) => (c.id === classId ? { ...lockedPayload, id: classId } : c))
    );
    setStudents((prev) =>
      prev.map((s) =>
        s.classId === classId
          ? {
              ...s,
              className: lockedPayload.className,
              department: lockedPayload.department,
              semester: lockedPayload.semester,
              section: lockedPayload.section,
              batch: lockedPayload.batch,
              classYear: semesterToYearOfStudy(lockedPayload.semester),
              facultyId: lockedPayload.assignedFacultyId,
              advisor: lockedPayload.assignedFacultyName,
            }
          : s
      )
    );
    showToast(`Updated class "${lockedPayload.className}".`);
  };

  // Admin-only class reassignment between faculty members
  const handleReassignClassFaculty = (
    classId: string,
    targetFacultyId: string
  ) => {
    const targetFac = facultyList.find((f) => f.id === targetFacultyId);
    const cls = classes.find((c) => c.id === classId);
    if (!targetFac || !cls) return;

    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId
          ? {
              ...c,
              assignedFacultyId: targetFac.id,
              assignedFacultyName: targetFac.name,
            }
          : c
      )
    );
    setSubjects((prev) =>
      prev.map((sub) =>
        sub.classId === classId && sub.assignedFacultyId === cls.assignedFacultyId
          ? {
              ...sub,
              assignedFacultyId: targetFac.id,
              assignedFacultyName: targetFac.name,
            }
          : sub
      )
    );
    setStudents((prev) =>
      prev.map((s) =>
        s.classId === classId
          ? { ...s, facultyId: targetFac.id, advisor: targetFac.name }
          : s
      )
    );
    setInterventions((prev) =>
      prev.map((item) =>
        item.classId === classId
          ? { ...item, facultyId: targetFac.id, advisor: targetFac.name }
          : item
      )
    );
    showToast(`Reassigned "${cls.className}" to ${targetFac.name}.`);
  };

  // --- Student Management & CSV Import ---
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
    const att = clamp(params.attendanceRate ?? 82, 0, 100);
    const marks = clamp(params.internalMarksAvg ?? 75, 0, 100);
    const missing = clamp(params.missingAssignments ?? 1, 0, 15);
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
      gpa: clamp(Number(((marks / 10) * 0.98).toFixed(2)), 4.0, 9.95),
      gpaDelta: 0,
      internalMarksAvg: marks,
      attendanceRate: att,
      lmsEngagement: Math.max(40, att - 5),
      lmsInactiveDays: att < 75 ? 6 : 2,
      assignmentsCompleted: 4,
      assignmentsTotal: 5,
      missingAssignments: missing,
      creditsEnrolled: classSubjects.reduce((s, c) => s + c.credits, 0),
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
      historicalSubjectRecords: [],
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
        rationale:
          'Establish regular IA & attendance cadence across class subjects.',
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
    showToast(
      `Added ${newStudent.name} (${newStudent.studentCode}) to ${cls.className}.`
    );
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
    const stu = students.find((s) => s.id === studentId);
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setInterventions((prev) => prev.filter((i) => i.studentId !== studentId));
    if (inspectedStudentId === studentId) setInspectedStudentId(null);
    showToast(
      stu ? `Removed ${stu.name} from class roster.` : 'Removed student from class roster.'
    );
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

  // --- Subject Management ---
  const handleAddSubject = (payload: Omit<SubjectItem, 'id'>) => {
    const newSub: SubjectItem = {
      ...payload,
      id: `sub-${Date.now()}`,
    };
    setSubjects((prev) => [...prev, newSub]);

    setStudents((prev) =>
      prev.map((stu) => {
        if (stu.classId !== payload.classId) return stu;
        const [baseline] = createBaselineSubjectRecords(
          [newSub],
          stu.subjectRecords.length > 0 ? stu.attendanceRate : 82,
          stu.subjectRecords.length > 0 ? stu.internalMarksAvg : 75,
          0
        );
        const nextRecords = [...stu.subjectRecords, baseline];
        return recalculateStudentFromSubjectRecords(stu, nextRecords);
      })
    );
    showToast(`Assigned ${newSub.code} – ${newSub.name} to class.`);
  };

  const handleUpdateSubject = (
    subjectId: string,
    payload: Omit<SubjectItem, 'id'>
  ) => {
    const result = reassignSubjectAcrossClasses({
      subjectId,
      updatedSubject: payload,
      subjects,
      students,
      classes,
      archivedAt: '13-11-2026',
    });
    setSubjects(result.subjects);
    setStudents(result.students);

    if (result.movedBetweenClasses) {
      const targetCls = classes.find((c) => c.id === payload.classId);
      showToast(
        `Moved ${payload.code} – ${payload.name} to ${
          targetCls?.className ?? 'target class'
        } (${result.archivedCount} prior records archived, ${
          result.enrolledCount
        } students initialized).`
      );
    } else {
      showToast(`Updated subject ${payload.code} – ${payload.name}.`);
    }
  };

  const handleRemoveSubject = (subjectId: string) => {
    const sub = subjects.find((s) => s.id === subjectId);
    const result = removeSubjectFromClass({
      subjectId,
      subjects,
      students,
      classes,
      archivedAt: '13-11-2026',
    });
    setSubjects(result.subjects);
    setStudents(result.students);
    showToast(
      sub
        ? `Removed ${sub.code} – ${sub.name} (${result.archivedCount} student records archived).`
        : 'Removed subject from class.'
    );
  };

  // --- Academic Data Entry ---
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

  // --- Improvement Plans ---
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
    if (!session) return;
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
    const safeAtt = clamp(payload.attendanceRate, 0, 100);
    const safeMarks = clamp(payload.internalMarksAvg, 0, 100);
    const safeMissing = clamp(payload.missingAssignments, 0, 15);

    setStudents((prev) =>
      prev.map((stu) => {
        if (stu.id !== studentId) return stu;
        const nextFaculty = payload.facultyId
          ? facultyList.find((f) => f.id === payload.facultyId)
          : undefined;
        const nextRiskScore = recalculateBaseRiskScoreFromRecord({
          attendanceRate: safeAtt,
          internalMarksAvg: safeMarks,
          missingAssignments: safeMissing,
          lmsInactiveDays: stu.lmsInactiveDays,
          engagementScore: stu.lmsEngagement,
        });
        const nextCompleted = Math.max(0, stu.assignmentsTotal - safeMissing);
        return {
          ...stu,
          attendanceRate: safeAtt,
          internalMarksAvg: safeMarks,
          missingAssignments: safeMissing,
          assignmentsCompleted: nextCompleted,
          gpa: clamp(
            Number(((safeMarks / 10) * 0.98).toFixed(2)),
            4.0,
            9.95
          ),
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
    showToast(
      `Added ${created.name} (${created.studentCode}) to ${cls.className}.`
    );
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

  const handleAssignStudentToFaculty = (
    studentId: string,
    facultyId: string
  ) => {
    const fac = facultyList.find((f) => f.id === facultyId);
    if (!fac) return;
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, facultyId: fac.id, advisor: fac.name } : s
      )
    );
    showToast(`Assigned student to ${fac.name}.`);
  };

  const handleToggleStudentActivity = (
    studentId: string,
    activityId: string
  ) => {
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
    setSelectedClassId(SEED_CLASSES[0].id);
    setSelectedEntryStudentId(SEED_STUDENTS[0].id);
    showToast('Demo data restored to initial 50-student Tamil Nadu dataset.');
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

  return {
    session,
    students,
    facultyList,
    classes,
    subjects,
    interventions,
    thresholds,
    facultyPrefs,
    activeScreen,
    setActiveScreen,
    studentTierFilter,
    setStudentTierFilter,
    selectedClassId,
    setSelectedClassId,
    selectedEntryStudentId,
    setSelectedEntryStudentId,
    preselectedPlanStudentId,
    setPreselectedPlanStudentId,
    inspectedStudentId,
    setInspectedStudentId,
    mobileMenuOpen,
    setMobileMenuOpen,
    toastMessage,
    showToast,
    currentFaculty,
    scopedClasses,
    scopedStudents,
    scopedSubjects,
    scopedInterventions,
    inspectedStudent,
    activeFacultyClassId,
    subjectBottlenecks,
    handleLogin,
    handleSignOut,
    assignAiPathwaysForIds,
    handleLaunchBatchHighRisk,
    handleCreateClass,
    handleUpdateClass,
    handleReassignClassFaculty,
    handleAddStudentToClass,
    handleUpdateStudentInfo,
    handleRemoveStudent,
    handleImportStudentsCsv,
    handleAddSubject,
    handleUpdateSubject,
    handleRemoveSubject,
    handleSaveSubjectRecord,
    handleAdvanceInterventionStatus,
    handleUpdateInterventionRemarks,
    handleCreateIntervention,
    handleCreatePlanForStudent,
    handleAddCaseNote,
    handleUpdateAcademicRecord,
    handleAddStudent,
    handleAddFaculty,
    handleToggleFacultyStatus,
    handleAssignStudentToFaculty,
    handleToggleStudentActivity,
    handleResetDemo,
    setThresholds,
    setFacultyPrefs,
    navigateToStudents,
    openAcademicEntryForStudent,
  };
}
