import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SEED_CLASSES,
  SEED_FACULTY,
  SEED_INTERVENTIONS,
  SEED_STUDENTS,
  SEED_SUBJECTS,
} from '../data/seedData';
import {
  computeClassMetrics,
  computeCohortMetrics,
  computeDepartmentStats,
  computeEffectiveRiskScore,
  computeFacultyPerformance,
  computeRiskTier,
  computeStudentAssignmentCompletionPct,
  computeSubjectBottlenecks,
  computeSubjectRecordMetrics,
  DEFAULT_THRESHOLDS,
  filterStudents,
  formatDateDDMMYYYY,
  formatStudentCsv,
  getScopedClassesForFaculty,
  getScopedStudentsForRole,
  getStudentRiskSummary,
  parseStudentCsvImport,
  reassignSubjectAcrossClasses,
  recalculateBaseRiskScoreFromRecord,
  recalculateStudentFromSubjectRecords,
  removeSubjectFromClass,
  simulateProjectedRisk,
  TN_DEPARTMENTS,
  validateAuthSession,
} from './riskEngine';

test('computeRiskTier classifies scores according to thresholds', () => {
  assert.equal(computeRiskTier(85, DEFAULT_THRESHOLDS), 'high');
  assert.equal(computeRiskTier(70, DEFAULT_THRESHOLDS), 'high');
  assert.equal(computeRiskTier(55, DEFAULT_THRESHOLDS), 'medium');
  assert.equal(computeRiskTier(40, DEFAULT_THRESHOLDS), 'medium');
  assert.equal(computeRiskTier(25, DEFAULT_THRESHOLDS), 'low');
});

test('computeEffectiveRiskScore elevates risk when early warning thresholds trigger', () => {
  const arun = SEED_STUDENTS.find((s) => s.id === 'stu-01')!;
  const priya = SEED_STUDENTS.find((s) => s.id === 'stu-02')!;

  const arunScore = computeEffectiveRiskScore(arun, DEFAULT_THRESHOLDS);
  const priyaScore = computeEffectiveRiskScore(priya, DEFAULT_THRESHOLDS);

  assert.ok(arunScore >= 70, `Expected Arun Kumar >= 70, got ${arunScore}`);
  assert.ok(priyaScore < 40, `Expected Priya S < 40, got ${priyaScore}`);
});

test('recalculateBaseRiskScoreFromRecord handles normal and extreme/NaN inputs within 0-100 bounds', () => {
  const highRisk = recalculateBaseRiskScoreFromRecord({
    attendanceRate: 62,
    internalMarksAvg: 54,
    missingAssignments: 4,
    lmsInactiveDays: 10,
  });
  const recovered = recalculateBaseRiskScoreFromRecord({
    attendanceRate: 90,
    internalMarksAvg: 84,
    missingAssignments: 0,
    lmsInactiveDays: 1,
  });
  assert.ok(highRisk >= 70 && highRisk <= 100);
  assert.ok(recovered >= 0 && recovered < 40);

  const nanSafe = recalculateBaseRiskScoreFromRecord({
    attendanceRate: Number.NaN,
    internalMarksAvg: Number.POSITIVE_INFINITY,
    missingAssignments: -5,
    lmsInactiveDays: Number.NaN,
    engagementScore: 250,
  });
  assert.ok(Number.isFinite(nanSafe));
  assert.ok(nanSafe >= 0 && nanSafe <= 100);

  const overBound = recalculateBaseRiskScoreFromRecord({
    attendanceRate: -50,
    internalMarksAvg: -10,
    missingAssignments: 99,
    lmsInactiveDays: 99,
    engagementScore: -40,
  });
  assert.equal(overBound, 100);
});

test('computeSubjectRecordMetrics and recalculateStudentFromSubjectRecords sync attendance, IA avg, and CGPA', () => {
  const arun = SEED_STUDENTS.find((s) => s.id === 'stu-01')!;
  const improvedRecords = arun.subjectRecords.map((rec) =>
    computeSubjectRecordMetrics({
      ...rec,
      totalWorkingDays: 40,
      daysPresent: 37,
      ia1: 86,
      ia2: 88,
      ia3: 90,
      assignmentMarks: 90,
      classParticipation: 88,
      assignments: rec.assignments.map((a) => ({
        ...a,
        status: 'Submitted',
        submissionDate: '12-11-2026',
        marksObtained: 88,
      })),
    })
  );

  const updated = recalculateStudentFromSubjectRecords(arun, improvedRecords);
  assert.equal(updated.attendanceRate, 93);
  assert.ok(updated.internalMarksAvg >= 88);
  assert.equal(updated.missingAssignments, 0);
  assert.ok(updated.gpa >= 8.4);
  assert.ok(updated.riskScore < 35);

  const cleared = recalculateStudentFromSubjectRecords(arun, []);
  assert.equal(cleared.subjectRecords.length, 0);
  assert.equal(cleared.subjectMarks.length, 0);
  assert.equal(cleared.creditsEnrolled, 0);
  assert.equal(cleared.assignmentsTotal, 0);
});

