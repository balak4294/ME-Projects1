import test from 'node:test';
import assert from 'node:assert/strict';
import { SEED_CLASSES, SEED_FACULTY, SEED_INTERVENTIONS, SEED_STUDENTS, SEED_SUBJECTS } from '../data/seedData';
import {
  computeClassMetrics,
  computeCohortMetrics,
  computeDepartmentStats,
  computeEffectiveRiskScore,
  computeFacultyPerformance,
  computeRiskTier,
  computeStudentAssignmentCompletionPct,
  computeSubjectRecordMetrics,
  DEFAULT_THRESHOLDS,
  filterStudents,
  formatDateDDMMYYYY,
  formatStudentCsv,
  getScopedClassesForFaculty,
  getScopedStudentsForRole,
  parseStudentCsvImport,
  recalculateBaseRiskScoreFromRecord,
  recalculateStudentFromSubjectRecords,
  simulateProjectedRisk,
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

test('recalculateBaseRiskScoreFromRecord lowers score as attendance and marks improve', () => {
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
  assert.ok(highRisk >= 70);
  assert.ok(recovered < 40);
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
});

test('getScopedStudentsForRole and getScopedClassesForFaculty enforce strict scoping', () => {
  const adminList = getScopedStudentsForRole(SEED_STUDENTS, 'admin', 'adm-01');
  const facultyList = getScopedStudentsForRole(SEED_STUDENTS, 'faculty', 'fac-01');
  const studentList = getScopedStudentsForRole(SEED_STUDENTS, 'student', 'stu-01');
  const facultyClasses = getScopedClassesForFaculty(SEED_CLASSES, 'fac-01');

  assert.equal(adminList.length, SEED_STUDENTS.length);
  assert.ok(facultyList.every((s) => s.facultyId === 'fac-01'));
  assert.equal(facultyClasses.length, 1);
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

test('computeCohortMetrics, computeClassMetrics, computeDepartmentStats, and computeFacultyPerformance aggregate accurately', () => {
  const metrics = computeCohortMetrics(SEED_STUDENTS, SEED_INTERVENTIONS, DEFAULT_THRESHOLDS);
  const cseClass = SEED_CLASSES[0];
  const classStats = computeClassMetrics(cseClass, SEED_STUDENTS, SEED_SUBJECTS, DEFAULT_THRESHOLDS);
  const depts = computeDepartmentStats(SEED_STUDENTS, SEED_CLASSES, DEFAULT_THRESHOLDS);
  const facPerf = computeFacultyPerformance(SEED_FACULTY, SEED_STUDENTS, SEED_INTERVENTIONS, SEED_CLASSES, DEFAULT_THRESHOLDS);

  assert.equal(metrics.totalStudents, 10);
  assert.equal(classStats.studentCount, 4);
  assert.equal(classStats.subjectCount, 5);
  assert.ok(depts.length >= 5);
  assert.equal(facPerf.length, 5);
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
