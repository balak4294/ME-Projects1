import { useState } from 'react';
import { Info, Sparkles } from 'lucide-react';
import type { AcademicClass, RiskThresholds, Student } from '../types/edupredict';
import {
  computeStudentAssignmentCompletionPct,
  getStudentRiskSummary,
} from '../utils/riskEngine';
import { RiskBadge } from './RiskBadge';

interface FacultyRiskAnalysisScreenProps {
  classes: AcademicClass[];
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  students: Student[];
  thresholds: RiskThresholds;
  onCreatePlanForStudent: (studentId: string) => void;
  onOpenAcademicEntry: (studentId: string) => void;
}

export function FacultyRiskAnalysisScreen({
  classes,
  selectedClassId,
  onSelectClass,
  students,
  thresholds,
  onCreatePlanForStudent,
  onOpenAcademicEntry,
}: FacultyRiskAnalysisScreenProps) {
  const activeClass =
    classes.find((c) => c.id === selectedClassId) ?? classes[0] ?? null;
  const classStudents = students
    .filter((s) => (activeClass ? s.classId === activeClass.id : true))
    .sort(
      (a, b) =>
        getStudentRiskSummary(b, thresholds).effectiveScore -
        getStudentRiskSummary(a, thresholds).effectiveScore
    );

  const [focusedStudentId, setFocusedStudentId] = useState<string>(
    classStudents[0]?.id ?? ''
  );
  const focusedStudent =
    classStudents.find((s) => s.id === focusedStudentId) ??
    classStudents[0] ??
    null;

  return (
    <div className="space-y-6">
      {/* Simulated Prediction Notice & Class Selector */}
      <section className="edu-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <label
            htmlFor="risk-class-select"
            className="block text-[11px] font-semibold uppercase tracking-wide text-[#2563EB] mb-1"
          >
            Step 5 of 6 · Simulated AI Risk Monitoring
          </label>
          <select
            id="risk-class-select"
            value={activeClass?.id ?? ''}
            onChange={(e) => onSelectClass(e.target.value)}
            className="edu-input px-3 text-sm font-semibold text-[#0F172A]"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.className}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl bg-[#F5F3FF] border border-[#DDD6FE] px-4 py-2.5 max-w-xl text-xs text-[#434655]">
          <Info className="h-4 w-4 text-[#6B38D4] shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            <strong className="text-[#0F172A]">Simulated Risk Prediction Model:</strong>{' '}
            Risk scores and classifications below are deterministic mock projections computed from your entered attendance, IA marks, assignments, and engagement records.
          </span>
        </div>
      </section>

      {/* Class Risk Matrix */}
      <section className="edu-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F1F5F9]">
          <h2 className="text-base font-semibold text-[#0F172A]">
            Class Academic Risk Analysis — {activeClass?.className}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F1F5F9] text-[11px] font-semibold uppercase tracking-wide text-[#434655]">
                <th className="py-3 px-4 whitespace-nowrap">Student</th>
                <th className="py-3 px-4 whitespace-nowrap">Register No</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Attendance</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">IA Average</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Assignment %</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Engagement</th>
                <th className="py-3 px-4 whitespace-nowrap">Simulated Risk</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-sm">
              {classStudents.map((stu) => {
                const { effectiveScore, tier } = getStudentRiskSummary(stu, thresholds);
                const assignPct = computeStudentAssignmentCompletionPct(stu);
                const isSelected = focusedStudent?.id === stu.id;
                return (
                  <tr
                    key={stu.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-[#EFF6FF]/60' : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => setFocusedStudentId(stu.id)}
                        className="font-semibold text-[#0F172A] hover:text-[#2563EB] cursor-pointer text-left"
                      >
                        {stu.name}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#434655] tabular-nums">
                      {stu.studentCode}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-medium">
                      {stu.attendanceRate}%
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      {stu.internalMarksAvg}%
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      {assignPct}%
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      {stu.lmsEngagement}/100
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <RiskBadge tier={tier} score={effectiveScore} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onCreatePlanForStudent(stu.id)}
                        className="rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] px-2.5 py-1.5 text-xs font-semibold text-white cursor-pointer"
                      >
                        Create Plan
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Selected Student Breakdown: Factors + Subject-wise vs Overall */}
      {focusedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-7 edu-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 border-b border-[#F1F5F9]">
              <div>
                <h3 className="text-base font-semibold text-[#0F172A]">
                  Subject-Wise Academic Performance — {focusedStudent.name}
                </h3>
                <p className="text-xs text-[#434655] tabular-nums">
                  Register No: {focusedStudent.studentCode} · CGPA: {focusedStudent.gpa.toFixed(2)} / 10
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenAcademicEntry(focusedStudent.id)}
                className="rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] px-3 py-1.5 text-xs font-semibold text-[#0F172A] cursor-pointer"
              >
                Edit Subject Marks
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F1F5F9] text-[11px] font-semibold uppercase tracking-wide text-[#434655]">
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4 text-right">Attendance</th>
                    <th className="py-3 px-4 text-right">IA1 / IA2 / IA3</th>
                    <th className="py-3 px-4 text-right">Internal Avg</th>
                    <th className="py-3 px-4 text-right">Engagement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-sm">
                  {focusedStudent.subjectRecords.map((rec) => (
                    <tr key={rec.subjectId}>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0F172A]">
                          {rec.subjectCode}
                        </div>
                        <div className="text-xs text-[#434655]">{rec.subjectName}</div>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        {rec.attendancePct}%
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-xs text-[#434655]">
                        {rec.ia1} / {rec.ia2} / {rec.ia3}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-semibold text-[#0F172A]">
                        {rec.internalAvg}%
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-[#6B38D4]">
                        {rec.engagementScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="lg:col-span-5 edu-ai-panel p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDE9FE] border border-[#DDD6FE] px-2.5 py-1 text-xs font-semibold text-[#6B38D4]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Simulated Risk Factors</span>
              </span>
              <h3 className="text-base font-semibold text-[#0F172A]">
                Why {focusedStudent.name} is classified{' '}
                {getStudentRiskSummary(focusedStudent, thresholds).tier.toUpperCase()} Risk
              </h3>
              <ul className="space-y-2.5 pt-2 border-t border-[#DDD6FE]">
                {focusedStudent.riskDrivers.map((drv) => (
                  <li key={drv.id} className="rounded-lg bg-white/90 border border-[#DDD6FE] p-3">
                    <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#0F172A]">
                      <span>{drv.label}</span>
                      <span className="text-[#6B38D4] tabular-nums">
                        +{drv.impactPoints} pts
                      </span>
                    </div>
                    <p className="text-xs text-[#434655] mt-1">{drv.detail}</p>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onCreatePlanForStudent(focusedStudent.id)}
              className="w-full rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] px-4 py-2.5 text-xs font-semibold text-white cursor-pointer"
            >
              Create Personalized Improvement Plan
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
