import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Layers,
  Sparkles,
  Users,
} from 'lucide-react';
import type {
  AcademicClass,
  Intervention,
  RiskThresholds,
  ScreenId,
  Student,
  SubjectItem,
} from '../types/edupredict';
import {
  computeCohortMetrics,
  computeStudentAssignmentCompletionPct,
  getStudentRiskSummary,
} from '../utils/riskEngine';
import { RiskBadge } from './RiskBadge';

interface FacultyOverviewScreenProps {
  facultyName: string;
  classes: AcademicClass[];
  subjects: SubjectItem[];
  students: Student[];
  interventions: Intervention[];
  thresholds: RiskThresholds;
  onInspectStudent: (studentId: string) => void;
  onAssignAiPathway: (studentId: string) => void;
  onNavigate: (screen: ScreenId) => void;
}

const WORKFLOW_STEPS: Array<{ step: string; label: string; screen: ScreenId }> = [
  { step: '1', label: 'Create Class', screen: 'fac_classes' },
  { step: '2', label: 'Add Students', screen: 'fac_students' },
  { step: '3', label: 'Assign Subjects', screen: 'fac_subjects' },
  { step: '4', label: 'Academic Data', screen: 'fac_data_entry' },
  { step: '5', label: 'AI Risk Analysis', screen: 'fac_risk_analysis' },
  { step: '6', label: 'Improvement Plan', screen: 'interventions' },
];