test('reassignSubjectAcrossClasses moves subject from Class A to Class B, preserves Class A history, and initializes Class B', () => {
  const classA = SEED_CLASSES.find((c) => c.id === 'cls-cse-2a')!;
  const classB = SEED_CLASSES.find((c) => c.id === 'cls-cse-3b')!;
  const dbms = SEED_SUBJECTS.find((s) => s.id === 'sub-cs3402')!;

  const classAStudentIds = new Set(
    SEED_STUDENTS.filter((s) => s.classId === classA.id).map((s) => s.id)
  );
  const classBStudentIds = new Set(
    SEED_STUDENTS.filter((s) => s.classId === classB.id).map((s) => s.id)
  );

  const result = reassignSubjectAcrossClasses({
    subjectId: dbms.id,
    updatedSubject: {
      classId: classB.id,
      code: dbms.code,
      name: dbms.name,
      type: dbms.type,
      credits: dbms.credits,
      assignedFacultyId: dbms.assignedFacultyId,
      assignedFacultyName: dbms.assignedFacultyName,
      semester: classB.semester,
    },
    subjects: SEED_SUBJECTS,
    students: SEED_STUDENTS,
    classes: SEED_CLASSES,
    archivedAt: '13-11-2026',
  });

  assert.equal(result.movedBetweenClasses, true);
  assert.equal(result.archivedCount, classAStudentIds.size);
  assert.equal(result.enrolledCount, classBStudentIds.size);

  // Subject removed from Class A subjects and present in Class B subjects
  assert.ok(!result.subjects.some((s) => s.id === dbms.id && s.classId === classA.id));
  assert.ok(result.subjects.some((s) => s.id === dbms.id && s.classId === classB.id));

  // Class A students no longer have active DBMS, but historical record is preserved
  for (const stu of result.students.filter((s) => classAStudentIds.has(s.id))) {
    assert.ok(!stu.subjectRecords.some((r) => r.subjectId === dbms.id));
    assert.ok(
      stu.historicalSubjectRecords?.some(
        (h) => h.subjectId === dbms.id && h.archivedFromClassId === classA.id
      )
    );
  }

  // Class B students now have active DBMS baseline records
  for (const stu of result.students.filter((s) => classBStudentIds.has(s.id))) {
    assert.ok(stu.subjectRecords.some((r) => r.subjectId === dbms.id && r.subjectCode === 'CS3402'));
  }

  // Removing a subject also archives student academic records cleanly
  const removed = removeSubjectFromClass({
    subjectId: dbms.id,
    subjects: result.subjects,
    students: result.students,
    classes: SEED_CLASSES,
  });
  assert.ok(!removed.subjects.some((s) => s.id === dbms.id));
  assert.equal(removed.archivedCount, classBStudentIds.size);
});

test('getScopedStudentsForRole and getScopedClassesForFaculty enforce strict scoping', () => {
  const adminList = getScopedStudentsForRole(SEED_STUDENTS, 'admin', 'adm-01');
  const facultyList = getScopedStudentsForRole(SEED_STUDENTS, 'faculty', 'fac-01');
  const studentList = getScopedStudentsForRole(SEED_STUDENTS, 'student', 'stu-01');
  const facultyClasses = getScopedClassesForFaculty(SEED_CLASSES, 'fac-01');

  assert.equal(adminList.length, 50);
  assert.ok(facultyList.every((s) => s.facultyId === 'fac-01'));
  assert.equal(facultyClasses.length, 2);
  assert.equal(facultyClasses[0].className, 'CSE – II Year – Section A');
  assert.equal(studentList.length, 1);
  assert.equal(studentList[0].name, 'Arun Kumar');
});

test('computeStudentAssignmentCompletionPct returns accurate rounded percentage', () => {
  const priya = SEED_STUDENTS.find((s) => s.id === 'stu-02')!;
  const arun = SEED_STUDENTS.find((s) => s.id === 'stu-01')!;

  assert.equal(computeStudentAssignmentCompletionPct(priya), 100);
  assert.ok(computeStudentAssignmentCompletionPct(arun) < 80);
});

test('simulateProjectedRisk reduces score and shifts tier when recovery actions increase', () => {
  const arun = SEED_STUDENTS.find((s) => s.id === 'stu-01')!;
  const sim = simulateProjectedRisk(
    arun,
    { targetAttendanceRate: 92, tutoringHoursPerWeek: 5, assignmentsRecovered: arun.missingAssignments },
    DEFAULT_THRESHOLDS
  );

  assert.ok(sim.projectedScore < sim.baselineScore);
  assert.ok(sim.delta < 0);
});

test('filterStudents filters by tier, department, classId, and search query', () => {
  const cseHigh = filterStudents(
    SEED_STUDENTS,
    {
      query: '711725104001',
      tier: 'high',
      department: 'Computer Science and Engineering (CSE)',
      advisor: 'all',
      classId: 'cls-cse-2a',
    },
    DEFAULT_THRESHOLDS
  );
  assert.equal(cseHigh.length, 1);
  assert.equal(cseHigh[0].name, 'Arun Kumar');
});

