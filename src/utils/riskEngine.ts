import type {
  AcademicClass,
  AuthSession,
  CourseBottleneck,
  DepartmentStats,
  FacultyMember,
  FacultyPerformance,
  HistoricalSubjectRecord,
  Intervention,
  RiskDriver,
  RiskThresholds,
  RiskTier,
  SimulationInput,
  Student,
  StudentSubjectRecord,
  SubjectItem,
  UserRole,
  YearOfStudy,
} from '../types/edupredict';

export const TN_DEPARTMENTS = [
  'Computer Science and Engineering (CSE)',
  'Information Technology (IT)',
  'Electronics and Communication Engineering (ECE)',
  'Electrical and Electronics Engineering (EEE)',
  'Mechanical Engineering (MECH)',
  'Civil Engineering',
  'Artificial Intelligence and Data Science (AI & DS)',
] as const;

export const TN_LOCATIONS = [
  'Coimbatore',
  'Chennai',
  'Tiruppur',
  'Erode',
  'Salem',
  'Madurai',
  'Tiruchirappalli',
] as const;

export const TN_INSTITUTIONS = [
  'Kongu Institute of Technology',
  'Sri Venkateswara College of Engineering',
  'Tamil Nadu Institute of Computer Science',
] as const;

export const DEFAULT_THRESHOLDS: RiskThresholds = {
  highRiskMinScore: 70,
  mediumRiskMinScore: 40,
  lmsInactivityAlertDays: 7,
  attendanceFloorPct: 75,
  autoFlagMissingAssignments: 3,
};

export function safeNumber(value: number, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function clamp(value: number, min: number, max: number): number {
  const safe = safeNumber(value, min);
  return Math.min(max, Math.max(min, safe));
}

export function formatDateDDMMYYYY(input: string): string {
  const trimmed = input.trim();
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [yyyy, mm, dd] = trimmed.split('-');
    return `${dd}-${mm}-${yyyy}`;
  }
  return trimmed;
}

export function toIsoDate(ddmmyyyy: string): string {
  const trimmed = ddmmyyyy.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    const [dd, mm, yyyy] = trimmed.split('-');
    return `${yyyy}-${mm}-${dd}`;
  }
  return '2026-11-25';
}

export function semesterToYearOfStudy(semester: number): YearOfStudy {
  if (semester <= 2) return 'I Year';
  if (semester <= 4) return 'II Year';
  if (semester <= 6) return 'III Year';
  return 'IV Year';
}

/**
 * Evaluates a student's effective simulated risk score taking into account
 * institutional early-warning triggers (inactivity, attendance floor, pending tasks).
 */
export function computeEffectiveRiskScore(
  student: Student,
  thresholds: RiskThresholds = DEFAULT_THRESHOLDS
): number {
  let score = clamp(safeNumber(student.riskScore, 50), 0, 100);
  const inactiveDays = Math.max(0, safeNumber(student.lmsInactiveDays, 0));
  const attendance = clamp(safeNumber(student.attendanceRate, 75), 0, 100);
  const missing = Math.max(0, safeNumber(student.missingAssignments, 0));

  if (inactiveDays >= thresholds.lmsInactivityAlertDays) {
    const excessDays = inactiveDays - thresholds.lmsInactivityAlertDays;
    score += Math.min(8, 2 + excessDays);
  }

  if (attendance < thresholds.attendanceFloorPct) {
    const deficit = thresholds.attendanceFloorPct - attendance;
    score += Math.min(10, Math.round(deficit * 0.4));
  }

  if (missing >= thresholds.autoFlagMissingAssignments) {
    const extra = missing - thresholds.autoFlagMissingAssignments;
    score += Math.min(8, 3 + extra * 2);
  }

  return clamp(Math.round(score), 0, 100);
}

/**
 * Recalculates a student's base risk score when academic records
 * (attendance, internal marks, missing assignments) are updated by Faculty or Admin.
 */
export function recalculateBaseRiskScoreFromRecord(params: {
  attendanceRate: number;
  internalMarksAvg: number;
  missingAssignments: number;
  lmsInactiveDays: number;
  engagementScore?: number;
}): number {
  const attendance = clamp(safeNumber(params.attendanceRate, 75), 0, 100);
  const marks = clamp(safeNumber(params.internalMarksAvg, 75), 0, 100);
  const missing = clamp(safeNumber(params.missingAssignments, 0), 0, 15);
  const lmsDays = clamp(safeNumber(params.lmsInactiveDays, 0), 0, 30);

  const attendancePenalty = Math.max(0, 95 - attendance) * 0.85;
  const marksPenalty = Math.max(0, 88 - marks) * 0.95;
  const missingPenalty = clamp(missing, 0, 10) * 5.2;
  const lmsPenalty = clamp(lmsDays, 0, 14) * 1.4;
  const engagementPenalty =
    typeof params.engagementScore === 'number' && Number.isFinite(params.engagementScore)
      ? Math.max(0, 75 - clamp(params.engagementScore, 0, 100)) * 0.25
      : 0;

  const raw =
    10 +
    attendancePenalty +
    marksPenalty +
    missingPenalty +
    lmsPenalty +
    engagementPenalty;
  return clamp(Math.round(raw), 0, 100);
}

