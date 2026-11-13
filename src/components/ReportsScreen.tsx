import { Download, FileBarChart2 } from 'lucide-react';
import type {
  AcademicClass,
  CohortWeeklyPoint,
  FacultyMember,
  Intervention,
  RiskThresholds,
  Student,
  UserRole,
} from '../types/edupredict';
import {
  computeCohortMetrics,
  computeDepartmentStats,
  computeFacultyPerformance,
  formatStudentCsv,
} from '../utils/riskEngine';
import { CohortTrajectoryChart } from './CohortTrajectoryChart';

interface ReportsScreenProps {
  role?: UserRole;
  classes: AcademicClass[];
  students: Student[];
  facultyList: FacultyMember[];
  interventions: Intervention[];
  thresholds: RiskThresholds;
  weeklySeries: CohortWeeklyPoint[];
}

export function ReportsScreen({
  role = 'admin',
  classes,
  students,
  facultyList,
  interventions,
  thresholds,
  weeklySeries,
}: ReportsScreenProps) {
  const metrics = computeCohortMetrics(students, interventions, thresholds);
  const departments = computeDepartmentStats(students, classes, thresholds);
  const facultyPerf = computeFacultyPerformance(
    facultyList,
    students,
    interventions,
    classes,
    thresholds
  );

  const handleExportCohortCsv = () => {
    const csv = formatStudentCsv(students, thresholds);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'edupulse-tn-academic-risk-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary Banner */}
      <section className="edu-card p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
            <FileBarChart2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#0F172A]">
              {role === 'faculty'
                ? 'Class & Mentoring Risk Report — 2026–2027 Odd Semester'
                : 'Institutional Risk & Intervention Report — 2026–2027 Odd Semester'}
            </h2>
            <p className="text-xs text-[#434655] mt-0.5 tabular-nums">
              {classes.length} classes · {metrics.totalStudents} students monitored · {metrics.highRiskCount} high risk ·{' '}
              {metrics.activeInterventionsCount} active plans · {metrics.predictedRetentionPct}% projected retention
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleExportCohortCsv}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          <span>Download Full Risk CSV</span>
        </button>
      </section>

      {/* Retention Chart */}
      <section className="edu-card p-6">
        <CohortTrajectoryChart data={weeklySeries} />
      </section>

      {/* Department + Faculty Comparative Matrices */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="edu-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F1F5F9]">
            <h2 className="text-base font-semibold text-[#0F172A]">
              Department Performance Benchmark
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] text-[11px] font-semibold uppercase tracking-wide text-[#434655]">
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-right">Avg Marks</th>
                  <th className="py-3 px-4 text-right">Attendance</th>
                  <th className="py-3 px-4 text-right">High Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-sm">
                {departments.map((d) => (
                  <tr key={d.department}>
                    <td className="py-3 px-4 font-semibold text-[#0F172A]">{d.department}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{d.avgInternalMarks}%</td>
                    <td className="py-3 px-4 text-right tabular-nums">{d.avgAttendance}%</td>
                    <td className="py-3 px-4 text-right tabular-nums font-semibold text-[#B91C1C]">
                      {d.highRiskCount} / {d.studentCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="edu-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F1F5F9]">
            <h2 className="text-base font-semibold text-[#0F172A]">
              Faculty Intervention Progress
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] text-[11px] font-semibold uppercase tracking-wide text-[#434655]">
                  <th className="py-3 px-4">Faculty</th>
                  <th className="py-3 px-4 text-right">Caseload</th>
                  <th className="py-3 px-4 text-right">Active Plans</th>
                  <th className="py-3 px-4 text-right">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-sm">
                {facultyPerf.map((f) => (
                  <tr key={f.faculty.id}>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#0F172A]">{f.faculty.name}</div>
                      <div className="text-xs text-[#434655]">{f.faculty.department}</div>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">{f.assignedCount}</td>
                    <td className="py-3 px-4 text-right tabular-nums font-medium text-[#2563EB]">
                      {f.activeInterventions}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-semibold text-[#166534]">
                      {f.completedInterventions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
