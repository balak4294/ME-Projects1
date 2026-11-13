import { ArrowUpRight, Sparkles, Users, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import type {
  CohortWeeklyPoint,
  CourseBottleneck,
  Intervention,
  RiskThresholds,
  Student,
} from '../types/edupredict';
import { computeCohortMetrics, getStudentRiskSummary } from '../utils/riskEngine';
import { CohortTrajectoryChart } from './CohortTrajectoryChart';
import { RiskBadge } from './RiskBadge';

interface OverviewScreenProps {
  students: Student[];
  interventions: Intervention[];
  thresholds: RiskThresholds;
  weeklySeries: CohortWeeklyPoint[];
  bottlenecks: CourseBottleneck[];
  onInspectStudent: (studentId: string) => void;
  onAssignAiPathway: (studentId: string) => void;
  onLaunchBatchHighRisk: () => void;
  onNavigateToStudents: (filterTier?: 'high' | 'medium' | 'low') => void;
}

export function OverviewScreen({
  students,
  interventions,
  thresholds,
  weeklySeries,
  bottlenecks,
  onInspectStudent,
  onAssignAiPathway,
  onLaunchBatchHighRisk,
  onNavigateToStudents,
}: OverviewScreenProps) {
  const metrics = computeCohortMetrics(students, interventions, thresholds);

  const activeStudentIds = new Set(
    interventions
      .filter((i) => i.status === 'in_progress' || i.status === 'pending')
      .map((i) => i.studentId)
  );

  const priorityStudents = [...students]
    .sort(
      (a, b) =>
        getStudentRiskSummary(b, thresholds).effectiveScore -
        getStudentRiskSummary(a, thresholds).effectiveScore
    )
    .slice(0, 5);

  const unaddressedStudents = students.filter(
    (s) =>
      getStudentRiskSummary(s, thresholds).tier === 'high' &&
      !activeStudentIds.has(s.id)
  );

  const highPct = Math.round((metrics.highRiskCount / Math.max(1, metrics.totalStudents)) * 100);
  const medPct = Math.round((metrics.mediumRiskCount / Math.max(1, metrics.totalStudents)) * 100);
  const lowPct = Math.max(0, 100 - highPct - medPct);

  return (
    <div className="space-y-6">
      {/* 4-column KPI summary strip */}
      <section aria-label="Cohort Key Metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="edu-card p-6">
          <div className="flex items-center justify-between text-xs font-semibold text-[#434655]">
            <span>Monitored Cohort</span>
            <Users className="h-4 w-4 text-[#2563EB]" aria-hidden="true" />
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <p className="font-display text-[32px] font-extrabold leading-9 text-[#0F172A] tabular-nums">
              {metrics.totalStudents}
            </p>
            <span className="text-xs font-medium text-[#0284C7] tabular-nums">
              {metrics.avgAttendancePct}% avg attendance
            </span>
          </div>
          <div className="mt-4 h-1.5 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#38BDF8]"
              style={{ width: `${Math.min(100, metrics.avgAttendancePct)}%` }}
            />
          </div>
        </div>

        <div className="edu-card p-6">
          <div className="flex items-center justify-between text-xs font-semibold text-[#434655]">
            <span>High-Risk Flagged</span>
            <AlertTriangle className="h-4 w-4 text-[#B91C1C]" aria-hidden="true" />
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <p className="font-display text-[32px] font-extrabold leading-9 text-[#0F172A] tabular-nums">
              {metrics.highRiskCount}
            </p>
            <button
              type="button"
              onClick={() => onNavigateToStudents('high')}
              className="text-xs font-semibold text-[#2563EB] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              View queue
            </button>
          </div>
          <p className="mt-3 text-xs text-[#434655] tabular-nums">
            {metrics.unaddressedHighRiskCount} awaiting advisor assignment
          </p>
        </div>

        <div className="edu-card p-6">
          <div className="flex items-center justify-between text-xs font-semibold text-[#434655]">
            <span>Active Interventions</span>
            <CheckCircle2 className="h-4 w-4 text-[#2563EB]" aria-hidden="true" />
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <p className="font-display text-[32px] font-extrabold leading-9 text-[#0F172A] tabular-nums">
              {metrics.activeInterventionsCount}
            </p>
            <span className="text-xs font-medium text-[#166534] tabular-nums">
              {metrics.completedInterventionsCount} completed
            </span>
          </div>
          <p className="mt-3 text-xs text-[#434655]">
            Across advising, tutoring &amp; faculty hours
          </p>
        </div>

        <div className="edu-card p-6">
          <div className="flex items-center justify-between text-xs font-semibold text-[#434655]">
            <span>Predicted Term Retention</span>
            <TrendingUp className="h-4 w-4 text-[#8B5CF6]" aria-hidden="true" />
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <p className="font-display text-[32px] font-extrabold leading-9 text-[#0F172A] tabular-nums">
              {metrics.predictedRetentionPct}%
            </p>
            <span className="text-xs font-semibold text-[#6B38D4] tabular-nums">
              +3.8 pts vs baseline
            </span>
          </div>
          <div className="mt-4 h-1.5 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#8B5CF6]"
              style={{ width: `${Math.min(100, metrics.predictedRetentionPct)}%` }}
            />
          </div>
        </div>
      </section>

      {/* Main Analytics + Predictive AI Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 edu-card p-6">
          <CohortTrajectoryChart data={weeklySeries} />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Predictive AI Suggestion Panel */}
          <section aria-label="AI Insights" className="edu-ai-panel p-6 flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDE9FE] border border-[#DDD6FE] px-2.5 py-1 text-xs font-semibold text-[#6B38D4]">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>AI Insights</span>
                </span>
                <span className="text-xs font-medium text-[#5516BE] tabular-nums">
                  Confidence 91%
                </span>
              </div>

              <h2 className="mt-3 text-base font-semibold text-[#0F172A]">
                {unaddressedStudents.length > 0
                  ? `${unaddressedStudents.length} High-Risk Students Unassigned`
                  : 'All High-Risk Students Covered'}
              </h2>
              <p className="mt-1.5 text-sm text-[#434655] leading-relaxed max-w-[68ch]">
                {unaddressedStudents.length > 0
                  ? `Simulated risk analysis flagged LMS inactivity above ${thresholds.lmsInactivityAlertDays} days paired with IA assessment dips across CSE, IT, and ECE classes.`
                  : 'Every flagged high-risk student currently has a pending or in-progress improvement plan assigned.'}
              </p>

              {unaddressedStudents.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-[#DDD6FE] pt-3">
                  {unaddressedStudents.slice(0, 3).map((stu) => {
                    const { effectiveScore } = getStudentRiskSummary(stu, thresholds);
                    return (
                      <li
                        key={stu.id}
                        className="flex items-center justify-between gap-2 text-xs text-[#0F172A]"
                      >
                        <button
                          type="button"
                          onClick={() => onInspectStudent(stu.id)}
                          className="font-medium hover:text-[#6B38D4] text-left truncate cursor-pointer"
                        >
                          {stu.name} · {stu.className}
                        </button>
                        <span className="tabular-nums font-semibold text-[#6B38D4] shrink-0">
                          Risk {effectiveScore}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-[#DDD6FE] flex items-center justify-between gap-3">
              {unaddressedStudents.length > 0 ? (
                <button
                  type="button"
                  onClick={onLaunchBatchHighRisk}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-[0.98] px-4 py-2.5 text-sm font-medium text-white transition-all whitespace-nowrap cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  <span>Assign AI Pathways ({unaddressedStudents.length})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigateToStudents('all' as never)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white border border-[#DDD6FE] hover:bg-[#FAF8FF] px-4 py-2.5 text-sm font-medium text-[#5516BE] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <span>Review Full Cohort Matrix</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </section>

          {/* Cohort Risk Breakdown */}
          <section className="edu-card p-6">
            <h2 className="text-base font-semibold text-[#0F172A]">
              Risk Tier Distribution
            </h2>
            <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
              <div className="bg-[#EF4444]" style={{ width: `${highPct}%` }} title={`High Risk ${highPct}%`} />
              <div className="bg-[#F59E0B]" style={{ width: `${medPct}%` }} title={`Medium Risk ${medPct}%`} />
              <div className="bg-[#22C55E]" style={{ width: `${lowPct}%` }} title={`Low Risk ${lowPct}%`} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-[#434655]">High Risk</p>
                <p className="mt-0.5 font-semibold text-[#B91C1C] tabular-nums">
                  {metrics.highRiskCount} ({highPct}%)
                </p>
              </div>
              <div>
                <p className="text-[#434655]">Medium Risk</p>
                <p className="mt-0.5 font-semibold text-[#92400E] tabular-nums">
                  {metrics.mediumRiskCount} ({medPct}%)
                </p>
              </div>
              <div>
                <p className="text-[#434655]">Low Risk</p>
                <p className="mt-0.5 font-semibold text-[#166534] tabular-nums">
                  {metrics.lowRiskCount} ({lowPct}%)
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Priority Attention Queue + Course Bottlenecks */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-8 edu-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-[#F1F5F9]">
            <div>
              <h2 className="text-base font-semibold text-[#0F172A]">
                Priority Student Attention Queue
              </h2>
              <p className="text-xs text-[#434655] mt-0.5">
                Ranked by real-time algorithmic risk score and early-warning triggers
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToStudents()}
              className="rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] px-3 py-1.5 text-xs font-medium text-[#0F172A] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open Full Directory
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] text-[11px] font-semibold uppercase tracking-wide text-[#434655]">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4 text-right">Attendance</th>
                  <th className="py-3 px-4 text-right">CGPA (10)</th>
                  <th className="py-3 px-4">Simulated Risk</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-sm">
                {priorityStudents.map((student) => {
                  const { effectiveScore, tier } = getStudentRiskSummary(student, thresholds);
                  const hasActive = activeStudentIds.has(student.id);
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => onInspectStudent(student.id)}
                          className="text-left group cursor-pointer"
                        >
                          <div className="font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                            {student.name}
                          </div>
                          <div className="text-xs text-[#434655] mt-0.5">
                            {student.studentCode} · {student.className} · Sem {student.semester}
                          </div>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-medium text-[#0F172A]">
                        {student.attendanceRate}%
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-[#0F172A]">
                        {student.gpa.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <RiskBadge tier={tier} score={effectiveScore} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onInspectStudent(student.id)}
                            aria-label={`Inspect ${student.name}`}
                            className="rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] px-3 py-1.5 text-xs font-medium text-[#0F172A] whitespace-nowrap cursor-pointer"
                          >
                            Inspect
                          </button>
                          {!hasActive ? (
                            <button
                              type="button"
                              onClick={() => onAssignAiPathway(student.id)}
                              aria-label={`Assign AI pathway to ${student.name}`}
                              className="rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-3 py-1.5 text-xs font-medium text-white whitespace-nowrap cursor-pointer"
                            >
                              Assign Pathway
                            </button>
                          ) : (
                            <span className="text-xs font-medium text-[#6B38D4] whitespace-nowrap px-1.5">
                              In Pathway
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Course Bottleneck Watchlist */}
        <section className="xl:col-span-4 edu-card p-6">
          <div className="pb-4 border-b border-[#F1F5F9]">
            <h2 className="text-base font-semibold text-[#0F172A]">
              Core Subject Bottlenecks
            </h2>
            <p className="text-xs text-[#434655] mt-0.5">
              Subjects with highest simulated arrear-risk concentration
            </p>
          </div>
          <ul className="mt-4 space-y-4">
            {bottlenecks.map((course) => (
              <li key={course.courseCode} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold text-[#0F172A]">
                      {course.courseCode}
                    </span>
                    <span className="text-xs text-[#434655] ml-2">
                      {course.courseName}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-[#B91C1C] tabular-nums shrink-0">
                    {course.dfwRate}% Risk
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#38BDF8]"
                    style={{ width: `${Math.min(100, course.dfwRate * 3.5)}%` }}
                  />
                </div>
                <p className="text-xs text-[#434655] tabular-nums">
                  {course.atRiskCount} flagged of {course.enrolled} enrolled · {course.department}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