export function computeRiskTier(
  score: number,
  thresholds: RiskThresholds = DEFAULT_THRESHOLDS
): RiskTier {
  if (score >= thresholds.highRiskMinScore) return 'high';
  if (score >= thresholds.mediumRiskMinScore) return 'medium';
  return 'low';
}

export function getStudentRiskSummary(
  student: Student,
  thresholds: RiskThresholds = DEFAULT_THRESHOLDS
): { effectiveScore: number; tier: RiskTier } {
  const effectiveScore = computeEffectiveRiskScore(student, thresholds);
  return {
    effectiveScore,
    tier: computeRiskTier(effectiveScore, thresholds),
  };
}

export function getScopedStudentsForRole(
  students: Student[],
  role: UserRole,
  userId: string
): Student[] {
  if (role === 'admin') return students;
  if (role === 'faculty') {
    return students.filter((stu) => stu.facultyId === userId);
  }
  return students.filter((stu) => stu.id === userId);
}

export function getScopedClassesForFaculty(
  classes: AcademicClass[],
  facultyId: string
): AcademicClass[] {
  return classes.filter((cls) => cls.assignedFacultyId === facultyId);
}

export function computeStudentAssignmentCompletionPct(student: Student): number {
  if (student.assignmentsTotal <= 0) return 100;
  return clamp(
    Math.round((student.assignmentsCompleted / student.assignmentsTotal) * 100),
    0,
    100
  );
}

/**
 * Recomputes derived percentages and averages on a single subject record.
 */
export function computeSubjectRecordMetrics(
  record: StudentSubjectRecord
): StudentSubjectRecord {
  const workingDays = Math.max(1, Math.round(safeNumber(record.totalWorkingDays, 40)));
  const present = clamp(Math.round(safeNumber(record.daysPresent, 0)), 0, workingDays);
  const absent = workingDays - present;
  const attendancePct = clamp(Math.round((present / workingDays) * 100), 0, 100);

  const ia1 = clamp(Math.round(safeNumber(record.ia1, 0)), 0, 100);
  const ia2 = clamp(Math.round(safeNumber(record.ia2, 0)), 0, 100);
  const ia3 = clamp(Math.round(safeNumber(record.ia3, 0)), 0, 100);
  const assignmentMarks = clamp(Math.round(safeNumber(record.assignmentMarks, 0)), 0, 100);
  const practicalMarks = clamp(Math.round(safeNumber(record.practicalMarks, 0)), 0, 100);

  const internalAvg = clamp(
    record.subjectType === 'Practical'
      ? Math.round(
          ia1 * 0.2 + ia2 * 0.2 + assignmentMarks * 0.2 + practicalMarks * 0.4
        )
      : Math.round((ia1 + ia2 + ia3) * 0.25 + assignmentMarks * 0.25),
    0,
    100
  );

  const assignments = Array.isArray(record.assignments) ? record.assignments : [];
  const totalAssign = assignments.length;
  const submittedCount = assignments.filter(
    (a) => a.status === 'Submitted' || a.status === 'Late'
  ).length;
  const assignmentCompletionPct =
    totalAssign > 0 ? Math.round((submittedCount / totalAssign) * 100) : 100;

  const classParticipation = clamp(Math.round(safeNumber(record.classParticipation, 70)), 0, 100);
  const engagementScore = clamp(
    Math.round(
      classParticipation * 0.45 +
        assignmentCompletionPct * 0.35 +
        attendancePct * 0.2
    ),
    0,
    100
  );

  return {
    ...record,
    totalWorkingDays: workingDays,
    daysPresent: present,
    daysAbsent: absent,
    attendancePct,
    ia1,
    ia2,
    ia3,
    assignmentMarks,
    practicalMarks,
    internalAvg,
    assignments,
    classParticipation,
    assignmentCompletionPct,
    engagementScore,
  };
}

/**
 * Aggregates subject-wise academic records back onto the parent Student object
 * and recalculates CGPA (10-point scale), risk score, and risk drivers.
 */
