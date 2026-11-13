import {
  Award,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Circle,
  Info,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type {
  Intervention,
  RiskThresholds,
  ScreenId,
  Student,
} from '../types/edupredict';
import {
  computeStudentAssignmentCompletionPct,
  formatDateDDMMYYYY,
  getStudentRiskSummary,
} from '../utils/riskEngine';
import { RiskBadge } from './RiskBadge';

interface StudentDashboardProps {
  student: Student;
  interventions: Intervention[];
  thresholds: RiskThresholds;
  activeTab: ScreenId;
  onToggleActivity: (studentId: string, activityId: string) => void;
  onNavigate: (screen: ScreenId) => void;
}

const PLAN_STATUS_LABELS: Record<Intervention['status'], { label: string; style: string }> = {
  pending: { label: 'Pending', style: 'bg-[#FEF3C7] text-[#92400E]' },
  in_progress: { label: 'In Progress', style: 'bg-[#DBEAFE] text-[#1D4ED8]' },
  completed: { label: 'Completed', style: 'bg-[#DCFCE7] text-[#166534]' },
};

export function StudentDashboard({
  student,
  interventions,
  thresholds,
  activeTab,
  onToggleActivity,
  onNavigate,
}: StudentDashboardProps) {
  const { effectiveScore, tier } = getStudentRiskSummary(student, thresholds);
  const assignPct = computeStudentAssignmentCompletionPct(student);

  const completedActivities = student.improvementActivities.filter((a) => a.completed);
  const pendingActivities = student.improvementActivities.filter((a) => !a.completed);
  const totalActivities = student.improvementActivities.length || 1;
  const activityProgressPct = Math.round(
    (completedActivities.length / totalActivities) * 100
  );

  const studentInterventions = interventions.filter(
    (i) => i.studentId === student.id
  );

  const allAssignments = student.subjectRecords.flatMap((rec) =>
    rec.assignments.map((asg) => ({
      ...asg,
      subjectCode: rec.subjectCode,
      subjectName: rec.subjectName,
    }))
  );

  const encouragementHeadline =
    tier === 'low'
      ? `Great momentum, ${student.name.split(' ')[0]}! Your semester progress is firmly on track.`
      : tier === 'medium'
        ? `Stay steady, ${student.name.split(' ')[0]} — completing upcoming IA reviews will keep your standing strong.`
        : `Support plan ready, ${student.name.split(' ')[0]} — focus on attendance and ${Math.min(2, pendingActivities.length || 2)} priority tasks with your mentor.`;

  const potentialPointsLift = pendingActivities.reduce(
    (sum, item) => sum + item.pointsLift,
    0
  );

  return (
    <div className="space-y-6">
      {/* Enrolled Class & Academic Context Hero */}
      <section className="edu-card p-6 bg-gradient-to-r from-[#EFF6FF] via-[#FFFFFF] to-[#F5F3FF]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-[72ch]">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-semibold text-[#2563EB]">
                Read-Only Student Academic Portal
              </span>
              <span className="hidden sm:inline text-[#CBD5E1]" aria-hidden="true">·</span>
              <RiskBadge tier={tier} score={effectiveScore} />
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0F172A]">
              {encouragementHeadline}
            </h2>
            <p className="text-sm text-[#434655] leading-relaxed tabular-nums">
              Class: <strong className="font-semibold text-[#0F172A]">{student.className}</strong> · Reg No: <strong className="font-semibold text-[#0F172A]">{student.studentCode}</strong> · Semester {student.semester} ({student.classYear})
            </p>
            <p className="text-xs text-[#434655] tabular-nums">
              Department: {student.department} · Faculty Mentor: <strong className="font-semibold text-[#0F172A]">{student.advisor}</strong> · {student.location} · {student.creditsEnrolled} Credits
            </p>
          </div>

          {activeTab !== 'student_plan' && (
            <button
              type="button"
              onClick={() => onNavigate('student_plan')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] px-4 py-2.5 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>Open My Improvement Plan</span>
            </button>
          )}
        </div>
      </section>

      {/* Overall Academic Performance Strip */}
      <section aria-label="My Academic Metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="edu-card p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#434655]">
            <span>Overall Attendance</span>
            <CalendarCheck className="h-4 w-4 text-[#2563EB]" aria-hidden="true" />
          </div>
          <p className="mt-2.5 font-display text-[30px] font-extrabold text-[#0F172A] tabular-nums">
            {student.attendanceRate}%
          </p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#38BDF8]"
              style={{ width: `${student.attendanceRate}%` }}
            />
          </div>
        </div>

        <div className="edu-card p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#434655]">
            <span>Internal Marks Avg</span>
            <BookOpen className="h-4 w-4 text-[#0284C7]" aria-hidden="true" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between gap-2">
            <p className="font-display text-[30px] font-extrabold text-[#0F172A] tabular-nums">
              {student.internalMarksAvg}%
            </p>
            <span className="text-xs font-semibold text-[#434655] tabular-nums">
              CGPA {student.gpa.toFixed(2)} / 10
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#2563EB]"
              style={{ width: `${student.internalMarksAvg}%` }}
            />
          </div>
        </div>

        <div className="edu-card p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#434655]">
            <span>Assignments Submitted</span>
            <Award className="h-4 w-4 text-[#166534]" aria-hidden="true" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between gap-2">
            <p className="font-display text-[30px] font-extrabold text-[#0F172A] tabular-nums">
              {student.assignmentsCompleted}/{student.assignmentsTotal}
            </p>
            <span className="text-xs font-semibold text-[#166534] tabular-nums">
              {assignPct}% done
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#22C55E]"
              style={{ width: `${assignPct}%` }}
            />
          </div>
        </div>

        <div className="edu-card p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#434655]">
            <span>Simulated Risk Score</span>
            {tier === 'low' ? (
              <TrendingDown className="h-4 w-4 text-[#166534]" aria-hidden="true" />
            ) : (
              <TrendingUp className="h-4 w-4 text-[#8B5CF6]" aria-hidden="true" />
            )}
          </div>
          <div className="mt-2.5 flex items-baseline justify-between gap-2">
            <p className="font-display text-[30px] font-extrabold text-[#0F172A] tabular-nums">
              {effectiveScore}
              <span className="text-sm font-medium text-[#64748B]">/100</span>
            </p>
            <span className="text-xs font-semibold text-[#6B38D4] tabular-nums">
              {potentialPointsLift > 0 ? `Up to -${potentialPointsLift} pts` : 'On track'}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-[#434655]">
            Simulated indicator updated by faculty IA &amp; attendance entries
          </p>
        </div>
      </section>

      {/* TAB 1: My Academic Pulse */}
      {activeTab === 'student_pulse' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Risk Factors */}
            <section className="lg:col-span-7 edu-card p-6 space-y-4">
              <div className="pb-3 border-b border-[#F1F5F9]">
                <h3 className="text-base font-semibold text-[#0F172A]">
                  Understanding Your Simulated Risk Classification
                </h3>
                <p className="text-xs text-[#434655] mt-0.5">
                  Signals contributing to your current {tier.toUpperCase()} risk tier (managed by faculty records)
                </p>
              </div>

              <ul className="space-y-3">
                {student.riskDrivers.map((driver) => (
                  <li
                    key={driver.id}
                    className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 flex items-start justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A]">{driver.label}</p>
                      <p className="mt-1 text-xs text-[#434655] leading-relaxed max-w-[62ch]">
                        {driver.detail}
                      </p>
                    </div>
                    <span className="tabular-nums text-xs font-semibold text-[#6B38D4] shrink-0">
                      +{driver.impactPoints} pts
                    </span>
                  </li>
                ))}
              </ul>

              <div className="rounded-lg bg-[#F5F3FF] border border-[#DDD6FE] px-3.5 py-2.5 flex items-start gap-2 text-xs text-[#5516BE]">
                <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Note: Risk scores are simulated predictions generated from faculty-entered attendance, IA marks, and assignment completion.
                </span>
              </div>
            </section>

            {/* Personalized Guidance */}
            <aside className="lg:col-span-5 edu-ai-panel p-6 flex flex-col justify-between space-y-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDE9FE] border border-[#DDD6FE] px-2.5 py-1 text-xs font-semibold text-[#6B38D4]">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Personalized Recommendations</span>
                </span>
                <h3 className="mt-3 text-base font-semibold text-[#0F172A]">
                  {student.recommendedPathway.title}
                </h3>
                <p className="mt-1.5 text-sm text-[#434655] leading-relaxed">
                  {student.recommendedPathway.rationale}
                </p>

                <div className="mt-4 pt-3 border-t border-[#DDD6FE] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#434655]">Checklist Activities Completed</span>
                    <span className="font-semibold text-[#0F172A] tabular-nums">
                      {completedActivities.length} of {student.improvementActivities.length}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white overflow-hidden border border-[#DDD6FE]">
                    <div
                      className="h-full rounded-full bg-[#22C55E]"
                      style={{ width: `${activityProgressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('student_plan')}
                className="w-full rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] px-4 py-2.5 text-xs font-semibold text-white cursor-pointer"
              >
                View Improvement Plan &amp; Checklist
              </button>
            </aside>
          </div>

          {/* Assigned Subjects & Read-only Marks / Attendance Snapshot */}
          <section className="edu-card overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F1F5F9] flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-[#0F172A]">
                  Assigned Subjects · Attendance &amp; Internal Marks (Read-Only)
                </h3>
                <p className="text-xs text-[#434655] mt-0.5">
                  Subject-wise records entered by your faculty for {student.className}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('student_history')}
                className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
              >
                View full IA &amp; assignment breakdown
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F1F5F9] text-[11px] font-semibold uppercase tracking-wide text-[#434655]">
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Days Present</th>
                    <th className="py-3 px-4 text-right">Attendance %</th>
                    <th className="py-3 px-4 text-right">IA1 / IA2 / IA3</th>
                    <th className="py-3 px-4 text-right">Internal Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-sm">
                  {student.subjectRecords.map((rec) => (
                    <tr key={rec.subjectId} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0F172A]">{rec.subjectCode}</div>
                        <div className="text-xs text-[#434655]">{rec.subjectName}</div>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-[#434655]">
                        {rec.subjectType} ({rec.credits} Cr)
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-xs text-[#434655]">
                        {rec.daysPresent} / {rec.totalWorkingDays}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-semibold text-[#0F172A]">
                        {rec.attendancePct}%
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-xs text-[#434655]">
                        {rec.ia1} · {rec.ia2} · {rec.ia3}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-semibold text-[#2563EB]">
                        {rec.internalAvg}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: Improvement Plan */}
      {activeTab === 'student_plan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Faculty-Assigned Improvement Plan */}
          <section className="lg:col-span-6 edu-card p-6 space-y-4">
            <div className="pb-3 border-b border-[#F1F5F9]">
              <h3 className="text-base font-semibold text-[#0F172A]">
                Faculty-Assigned Improvement Plan
              </h3>
              <p className="text-xs text-[#434655] mt-0.5">
                Structured mentoring plan and remarks maintained by your faculty mentor
              </p>
            </div>

            {studentInterventions.length === 0 ? (
              <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 text-xs text-[#434655] space-y-2">
                <p className="font-semibold text-[#0F172A]">
                  Recommended Pathway: {student.recommendedPathway.title}
                </p>
                <p>
                  Channel: {student.recommendedPathway.channel}. Contact {student.advisor} during mentoring hours.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {studentInterventions.map((plan) => {
                  const badge = PLAN_STATUS_LABELS[plan.status];
                  return (
                    <li
                      key={plan.id}
                      className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#2563EB]">
                          {plan.channel}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge.style}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[#0F172A]">{plan.title}</p>
                      <div className="text-xs text-[#434655] space-y-1">
                        <p>
                          <strong className="text-[#0F172A]">Identified Problem:</strong>{' '}
                          {plan.identifiedProblem}
                        </p>
                        <p>
                          <strong className="text-[#0F172A]">Recommended Action:</strong>{' '}
                          {plan.recommendedAction}
                        </p>
                        {plan.facultyRemarks && (
                          <p>
                            <strong className="text-[#0F172A]">Faculty Remarks:</strong>{' '}
                            {plan.facultyRemarks}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-[#64748B] tabular-nums pt-1 border-t border-[#E2E8F0]">
                        Assigned Faculty: {plan.advisor} · Target Date: {formatDateDDMMYYYY(plan.dueDate)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Student Self-Tracking Checklist */}
          <section className="lg:col-span-6 edu-card p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#F1F5F9]">
              <div>
                <h3 className="text-base font-semibold text-[#0F172A]">
                  My Action Checklist
                </h3>
                <p className="text-xs text-[#434655] mt-0.5">
                  Track your completed and pending study milestones
                </p>
              </div>
              <div className="text-xs font-semibold tabular-nums text-[#166534]">
                {completedActivities.length} Completed · {pendingActivities.length} Pending
              </div>
            </div>

            <div className="space-y-3">
              {student.improvementActivities.map((activity) => (
                <div
                  key={activity.id}
                  className={`rounded-xl border p-4 flex items-center justify-between gap-4 transition-colors ${
                    activity.completed
                      ? 'border-[#86EFAC] bg-[#DCFCE7]/35'
                      : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleActivity(student.id, activity.id)}
                    aria-label={
                      activity.completed
                        ? `Mark "${activity.title}" as pending`
                        : `Mark "${activity.title}" as completed`
                    }
                    className="flex items-start gap-3 text-left flex-1 cursor-pointer"
                  >
                    {activity.completed ? (
                      <CheckCircle2
                        className="h-5 w-5 text-[#166534] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                    ) : (
                      <Circle
                        className="h-5 w-5 text-[#94A3B8] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                    )}
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          activity.completed
                            ? 'line-through text-[#434655]'
                            : 'text-[#0F172A]'
                        }`}
                      >
                        {activity.title}
                      </p>
                      <p className="text-xs text-[#434655] mt-0.5 tabular-nums">
                        {activity.category} · Target: {formatDateDDMMYYYY(activity.dueDate)}
                      </p>
                    </div>
                  </button>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums shrink-0 ${
                      activity.completed
                        ? 'bg-[#DCFCE7] text-[#166534]'
                        : 'bg-[#F5F3FF] text-[#6B38D4]'
                    }`}
                  >
                    {activity.completed ? 'Done' : `-${activity.pointsLift} pts`}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: Progress & History */}
      {activeTab === 'student_history' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 6-Week Risk History */}
            <section className="lg:col-span-5 edu-card p-6 space-y-4">
              <div className="pb-3 border-b border-[#F1F5F9]">
                <h3 className="text-base font-semibold text-[#0F172A]">
                  Previous Risk Score History (Weeks 5–10)
                </h3>
                <p className="text-xs text-[#434655] mt-0.5">
                  Weekly simulated risk progression for {student.className}
                </p>
              </div>

              <div className="grid grid-cols-6 gap-3 items-end h-40 pt-4">
                {student.weeklyRiskHistory.map((score, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-xs font-semibold text-[#0F172A] tabular-nums">
                      {score}
                    </span>
                    <div className="w-full rounded-md bg-[#F1F5F9] h-24 flex items-end overflow-hidden">
                      <div
                        className={`w-full rounded-md ${
                          score >= thresholds.highRiskMinScore
                            ? 'bg-[#EF4444]'
                            : score >= thresholds.mediumRiskMinScore
                              ? 'bg-[#F59E0B]'
                              : 'bg-[#22C55E]'
                        }`}
                        style={{ height: `${Math.max(12, score)}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#434655] tabular-nums">Wk {idx + 5}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Subject-wise Internal Assessments */}
            <section className="lg:col-span-7 edu-card overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F1F5F9]">
                <h3 className="text-base font-semibold text-[#0F172A]">
                  Internal Assessment Marks (IA1 · IA2 · IA3 · Practical)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F1F5F9] text-[11px] font-semibold uppercase tracking-wide text-[#434655]">
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-3 text-right">IA1</th>
                      <th className="py-3 px-3 text-right">IA2</th>
                      <th className="py-3 px-3 text-right">IA3</th>
                      <th className="py-3 px-3 text-right">Assign.</th>
                      <th className="py-3 px-3 text-right">Practical</th>
                      <th className="py-3 px-4 text-right">Avg</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] text-sm">
                    {student.subjectRecords.map((rec) => (
                      <tr key={rec.subjectId}>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#0F172A]">{rec.subjectCode}</div>
                          <div className="text-xs text-[#434655]">{rec.subjectName}</div>
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums">{rec.ia1}</td>
                        <td className="py-3 px-3 text-right tabular-nums">{rec.ia2}</td>
                        <td className="py-3 px-3 text-right tabular-nums">{rec.ia3}</td>
                        <td className="py-3 px-3 text-right tabular-nums">{rec.assignmentMarks}</td>
                        <td className="py-3 px-3 text-right tabular-nums">
                          {rec.subjectType === 'Practical' ? rec.practicalMarks : '—'}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums font-semibold text-[#2563EB]">
                          {rec.internalAvg}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Assignment Status Table */}
          <section className="edu-card overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F1F5F9]">
              <h3 className="text-base font-semibold text-[#0F172A]">
                Assignment Submission Status
              </h3>
              <p className="text-xs text-[#434655] mt-0.5">
                Read-only record of assignment submissions, dates (DD-MM-YYYY), and marks obtained
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F1F5F9] text-[11px] font-semibold uppercase tracking-wide text-[#434655]">
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Assignment Name</th>
                    <th className="py-3 px-4">Submission Status</th>
                    <th className="py-3 px-4">Submission Date</th>
                    <th className="py-3 px-4 text-right">Marks Obtained</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-sm">
                  {allAssignments.map((asg) => (
                    <tr key={asg.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4 font-semibold text-[#0F172A] whitespace-nowrap">
                        {asg.subjectCode}
                      </td>
                      <td className="py-3 px-4 text-[#0F172A]">{asg.name}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            asg.status === 'Submitted'
                              ? 'bg-[#DCFCE7] text-[#166534]'
                              : asg.status === 'Late'
                                ? 'bg-[#FEF3C7] text-[#92400E]'
                                : 'bg-[#FEE2E2] text-[#B91C1C]'
                          }`}
                        >
                          {asg.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#434655] tabular-nums">
                        {asg.submissionDate}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-medium text-[#0F172A]">
                        {asg.marksObtained} / {asg.maxMarks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