test('50-student Tamil Nadu dataset spans all 7 departments with valid cross-references and risk tiers', () => {
  assert.equal(SEED_STUDENTS.length, 50);
  assert.equal(SEED_FACULTY.length, 7);
  assert.equal(SEED_CLASSES.length, 8);

  const classMap = new Map(SEED_CLASSES.map((c) => [c.id, c]));
  const facultyIds = new Set(SEED_FACULTY.map((f) => f.id));
  const depts = new Set(SEED_STUDENTS.map((s) => s.department));

  for (const dept of TN_DEPARTMENTS) {
    assert.ok(depts.has(dept), `Missing department: ${dept}`);
  }

  let highCount = 0;
  let medCount = 0;
  let lowCount = 0;

  for (const stu of SEED_STUDENTS) {
    assert.ok(classMap.has(stu.classId), `Invalid classId on ${stu.id}`);
    assert.ok(facultyIds.has(stu.facultyId), `Invalid facultyId on ${stu.id}`);
    assert.ok(stu.mobile.startsWith('+91 '), `Expected +91 mobile on ${stu.id}`);
    assert.ok(stu.subjectRecords.length > 0, `Expected subjects on ${stu.id}`);
    const { effectiveScore, tier } = getStudentRiskSummary(stu, DEFAULT_THRESHOLDS);
    assert.ok(effectiveScore >= 0 && effectiveScore <= 100);
    if (tier === 'high') highCount += 1;
    else if (tier === 'medium') medCount += 1;
    else lowCount += 1;
  }

  assert.ok(highCount >= 8, `Expected >= 8 high-risk students, got ${highCount}`);
  assert.ok(medCount >= 10, `Expected >= 10 medium-risk students, got ${medCount}`);
  assert.ok(lowCount >= 15, `Expected >= 15 low-risk students, got ${lowCount}`);
});

test('computeCohortMetrics, computeClassMetrics, computeDepartmentStats, computeSubjectBottlenecks, and computeFacultyPerformance aggregate accurately', () => {
  const metrics = computeCohortMetrics(SEED_STUDENTS, SEED_INTERVENTIONS, DEFAULT_THRESHOLDS);
  const cseClass = SEED_CLASSES[0];
  const classStats = computeClassMetrics(cseClass, SEED_STUDENTS, SEED_SUBJECTS, DEFAULT_THRESHOLDS);
  const depts = computeDepartmentStats(SEED_STUDENTS, SEED_CLASSES, DEFAULT_THRESHOLDS);
  const facPerf = computeFacultyPerformance(SEED_FACULTY, SEED_STUDENTS, SEED_INTERVENTIONS, SEED_CLASSES, DEFAULT_THRESHOLDS);
  const bottlenecks = computeSubjectBottlenecks(SEED_STUDENTS, SEED_SUBJECTS, DEFAULT_THRESHOLDS);

  assert.equal(metrics.totalStudents, 50);
  assert.equal(classStats.studentCount, 8);
  assert.equal(classStats.subjectCount, 5);
  assert.equal(depts.length, 7);
  assert.equal(facPerf.length, 7);
  assert.ok(bottlenecks.length > 0);
  assert.ok(bottlenecks.every((b) => b.enrolled > 0 && b.dfwRate >= 0 && b.dfwRate <= 100));
});

test('validateAuthSession restores valid sessions and clears stale/unknown IDs', () => {
  const validAdmin = validateAuthSession(
    {
      role: 'admin',
      userId: 'adm-01',
      displayName: 'Dr. V. Balasubramanian',
      subtitle: 'Principal',
      email: 'principal@kongutech.edu.in',
    },
    SEED_FACULTY,
    SEED_STUDENTS
  );
  assert.ok(validAdmin);

  const staleFaculty = validateAuthSession(
    {
      role: 'faculty',
      userId: 'fac-unknown',
      displayName: 'Unknown',
      subtitle: '',
      email: 'unknown@kongutech.edu.in',
    },
    SEED_FACULTY,
    SEED_STUDENTS
  );
  assert.equal(staleFaculty, null);

  const validStudent = validateAuthSession(
    {
      role: 'student',
      userId: 'stu-01',
      displayName: 'Old Name',
      subtitle: '',
      email: 'arun.kumar25@kongutech.edu.in',
    },
    SEED_FACULTY,
    SEED_STUDENTS
  );
  assert.equal(validStudent?.displayName, 'Arun Kumar');
});

test('formatDateDDMMYYYY, parseStudentCsvImport, and formatStudentCsv work cleanly', () => {
  assert.equal(formatDateDDMMYYYY('2026-11-25'), '25-11-2026');
  const parsed = parseStudentCsvImport(
    'Name,RegisterNumber,Email,Mobile,Location,Attendance,Marks\nMeena V,711725104005,meena.v@kongutech.edu.in,+91 98431 21099,Coimbatore,84,78'
  );
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].name, 'Meena V');
  assert.equal(parsed[0].registerNumber, '711725104005');

  const csv = formatStudentCsv(SEED_STUDENTS.slice(0, 2), DEFAULT_THRESHOLDS);
  assert.ok(csv.startsWith('Register Number,Student Name,Class,Department'));
  assert.ok(csv.includes('Arun Kumar'));
});