export function recalculateStudentFromSubjectRecords(
  student: Student,
  updatedRecords: StudentSubjectRecord[]
): Student {
  const normalizedRecords = updatedRecords.map(computeSubjectRecordMetrics);
  if (normalizedRecords.length === 0) {
    return {
      ...student,
      subjectRecords: [],
      subjectMarks: [],
      assignmentsCompleted: 0,
      assignmentsTotal: 0,
      missingAssignments: 0,
      creditsEnrolled: 0,
      riskDrivers: [
        {
          id: `drv-empty-${student.id}`,
          label: 'No active subjects currently assigned in class',
          impactPoints: 0,
          category: 'engagement',
          detail:
            'Assign at least one subject to this class to evaluate subject-wise attendance and IA marks.',
        },
      ],
    };
  }

  const count = normalizedRecords.length;
  const avgAttendance = Math.round(
    normalizedRecords.reduce((sum, r) => sum + r.attendancePct, 0) / count
  );
  const avgMarks = Math.round(
    normalizedRecords.reduce((sum, r) => sum + r.internalAvg, 0) / count
  );
  const avgEngagement = Math.round(
    normalizedRecords.reduce((sum, r) => sum + r.engagementScore, 0) / count
  );

  let assignmentsTotal = 0;
  let assignmentsCompleted = 0;
  for (const r of normalizedRecords) {
    assignmentsTotal += r.assignments.length;
    assignmentsCompleted += r.assignments.filter(
      (a) => a.status === 'Submitted' || a.status === 'Late'
    ).length;
  }
  const missingAssignments = Math.max(0, assignmentsTotal - assignmentsCompleted);

  const lmsInactiveDays =
    avgEngagement >= 80 ? 1 : avgEngagement >= 65 ? 4 : avgEngagement >= 50 ? 7 : 10;

  const nextRiskScore = recalculateBaseRiskScoreFromRecord({
    attendanceRate: avgAttendance,
    internalMarksAvg: avgMarks,
    missingAssignments,
    lmsInactiveDays,
    engagementScore: avgEngagement,
  });

  const cgpa = clamp(Number(((avgMarks / 10) * 0.98).toFixed(2)), 4.0, 9.95);

  const lowestAttSubject = [...normalizedRecords].sort(
    (a, b) => a.attendancePct - b.attendancePct
  )[0];
  const lowestMarkSubject = [...normalizedRecords].sort(
    (a, b) => a.internalAvg - b.internalAvg
  )[0];

  const drivers: RiskDriver[] = [];
  if (avgAttendance < 75 && lowestAttSubject) {
    drivers.push({
      id: `drv-att-${student.id}`,
      label: `Attendance below 75% in ${lowestAttSubject.subjectCode} (${lowestAttSubject.attendancePct}%)`,
      impactPoints: Math.min(28, Math.round((80 - avgAttendance) * 1.1)),
      category: 'attendance',
      detail: `Present ${lowestAttSubject.daysPresent} of ${lowestAttSubject.totalWorkingDays} working days in ${lowestAttSubject.subjectName}.`,
    });
  }
  if (avgMarks < 70 && lowestMarkSubject) {
    drivers.push({
      id: `drv-ia-${student.id}`,
      label: `Internal assessment dip in ${lowestMarkSubject.subjectCode} (${lowestMarkSubject.internalAvg}%)`,
      impactPoints: Math.min(26, Math.round((75 - avgMarks) * 1.05)),
      category: 'assessment',
      detail: `IA1: ${lowestMarkSubject.ia1}%, IA2: ${lowestMarkSubject.ia2}%, IA3: ${lowestMarkSubject.ia3}%.`,
    });
  }
  if (missingAssignments > 0) {
    drivers.push({
      id: `drv-task-${student.id}`,
      label: `${missingAssignments} pending assignment deliverable${missingAssignments > 1 ? 's' : ''}`,
      impactPoints: Math.min(22, missingAssignments * 5),
      category: 'engagement',
      detail: `Completed ${assignmentsCompleted} of ${assignmentsTotal} assigned tasks across semester subjects.`,
    });
  }
  if (drivers.length === 0) {
    drivers.push({
      id: `drv-ok-${student.id}`,
      label: 'Consistent attendance & internal assessment progression',
      impactPoints: 4,
      category: 'engagement',
      detail: `Academic engagement score at ${avgEngagement}/100 with ${avgAttendance}% attendance.`,
    });
  }

  const nextHistory = [
    ...student.weeklyRiskHistory.slice(0, 5),
    nextRiskScore,
  ];

  const creditsEnrolled = normalizedRecords.reduce((sum, r) => sum + r.credits, 0);

  return {
    ...student,
    attendanceRate: avgAttendance,
    internalMarksAvg: avgMarks,
    lmsEngagement: avgEngagement,
    lmsInactiveDays,
    assignmentsCompleted,
    assignmentsTotal,
    missingAssignments,
    creditsEnrolled,
    gpa: cgpa,
    riskScore: nextRiskScore,
    weeklyRiskHistory: nextHistory,
    riskDrivers: drivers,
    subjectRecords: normalizedRecords,
    subjectMarks: normalizedRecords.map((r) => ({
      courseCode: r.subjectCode,
      courseTitle: r.subjectName,
      internalMarks: r.internalAvg,
      attendanceRate: r.attendancePct,
      assignmentsDone: r.assignments.filter(
        (a) => a.status === 'Submitted' || a.status === 'Late'
      ).length,
      assignmentsTotal: r.assignments.length,
    })),
  };
}