export function FacultyOverviewScreen({
  facultyName,
  classes,
  subjects,
  students,
  interventions,
  thresholds,
  onInspectStudent,
  onAssignAiPathway,
  onNavigate,
}: FacultyOverviewScreenProps) {
  const metrics = computeCohortMetrics(students, interventions, thresholds);

  const activeIds = new Set(
    interventions
      .filter((i) => i.status === 'pending' || i.status === 'in_progress')
      .map((i) => i.studentId)
  );

  const immediateAttention = [...students]
    .sort(
      (a, b) =>
        getStudentRiskSummary(b, thresholds).effectiveScore -
        getStudentRiskSummary(a, thresholds).effectiveScore
    )
    .slice(0, 4);

  const unassignedAttention = students.filter(
    (s) =>
      getStudentRiskSummary(s, thresholds).tier !== 'low' &&
      !activeIds.has(s.id)
  );

  return (
    <div className="space-y-6">
      {/* Structured Faculty Academic Management Workflow Stepper */}
      <section className="edu-card p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A]">
              Faculty Academic Management Workflow
            </h2>
            <p className="text-xs text-[#434655]">
              Structured class-based academic entry, simulated risk prediction, and student mentoring progression
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('fac_classes')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-3 py-1.5 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
          >
            <span>Open My Classes</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          {WORKFLOW_STEPS.map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => onNavigate(item.screen)}
              className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#2563EB] hover:bg-[#EFF6FF]/60 p-3 text-left transition-colors cursor-pointer"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#2563EB] text-[11px] font-bold text-white tabular-nums">
                {item.step}
              </span>
              <p className="mt-1.5 text-xs font-semibold text-[#0F172A]">
                {item.label}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* 4 KPI Cards scoped to Faculty's Classes & Assigned Students */}
      <section aria-label="Faculty Key Metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="edu-card p-6">
          <div className="flex items-center justify-between text-xs font-semibold text-[#434655]">
            <span>My Classes &amp; Subjects</span>
            <Layers className="h-4 w-4 text-[#2563EB]" aria-hidden="true" />
          </div>
          <p className="mt-3 font-display text-[32px] font-extrabold leading-9 text-[#0F172A] tabular-nums">
            {classes.length}
          </p>
          <p className="mt-2 text-xs text-[#434655] tabular-nums">
            {subjects.length} subjects · {metrics.totalStudents} enrolled students
          </p>
        </div>

        <div className="edu-card p-6">
          <div className="flex items-center justify-between text-xs font-semibold text-[#434655]">
            <span>Immediate Attention</span>
            <AlertTriangle className="h-4 w-4 text-[#B91C1C]" aria-hidden="true" />
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <p className="font-display text-[32px] font-extrabold leading-9 text-[#B91C1C] tabular-nums">
              {metrics.highRiskCount}
            </p>
            <button
              type="button"
              onClick={() => onNavigate('fac_risk_analysis')}
              className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              Risk Analysis
            </button>
          </div>
          <p className="mt-2 text-xs text-[#434655] tabular-nums">
            {metrics.mediumRiskCount} medium risk · {metrics.lowRiskCount} on track
          </p>
        </div>

        <div className="edu-card p-6">
          <div className="flex items-center justify-between text-xs font-semibold text-[#434655]">
            <span>Avg Internal Marks</span>
            <BookOpen className="h-4 w-4 text-[#0284C7]" aria-hidden="true" />
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <p className="font-display text-[32px] font-extrabold leading-9 text-[#0F172A] tabular-nums">
              {metrics.avgInternalMarksPct}%
            </p>
            <span className="text-xs font-medium text-[#0284C7] tabular-nums">
              {metrics.avgAttendancePct}% attendance
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#38BDF8]"
              style={{ width: `${metrics.avgInternalMarksPct}%` }}
            />
          </div>
        </div>

        <div className="edu-card p-6">
          <div className="flex items-center justify-between text-xs font-semibold text-[#434655]">
            <span>Improvement Plans</span>
            <CheckCircle2 className="h-4 w-4 text-[#166534]" aria-hidden="true" />
          </div>
          <p className="mt-3 font-display text-[32px] font-extrabold leading-9 text-[#0F172A] tabular-nums">
            {metrics.activeInterventionsCount}
          </p>
          <p className="mt-2 text-xs text-[#166534] font-medium tabular-nums">
            {metrics.completedInterventionsCount} completed by {facultyName}
          </p>
        </div>
      </section>

      {/* Main Split: Immediate Attention Table + Faculty AI Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-8 edu-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-[#F1F5F9]">
            <div>
              <h2 className="text-base font-semibold text-[#0F172A]">
                Students Requiring Immediate Attention
              </h2>
              <p className="text-xs text-[#434655] mt-0.5">
                Monitor class attendance, IA marks, assignment completion, and simulated risk predictions
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('fac_students')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] px-3 py-1.5 text-xs font-medium text-[#0F172A] cursor-pointer"
            >
              <Users className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
              <span>Student Management</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] text-[11px] font-semibold uppercase tracking-wide text-[#434655]">
                  <th className="py-3 pl-5 pr-3 whitespace-nowrap">Student</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Attendance</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Marks &amp; Tasks</th>
                  <th className="py-3 px-3 whitespace-nowrap">Simulated Risk</th>
                  <th className="py-3 pl-3 pr-5 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-sm">
                {immediateAttention.map((stu) => {
                  const { effectiveScore, tier } = getStudentRiskSummary(stu, thresholds);
                  const assignPct = computeStudentAssignmentCompletionPct(stu);
                  const hasPlan = activeIds.has(stu.id);

                  return (
                    <tr key={stu.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 pl-5 pr-3">
                        <button
                          type="button"
                          onClick={() => onInspectStudent(stu.id)}
                          className="text-left group cursor-pointer"
                        >
                          <div className="font-semibold text-[#0F172A] group-hover:text-[#2563EB]">
                            {stu.name}
                          </div>
                          <div className="text-xs text-[#434655] tabular-nums mt-0.5">
                            {stu.studentCode} · {stu.className}
                          </div>
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums font-medium text-[#0F172A] whitespace-nowrap">
                        {stu.attendanceRate}%
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums whitespace-nowrap">
                        <div className="font-semibold text-[#0F172A]">
                          {stu.internalMarksAvg}%
                        </div>
                        <div className="text-xs text-[#434655] mt-0.5">
                          {stu.assignmentsCompleted}/{stu.assignmentsTotal} ({assignPct}%)
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <RiskBadge tier={tier} score={effectiveScore} />
                      </td>
                      <td className="py-3 pl-3 pr-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onInspectStudent(stu.id)}
                            aria-label={`Inspect ${stu.name}`}
                            className="rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-medium text-[#0F172A] cursor-pointer whitespace-nowrap"
                          >
                            Inspect
                          </button>
                          {!hasPlan && tier !== 'low' && (
                            <button
                              type="button"
                              onClick={() => onAssignAiPathway(stu.id)}
                              aria-label={`Create plan for ${stu.name}`}
                              className="rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] px-2.5 py-1.5 text-xs font-medium text-white cursor-pointer whitespace-nowrap"
                            >
                              Assign Plan
                            </button>
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

        {/* Faculty AI Coaching Recommendations */}
        <aside className="xl:col-span-4 edu-ai-panel p-6 flex flex-col justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDE9FE] border border-[#DDD6FE] px-2.5 py-1 text-xs font-semibold text-[#6B38D4]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Simulated Risk Insights</span>
            </span>

            <h2 className="mt-3 text-base font-semibold text-[#0F172A]">
              {unassignedAttention.length > 0
                ? `${unassignedAttention.length} Students Need Plans`
                : 'Your Class Roster Is Covered'}
            </h2>
            <p className="mt-1.5 text-sm text-[#434655] leading-relaxed">
              {unassignedAttention.length > 0
                ? 'Review simulated risk triggers from subject attendance & IA marks and create improvement plans.'
                : 'All at-risk students in your classes currently have pending or in-progress improvement plans.'}
            </p>

            <ul className="mt-4 space-y-3 border-t border-[#DDD6FE] pt-3">
              {immediateAttention.slice(0, 3).map((stu) => (
                <li key={stu.id} className="text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-[#0F172A]">
                    <button
                      type="button"
                      onClick={() => onInspectStudent(stu.id)}
                      className="hover:text-[#6B38D4] cursor-pointer text-left"
                    >
                      {stu.name}
                    </button>
                    <span className="text-[#6B38D4] tabular-nums">
                      {stu.missingAssignments} pending tasks
                    </span>
                  </div>
                  <p className="text-[#434655]">
                    {stu.riskDrivers[0]?.label ?? stu.recommendedPathway.title}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('fac_data_entry')}
            className="mt-5 w-full rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] px-4 py-2.5 text-xs font-semibold text-white cursor-pointer"
          >
            Enter Subject Marks &amp; Attendance
          </button>
        </aside>
      </div>
    </div>
  );
}