export function createBaselineSubjectRecords(
  subjects: SubjectItem[],
  attendancePct = 82,
  internalMarks = 76,
  missingTasks = 1
): StudentSubjectRecord[] {
  return subjects.map((sub, idx) => {
    const workingDays = 40;
    const present = clamp(Math.round((attendancePct / 100) * workingDays), 0, workingDays);
    const pendingHere = idx === 0 ? Math.min(missingTasks, 2) : 0;
    return computeSubjectRecordMetrics({
      subjectId: sub.id,
      subjectCode: sub.code,
      subjectName: sub.name,
      subjectType: sub.type,
      credits: sub.credits,
      totalWorkingDays: workingDays,
      daysPresent: present,
      daysAbsent: workingDays - present,
      attendancePct,
      ia1: clamp(internalMarks - 2, 0, 100),
      ia2: clamp(internalMarks + 1, 0, 100),
      ia3: clamp(internalMarks, 0, 100),
      assignmentMarks: clamp(internalMarks + 2, 0, 100),
      practicalMarks: clamp(internalMarks + 4, 0, 100),
      internalAvg: internalMarks,
      assignments: [
        {
          id: `asg-${sub.id}-1-${Date.now()}-${idx}`,
          name: `${sub.code} Unit 1 & 2 Assignment`,
          status: pendingHere >= 1 ? 'Pending' : 'Submitted',
          submissionDate: pendingHere >= 1 ? '-' : '18-10-2026',
          marksObtained: pendingHere >= 1 ? 0 : clamp(internalMarks + 4, 0, 100),
          maxMarks: 100,
        },
        {
          id: `asg-${sub.id}-2-${Date.now()}-${idx}`,
          name: `${sub.code} Case Study / Lab Record`,
          status: pendingHere >= 2 ? 'Pending' : 'Submitted',
          submissionDate: pendingHere >= 2 ? '-' : '04-11-2026',
          marksObtained: pendingHere >= 2 ? 0 : clamp(internalMarks, 0, 100),
          maxMarks: 100,
        },
      ],
      classParticipation: clamp(attendancePct - 4, 30, 98),
      assignmentCompletionPct: pendingHere === 0 ? 100 : pendingHere === 1 ? 50 : 0,
      engagementScore: clamp(attendancePct - 3, 30, 98),
    });
  });
}

/**
 * Simulates projected student risk score given an academic recovery plan.
 */
export function simulateProjectedRisk(
  student: Student,
  input: SimulationInput,
  thresholds: RiskThresholds = DEFAULT_THRESHOLDS
): {
  baselineScore: number;
  projectedScore: number;
  projectedTier: RiskTier;
  delta: number;
} {
  const baselineScore = computeEffectiveRiskScore(student, thresholds);
  const attendanceGain = Math.max(0, input.targetAttendanceRate - student.attendanceRate);
  const attendanceReduction = attendanceGain * 0.65;
  const tutoringReduction = clamp(input.tutoringHoursPerWeek, 0, 8) * 3.5;
  const recovered = clamp(input.assignmentsRecovered, 0, student.missingAssignments);
  const assignmentReduction = recovered * 4.5;

  const totalReduction = attendanceReduction + tutoringReduction + assignmentReduction;
  const projectedScore = clamp(Math.round(baselineScore - totalReduction), 5, 99);

  return {
    baselineScore,
    projectedScore,
    projectedTier: computeRiskTier(projectedScore, thresholds),
    delta: projectedScore - baselineScore,
  };
}

export interface StudentFilters {
  query: string;
  tier: 'all' | RiskTier;
  department: string;
  advisor: string;
  classId?: string;
  performanceBand?: 'all' | 'needs_support' | 'satisfactory' | 'high_performing';
}

export function filterStudents(
  students: Student[],
  filters: StudentFilters,
  thresholds: RiskThresholds = DEFAULT_THRESHOLDS
): Student[] {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return students
    .filter((student) => {
      const { tier } = getStudentRiskSummary(student, thresholds);
      if (filters.tier !== 'all' && tier !== filters.tier) return false;
      if (filters.department !== 'all' && student.department !== filters.department) {
        return false;
      }
      if (filters.advisor !== 'all' && student.advisor !== filters.advisor) {
        return false;
      }
      if (filters.classId && filters.classId !== 'all' && student.classId !== filters.classId) {
        return false;
      }
      if (filters.performanceBand === 'needs_support' && student.internalMarksAvg >= 65) {
        return false;
      }
      if (
        filters.performanceBand === 'satisfactory' &&
        (student.internalMarksAvg < 65 || student.internalMarksAvg >= 80)
      ) {
        return false;
      }
      if (filters.performanceBand === 'high_performing' && student.internalMarksAvg < 80) {
        return false;
      }
      if (normalizedQuery.length > 0) {
        const haystack =
          `${student.name} ${student.studentCode} ${student.major} ${student.advisor} ${student.department} ${student.className}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }
      return true;
    })
    .sort(
      (a, b) =>
        computeEffectiveRiskScore(b, thresholds) -
        computeEffectiveRiskScore(a, thresholds)
    );
}

export interface CohortMetrics {
  totalStudents: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  activeInterventionsCount: number;
  completedInterventionsCount: number;
  predictedRetentionPct: number;
  avgAttendancePct: number;
  avgInternalMarksPct: number;
  unaddressedHighRiskCount: number;
}

export function computeCohortMetrics(
  students: Student[],
  interventions: Intervention[],
  thresholds: RiskThresholds = DEFAULT_THRESHOLDS
): CohortMetrics {
  let highRiskCount = 0;
  let mediumRiskCount = 0;
  let lowRiskCount = 0;
  let attendanceSum = 0;
  let marksSum = 0;
  let retentionWeightedRiskSum = 0;
  let unaddressedHighRiskCount = 0;

  const activeOrScheduledStudentIds = new Set(
    interventions
      .filter((item) => item.status === 'pending' || item.status === 'in_progress')
      .map((item) => item.studentId)
  );

  for (const student of students) {
    const { effectiveScore, tier } = getStudentRiskSummary(student, thresholds);
    attendanceSum += student.attendanceRate;
    marksSum += student.internalMarksAvg;

    const hasIntervention = activeOrScheduledStudentIds.has(student.id);
    const retentionRiskPenalty = hasIntervention ? effectiveScore * 0.45 : effectiveScore;
    retentionWeightedRiskSum += retentionRiskPenalty;

    if (tier === 'high') {
      highRiskCount += 1;
      if (!hasIntervention) {
        unaddressedHighRiskCount += 1;
      }
    } else if (tier === 'medium') {
      mediumRiskCount += 1;
    } else {
      lowRiskCount += 1;
    }
  }

  const total = students.length || 1;
  const studentIds = new Set(students.map((s) => s.id));
  const scopedInterventions = interventions.filter((item) =>
    studentIds.has(item.studentId)
  );

  const activeInterventionsCount = scopedInterventions.filter(
    (item) => item.status === 'pending' || item.status === 'in_progress'
  ).length;
  const completedInterventionsCount = scopedInterventions.filter(
    (item) => item.status === 'completed'
  ).length;

  const avgPenalty = retentionWeightedRiskSum / total;
  const predictedRetentionPct = Number(
    clamp(99 - avgPenalty * 0.28, 60, 99.4).toFixed(1)
  );
  const avgAttendancePct =
    students.length > 0 ? Number((attendanceSum / total).toFixed(1)) : 0;
  const avgInternalMarksPct =
    students.length > 0 ? Number((marksSum / total).toFixed(1)) : 0;

  return {
    totalStudents: students.length,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    activeInterventionsCount,
    completedInterventionsCount,
    predictedRetentionPct,
    avgAttendancePct,
    avgInternalMarksPct,
    unaddressedHighRiskCount,
  };
}

export function computeClassMetrics(
  cls: AcademicClass,
  students: Student[],
  subjects: SubjectItem[],
  thresholds: RiskThresholds = DEFAULT_THRESHOLDS
) {
  const enrolled = students.filter((s) => s.classId === cls.id);
  const classSubjects = subjects.filter((sub) => sub.classId === cls.id);
  let highRiskCount = 0;
  let mediumRiskCount = 0;
  let lowRiskCount = 0;
  let attSum = 0;
  let marksSum = 0;

  for (const stu of enrolled) {
    const { tier } = getStudentRiskSummary(stu, thresholds);
    if (tier === 'high') highRiskCount += 1;
    else if (tier === 'medium') mediumRiskCount += 1;
    else lowRiskCount += 1;
    attSum += stu.attendanceRate;
    marksSum += stu.internalMarksAvg;
  }

  const n = enrolled.length || 1;
  return {
    studentCount: enrolled.length,
    subjectCount: classSubjects.length,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    avgAttendance: enrolled.length > 0 ? Math.round(attSum / n) : 0,
    avgInternalMarks: enrolled.length > 0 ? Math.round(marksSum / n) : 0,
  };
}

export function computeDepartmentStats(
  students: Student[],
  classes: AcademicClass[] = [],
  thresholds: RiskThresholds = DEFAULT_THRESHOLDS
): DepartmentStats[] {
  const byDept = new Map<string, Student[]>();
  for (const stu of students) {
    const list = byDept.get(stu.department) ?? [];
    list.push(stu);
    byDept.set(stu.department, list);
  }
  for (const cls of classes) {
    if (!byDept.has(cls.department)) {
      byDept.set(cls.department, []);
    }
  }

  return Array.from(byDept.entries())
    .map(([department, list]) => {
      let highRiskCount = 0;
      let mediumRiskCount = 0;
      let lowRiskCount = 0;
      let gpaSum = 0;
      let attSum = 0;
      let marksSum = 0;

      for (const stu of list) {
        const { tier } = getStudentRiskSummary(stu, thresholds);
        if (tier === 'high') highRiskCount += 1;
        else if (tier === 'medium') mediumRiskCount += 1;
        else lowRiskCount += 1;

        gpaSum += stu.gpa;
        attSum += stu.attendanceRate;
        marksSum += stu.internalMarksAvg;
      }

      const n = list.length || 1;
      const deptClassCount = classes.filter(
        (c) => c.department === department
      ).length;
      return {
        department,
        studentCount: list.length,
        classCount: deptClassCount,
        avgGpa: list.length > 0 ? Number((gpaSum / n).toFixed(2)) : 0,
        avgAttendance: list.length > 0 ? Number((attSum / n).toFixed(1)) : 0,
        avgInternalMarks: list.length > 0 ? Number((marksSum / n).toFixed(1)) : 0,
        highRiskCount,
        mediumRiskCount,
        lowRiskCount,
      };
    })
    .sort(
      (a, b) =>
        b.highRiskCount - a.highRiskCount ||
        a.department.localeCompare(b.department)
    );
}

export function computeFacultyPerformance(
  facultyList: FacultyMember[],
  students: Student[],
  interventions: Intervention[],
  classes: AcademicClass[] = [],
  thresholds: RiskThresholds = DEFAULT_THRESHOLDS
): FacultyPerformance[] {
  return facultyList.map((faculty) => {
    const assigned = students.filter((s) => s.facultyId === faculty.id);
    const assignedIds = new Set(assigned.map((s) => s.id));
    const classCount = classes.filter(
      (c) => c.assignedFacultyId === faculty.id
    ).length;

    let highRiskCount = 0;
    let attSum = 0;
    let gpaSum = 0;
    for (const stu of assigned) {
      if (getStudentRiskSummary(stu, thresholds).tier === 'high') {
        highRiskCount += 1;
      }
      attSum += stu.attendanceRate;
      gpaSum += stu.gpa;
    }

    const facultyInterventions = interventions.filter(
      (i) => i.facultyId === faculty.id || assignedIds.has(i.studentId)
    );
    const activeInterventions = facultyInterventions.filter(
      (i) => i.status === 'pending' || i.status === 'in_progress'
    ).length;
    const completedInterventions = facultyInterventions.filter(
      (i) => i.status === 'completed'
    ).length;

    const n = assigned.length || 1;
    return {
      faculty,
      classCount,
      assignedCount: assigned.length,
      highRiskCount,
      avgAttendance: assigned.length > 0 ? Number((attSum / n).toFixed(1)) : 0,
      avgGpa: assigned.length > 0 ? Number((gpaSum / n).toFixed(2)) : 0,
      activeInterventions,
      completedInterventions,
    };
  });
}

export interface ParsedCsvStudentRow {
  name: string;
  registerNumber: string;
  email: string;
  mobile: string;
  location: string;
  attendanceRate: number;
  internalMarksAvg: number;
}

export function parseStudentCsvImport(csvText: string): ParsedCsvStudentRow[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const rows: ParsedCsvStudentRow[] = [];
  for (let i = 0; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    if (i === 0 && cols[0].toLowerCase().includes('name')) {
      continue;
    }
    if (cols.length < 2 || !cols[0]) continue;
    const name = cols[0];
    const registerNumber = cols[1] || `71172510${4100 + i}`;
    const email =
      cols[2] && cols[2].includes('@')
        ? cols[2]
        : `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@kongutech.edu.in`;
    const mobile = cols[3] || '+91 98422 50000';
    const location = cols[4] || 'Coimbatore';
    const attendanceRate = clamp(Number(cols[5]) || 80, 0, 100);
    const internalMarksAvg = clamp(Number(cols[6]) || 74, 0, 100);
    rows.push({
      name,
      registerNumber,
      email,
      mobile,
      location,
      attendanceRate,
      internalMarksAvg,
    });
  }
  return rows;
}

export function formatStudentCsv(
  students: Student[],
  thresholds: RiskThresholds = DEFAULT_THRESHOLDS
): string {
  const header = [
    'Register Number',
    'Student Name',
    'Class',
    'Department',
    'Semester',
    'Mobile',
    'CGPA (10)',
    'Internal Marks %',
    'Attendance %',
    'Engagement Score',
    'Simulated Risk Score',
    'Risk Tier',
    'Assigned Faculty',
  ].join(',');

  const rows = students.map((student) => {
    const { effectiveScore, tier } = getStudentRiskSummary(student, thresholds);
    const cells = [
      student.studentCode,
      `"${student.name.replaceAll('"', '""')}"`,
      `"${student.className.replaceAll('"', '""')}"`,
      `"${student.department.replaceAll('"', '""')}"`,
      `Sem ${student.semester}`,
      `"${student.mobile}"`,
      student.gpa.toFixed(2),
      `${student.internalMarksAvg}%`,
      `${student.attendanceRate}%`,
      `${student.lmsEngagement}%`,
      String(effectiveScore),
      tier.toUpperCase(),
      `"${student.advisor.replaceAll('"', '""')}"`,
    ];
    return cells.join(',');
  });

  return [header, ...rows].join('\n');
}

/**
 * Safely updates a subject or reassigns it from one class to another:
 * - Updates the subject item's classId and metadata
 * - Archives existing records from old-class students into historicalSubjectRecords
 * - Removes active subject mapping from old-class students and recalculates their risk
 * - Creates baseline records (or restores historical ones) for new-class students and recalculates their risk
 */
export function reassignSubjectAcrossClasses(params: {
  subjectId: string;
  updatedSubject: Omit<SubjectItem, 'id'>;
  subjects: SubjectItem[];
  students: Student[];
  classes: AcademicClass[];
  archivedAt?: string;
}): {
  subjects: SubjectItem[];
  students: Student[];
  movedBetweenClasses: boolean;
  archivedCount: number;
  enrolledCount: number;
} {
  const prevSubject = params.subjects.find((s) => s.id === params.subjectId);
  if (!prevSubject) {
    return {
      subjects: params.subjects,
      students: params.students,
      movedBetweenClasses: false,
      archivedCount: 0,
      enrolledCount: 0,
    };
  }

  const nextSubject: SubjectItem = {
    ...params.updatedSubject,
    id: params.subjectId,
  };
  const nextSubjects = params.subjects.map((s) =>
    s.id === params.subjectId ? nextSubject : s
  );

  const movedBetweenClasses = prevSubject.classId !== nextSubject.classId;
  const oldClass = params.classes.find((c) => c.id === prevSubject.classId);
  const archivedDate = params.archivedAt ?? '13-11-2026';

  let archivedCount = 0;
  let enrolledCount = 0;

  const nextStudents = params.students.map((stu) => {
    const existingRecord = stu.subjectRecords.find(
      (rec) => rec.subjectId === params.subjectId
    );

    if (!movedBetweenClasses) {
      if (stu.classId !== nextSubject.classId && !existingRecord) {
        return stu;
      }
      const nextRecords = stu.subjectRecords.map((rec) =>
        rec.subjectId === params.subjectId
          ? {
              ...rec,
              subjectCode: nextSubject.code,
              subjectName: nextSubject.name,
              subjectType: nextSubject.type,
              credits: nextSubject.credits,
            }
          : rec
      );
      return recalculateStudentFromSubjectRecords(stu, nextRecords);
    }

    // Case 1: Student belongs to old class (or still holds the moved subject outside target class)
    if (stu.classId !== nextSubject.classId) {
      if (!existingRecord) return stu;
      archivedCount += 1;
      const archivedEntry: HistoricalSubjectRecord = {
        ...existingRecord,
        archivedFromClassId: prevSubject.classId,
        archivedFromClassName: oldClass?.className ?? prevSubject.classId,
        archivedAt: archivedDate,
      };
      const prevHistory = Array.isArray(stu.historicalSubjectRecords)
        ? stu.historicalSubjectRecords
        : [];
      const filteredHistory = prevHistory.filter(
        (h) =>
          !(
            h.subjectId === archivedEntry.subjectId &&
            h.archivedFromClassId === archivedEntry.archivedFromClassId
          )
      );
      const remainingRecords = stu.subjectRecords.filter(
        (rec) => rec.subjectId !== params.subjectId
      );
      const recalculated = recalculateStudentFromSubjectRecords(stu, remainingRecords);
      return {
        ...recalculated,
        historicalSubjectRecords: [archivedEntry, ...filteredHistory],
      };
    }

    // Case 2: Student belongs to the target class (Class B)
    if (existingRecord) {
      const updatedRecords = stu.subjectRecords.map((rec) =>
        rec.subjectId === params.subjectId
          ? {
              ...rec,
              subjectCode: nextSubject.code,
              subjectName: nextSubject.name,
              subjectType: nextSubject.type,
              credits: nextSubject.credits,
            }
          : rec
      );
      return recalculateStudentFromSubjectRecords(stu, updatedRecords);
    }

    enrolledCount += 1;
    const prevHistory = Array.isArray(stu.historicalSubjectRecords)
      ? stu.historicalSubjectRecords
      : [];
    const restorable = prevHistory.find(
      (h) =>
        h.subjectId === params.subjectId &&
        h.archivedFromClassId === nextSubject.classId
    );
    const restoredOrBaseline: StudentSubjectRecord = restorable
      ? {
          subjectId: nextSubject.id,
          subjectCode: nextSubject.code,
          subjectName: nextSubject.name,
          subjectType: nextSubject.type,
          credits: nextSubject.credits,
          totalWorkingDays: restorable.totalWorkingDays,
          daysPresent: restorable.daysPresent,
          daysAbsent: restorable.daysAbsent,
          attendancePct: restorable.attendancePct,
          ia1: restorable.ia1,
          ia2: restorable.ia2,
          ia3: restorable.ia3,
          assignmentMarks: restorable.assignmentMarks,
          practicalMarks: restorable.practicalMarks,
          internalAvg: restorable.internalAvg,
          assignments: restorable.assignments,
          classParticipation: restorable.classParticipation,
          assignmentCompletionPct: restorable.assignmentCompletionPct,
          engagementScore: restorable.engagementScore,
        }
      : createBaselineSubjectRecords(
          [nextSubject],
          stu.subjectRecords.length > 0 ? stu.attendanceRate : 82,
          stu.subjectRecords.length > 0 ? stu.internalMarksAvg : 75,
          0
        )[0];

    const updatedStudent = recalculateStudentFromSubjectRecords(stu, [
      ...stu.subjectRecords,
      restoredOrBaseline,
    ]);
    return {
      ...updatedStudent,
      historicalSubjectRecords: restorable
        ? prevHistory.filter((h) => h !== restorable)
        : stu.historicalSubjectRecords,
    };
  });

  return {
    subjects: nextSubjects,
    students: nextStudents,
    movedBetweenClasses,
    archivedCount,
    enrolledCount,
  };
}

/**
 * Removes a subject from its class while archiving any existing student subject records
 * into historicalSubjectRecords so academic audit trails are preserved.
 */
export function removeSubjectFromClass(params: {
  subjectId: string;
  subjects: SubjectItem[];
  students: Student[];
  classes: AcademicClass[];
  archivedAt?: string;
}): {
  subjects: SubjectItem[];
  students: Student[];
  archivedCount: number;
} {
  const targetSubject = params.subjects.find((s) => s.id === params.subjectId);
  if (!targetSubject) {
    return { subjects: params.subjects, students: params.students, archivedCount: 0 };
  }
  const sourceClass = params.classes.find((c) => c.id === targetSubject.classId);
  const archivedDate = params.archivedAt ?? '13-11-2026';
  let archivedCount = 0;

  const nextSubjects = params.subjects.filter((s) => s.id !== params.subjectId);
  const nextStudents = params.students.map((stu) => {
    const existing = stu.subjectRecords.find((r) => r.subjectId === params.subjectId);
    if (!existing) return stu;
    archivedCount += 1;
    const archivedEntry: HistoricalSubjectRecord = {
      ...existing,
      archivedFromClassId: targetSubject.classId,
      archivedFromClassName: sourceClass?.className ?? targetSubject.classId,
      archivedAt: archivedDate,
    };
    const prevHistory = Array.isArray(stu.historicalSubjectRecords)
      ? stu.historicalSubjectRecords
      : [];
    const remaining = stu.subjectRecords.filter((r) => r.subjectId !== params.subjectId);
    const recalculated = recalculateStudentFromSubjectRecords(stu, remaining);
    return {
      ...recalculated,
      historicalSubjectRecords: [archivedEntry, ...prevHistory],
    };
  });

  return {
    subjects: nextSubjects,
    students: nextStudents,
    archivedCount,
  };
}

/**
 * Dynamically computes subject-level bottleneck risk metrics from live student records
 * across all departments so Admin analytics stay synchronized with data edits.
 */
export function computeSubjectBottlenecks(
  students: Student[],
  subjects: SubjectItem[],
  thresholds: RiskThresholds = DEFAULT_THRESHOLDS
): CourseBottleneck[] {
  const map = new Map<
    string,
    {
      courseCode: string;
      courseName: string;
      department: string;
      enrolled: number;
      atRiskCount: number;
    }
  >();

  for (const stu of students) {
    const { tier } = getStudentRiskSummary(stu, thresholds);
    for (const rec of stu.subjectRecords) {
      const existing = map.get(rec.subjectCode) ?? {
        courseCode: rec.subjectCode,
        courseName: rec.subjectName,
        department: stu.department,
        enrolled: 0,
        atRiskCount: 0,
      };
      existing.enrolled += 1;
      const subjectFlagged =
        rec.attendancePct < thresholds.attendanceFloorPct ||
        rec.internalAvg < 65 ||
        tier === 'high';
      if (subjectFlagged) {
        existing.atRiskCount += 1;
      }
      map.set(rec.subjectCode, existing);
    }
  }

  for (const sub of subjects) {
    if (!map.has(sub.code)) {
      map.set(sub.code, {
        courseCode: sub.code,
        courseName: sub.name,
        department: 'Institutional Cohort',
        enrolled: 0,
        atRiskCount: 0,
      });
    }
  }

  return Array.from(map.values())
    .filter((entry) => entry.enrolled > 0)
    .map((entry) => ({
      ...entry,
      dfwRate: Number(((entry.atRiskCount / Math.max(1, entry.enrolled)) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.dfwRate - a.dfwRate || b.atRiskCount - a.atRiskCount)
    .slice(0, 5);
}

/**
 * Validates a restored localStorage demo session against live faculty and student lists
 * to eliminate stale session state across browser refreshes.
 */
export function validateAuthSession(
  session: AuthSession | null | undefined,
  facultyList: FacultyMember[],
  students: Student[]
): AuthSession | null {
  if (!session || !session.role || !session.userId) return null;
  if (session.role === 'admin') {
    return session.email && session.email.includes('@') ? session : null;
  }
  if (session.role === 'faculty') {
    const fac = facultyList.find((f) => f.id === session.userId);
    if (!fac) return null;
    return {
      role: 'faculty',
      userId: fac.id,
      displayName: fac.name,
      subtitle: `${fac.department} · ${fac.title}`,
      email: fac.email,
    };
  }
  if (session.role === 'student') {
    const stu = students.find((s) => s.id === session.userId);
    if (!stu) return null;
    return {
      role: 'student',
      userId: stu.id,
      displayName: stu.name,
      subtitle: `${stu.studentCode} · ${stu.className}`,
      email: stu.email,
    };
  }
  return null;
}
