import { useEffect, useState, type FormEvent } from 'react';
import { Check, Save, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import type {
  FacultyMember,
  Intervention,
  RiskThresholds,
  Student,
  UserRole,
} from '../types/edupredict';
import {
  getStudentRiskSummary,
  simulateProjectedRisk,
} from '../utils/riskEngine';
import { RiskBadge } from './RiskBadge';

interface StudentDetailDrawerProps {
  role: UserRole;
  student: Student | null;
  facultyList: FacultyMember[];
  interventions: Intervention[];
  thresholds: RiskThresholds;
  onClose: () => void;
  onAssignAiPathway: (studentId: string) => void;
  onAddCaseNote: (studentId: string, body: string) => void;
  onUpdateAcademicRecord: (
    studentId: string,
    payload: {
      attendanceRate: number;
      internalMarksAvg: number;
      missingAssignments: number;
      facultyId?: string;
    }
  ) => void;
}

export function StudentDetailDrawer({
  role,
  student,
  facultyList,
  interventions,
  thresholds,
  onClose,
  onAssignAiPathway,
  onAddCaseNote,
  onUpdateAcademicRecord,
}: StudentDetailDrawerProps) {
  const [targetAttendance, setTargetAttendance] = useState(85);
  const [tutoringHours, setTutoringHours] = useState(2);
  const [recoveredAssignments, setRecoveredAssignments] = useState(2);
  const [noteInput, setNoteInput] = useState('');
  const [noteError, setNoteError] = useState('');

  const [editAttendance, setEditAttendance] = useState(75);
  const [editMarks, setEditMarks] = useState(75);
  const [editMissing, setEditMissing] = useState(0);
  const [editFacultyId, setEditFacultyId] = useState('');

  useEffect(() => {
    if (!student) return;
    setTargetAttendance(Math.min(98, Math.max(student.attendanceRate + 12, 85)));
    setTutoringHours(2);
    setRecoveredAssignments(Math.min(student.missingAssignments, 2));
    setEditAttendance(student.attendanceRate);
    setEditMarks(student.internalMarksAvg);
    setEditMissing(student.missingAssignments);
    setEditFacultyId(student.facultyId);
    setNoteInput('');
    setNoteError('');
  }, [student]);

  if (!student) return null;

  const { effectiveScore, tier } = getStudentRiskSummary(student, thresholds);
  const studentInterventions = interventions.filter(
    (item) => item.studentId === student.id
  );
  const hasActivePathway = studentInterventions.some(
    (item) => item.status === 'in_progress' || item.status === 'pending'
  );

  const simulation = simulateProjectedRisk(
    student,
    {
      targetAttendanceRate: targetAttendance,
      tutoringHoursPerWeek: tutoringHours,
      assignmentsRecovered: recoveredAssignments,
    },
    thresholds
  );

  const handleSubmitNote = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = noteInput.trim();
    if (trimmed.length < 4) {
      setNoteError('Enter at least 4 characters for the advisor case note.');
      return;
    }
    onAddCaseNote(student.id, trimmed);
    setNoteInput('');
    setNoteError('');
  };

  const handleSaveRecord = (e: FormEvent) => {
    e.preventDefault();
    onUpdateAcademicRecord(student.id, {
      attendanceRate: editAttendance,
      internalMarksAvg: editMarks,
      missingAssignments: editMissing,
      facultyId: role === 'admin' ? editFacultyId : undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#0F172A]/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-drawer-title"
    >
      <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl border-l border-[#E2E8F0] flex flex-col">
        {/* Drawer Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-[#E2E8F0] px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2
                id="student-drawer-title"
                className="text-xl font-bold text-[#0F172A]"
              >
                {student.name}
              </h2>
              <RiskBadge tier={tier} score={effectiveScore} />
            </div>
            <p className="mt-1 text-xs text-[#434655] tabular-nums">
              Reg No: {student.studentCode} · {student.className} · Sem {student.semester} · {student.mobile} · {student.location} · Mentor: {student.advisor}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close student profile"
            className="rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] p-2 text-[#434655] hover:text-[#0F172A] cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Academic Snapshot */}
          <section className="space-y-4 pb-5 border-b border-[#F1F5F9]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-[#434655]">Internal Marks</p>
                <p className="mt-1 text-lg font-bold text-[#0F172A] tabular-nums">
                  {student.internalMarksAvg}%
                </p>
              </div>
              <div>
                <p className="text-xs text-[#434655]">Attendance</p>
                <p className="mt-1 text-lg font-bold text-[#0F172A] tabular-nums">
                  {student.attendanceRate}%
                </p>
              </div>
              <div>
                <p className="text-xs text-[#434655]">Assignments</p>
                <p className="mt-1 text-lg font-bold text-[#0F172A] tabular-nums">
                  {student.assignmentsCompleted}/{student.assignmentsTotal}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#434655]">CGPA (10-Pt)</p>
                <p className="mt-1 text-lg font-bold text-[#0F172A] tabular-nums">
                  {student.gpa.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between text-xs text-[#434655] mb-2">
                <span>6-Week Risk Score Trajectory (Wk 5 – Wk 10)</span>
                <span className="tabular-nums font-medium text-[#6B38D4]">
                  {student.weeklyRiskHistory[0]} → {student.weeklyRiskHistory[student.weeklyRiskHistory.length - 1]}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-2 items-end h-12">
                {student.weeklyRiskHistory.map((val, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end">
                    <div className="w-full rounded-sm bg-[#F1F5F9] h-8 flex items-end overflow-hidden">
                      <div
                        className="w-full rounded-sm bg-[#8B5CF6]/75"
                        style={{ height: `${Math.max(12, val)}%` }}
                        title={`Week ${idx + 5}: ${val}`}
                      />
                    </div>
                    <span className="text-[10px] text-[#64748B] tabular-nums">
                      W{idx + 5}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Update Academic Record (Faculty & Admin) */}
          <section className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#0F172A]">
              Update Academic Record
            </h3>
            <form onSubmit={handleSaveRecord} className="space-y-3">
              <div className={`grid grid-cols-1 ${role === 'admin' ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3`}>
                <div>
                  <label htmlFor="edit-att" className="block text-xs font-medium text-[#434655] mb-1">
                    Attendance %
                  </label>
                  <input
                    id="edit-att"
                    type="number"
                    min={0}
                    max={100}
                    value={editAttendance}
                    onChange={(e) => setEditAttendance(Number(e.target.value))}
                    className="edu-input w-full px-3 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="edit-marks" className="block text-xs font-medium text-[#434655] mb-1">
                    Internal Marks %
                  </label>
                  <input
                    id="edit-marks"
                    type="number"
                    min={0}
                    max={100}
                    value={editMarks}
                    onChange={(e) => setEditMarks(Number(e.target.value))}
                    className="edu-input w-full px-3 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="edit-missing" className="block text-xs font-medium text-[#434655] mb-1">
                    Missing Tasks
                  </label>
                  <input
                    id="edit-missing"
                    type="number"
                    min={0}
                    max={15}
                    value={editMissing}
                    onChange={(e) => setEditMissing(Number(e.target.value))}
                    className="edu-input w-full px-3 text-sm tabular-nums"
                  />
                </div>
                {role === 'admin' && (
                  <div>
                    <label htmlFor="edit-fac" className="block text-xs font-medium text-[#434655] mb-1">
                      Assigned Faculty
                    </label>
                    <select
                      id="edit-fac"
                      value={editFacultyId}
                      onChange={(e) => setEditFacultyId(e.target.value)}
                      className="edu-input w-full px-2 text-xs"
                    >
                      {facultyList.map((fac) => (
                        <option key={fac.id} value={fac.id}>
                          {fac.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-3.5 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Save &amp; Recalculate Risk</span>
                </button>
              </div>
            </form>
          </section>

          {/* Predictive AI Suggestion Panel */}
          <section aria-label="Recommended AI Intervention" className="edu-ai-panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDE9FE] border border-[#DDD6FE] px-2.5 py-1 text-xs font-semibold text-[#6B38D4]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Simulated AI Insights</span>
              </span>
              <span className="text-xs font-semibold text-[#5516BE] tabular-nums">
                Est. -{student.recommendedPathway.expectedRiskReduction} risk pts
              </span>
            </div>

            <h3 className="mt-3 text-base font-semibold text-[#0F172A]">
              {student.recommendedPathway.title}
            </h3>
            <p className="mt-1 text-sm text-[#434655] leading-relaxed max-w-[68ch]">
              {student.recommendedPathway.rationale}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#DDD6FE]">
              <span className="text-xs text-[#5516BE]">
                Channel: <strong>{student.recommendedPathway.channel}</strong>
              </span>
              {hasActivePathway ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#166534]">
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span>Pathway Assigned</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onAssignAiPathway(student.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-[0.98] px-4 py-2 text-xs font-semibold text-white transition-all cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Assign Recommended Pathway</span>
                </button>
              )}
            </div>
          </section>

          {/* Subject-Wise Performance Summary */}
          {student.subjectRecords.length > 0 && (
            <section className="space-y-2.5">
              <h3 className="text-sm font-semibold text-[#0F172A]">
                Subject-Wise Attendance &amp; IA Summary
              </h3>
              <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F1F5F9] text-[10px] font-semibold uppercase tracking-wide text-[#434655]">
                      <th className="py-2 px-3">Subject</th>
                      <th className="py-2 px-3 text-right">Attendance</th>
                      <th className="py-2 px-3 text-right">IA Avg</th>
                      <th className="py-2 px-3 text-right">Engagement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {student.subjectRecords.map((rec) => (
                      <tr key={rec.subjectId}>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-[#0F172A]">{rec.subjectCode}</span>{' '}
                          <span className="text-[#434655]">{rec.subjectName}</span>
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums">{rec.attendancePct}%</td>
                        <td className="py-2 px-3 text-right tabular-nums font-medium">{rec.internalAvg}%</td>
                        <td className="py-2 px-3 text-right tabular-nums">{rec.engagementScore}/100</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Algorithmic Risk Drivers */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-[#0F172A]">
              Simulated Risk Contributing Factors
            </h3>
            <ul className="divide-y divide-[#F1F5F9] border border-[#E2E8F0] rounded-xl bg-white">
              {student.riskDrivers.map((driver) => (
                <li key={driver.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#0F172A]">{driver.label}</p>
                    <p className="text-xs text-[#434655] max-w-[65ch]">{driver.detail}</p>
                  </div>
                  <span className="tabular-nums text-xs font-semibold text-[#6B38D4] shrink-0">
                    +{driver.impactPoints} pts
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* What-If Recovery Simulator */}
          <section className="border border-[#E2E8F0] rounded-xl p-5 bg-[#F8FAFC] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#2563EB]" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-[#0F172A]">
                  What-If Intervention Simulator
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#434655]">Projected Score:</span>
                <RiskBadge tier={simulation.projectedTier} score={simulation.projectedScore} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="sim-attendance"
                  className="flex items-center justify-between text-xs font-medium text-[#0F172A]"
                >
                  <span>Target Attendance</span>
                  <span className="tabular-nums text-[#2563EB]">{targetAttendance}%</span>
                </label>
                <input
                  id="sim-attendance"
                  type="range"
                  min={student.attendanceRate}
                  max={100}
                  value={targetAttendance}
                  onChange={(e) => setTargetAttendance(Number(e.target.value))}
                  className="mt-2 w-full accent-[#2563EB] cursor-pointer"
                />
              </div>

              <div>
                <label
                  htmlFor="sim-tutoring"
                  className="flex items-center justify-between text-xs font-medium text-[#0F172A]"
                >
                  <span>Tutoring Hrs / Wk</span>
                  <span className="tabular-nums text-[#2563EB]">{tutoringHours} hrs</span>
                </label>
                <input
                  id="sim-tutoring"
                  type="range"
                  min={0}
                  max={6}
                  value={tutoringHours}
                  onChange={(e) => setTutoringHours(Number(e.target.value))}
                  className="mt-2 w-full accent-[#2563EB] cursor-pointer"
                />
              </div>

              <div>
                <label
                  htmlFor="sim-assignments"
                  className="flex items-center justify-between text-xs font-medium text-[#0F172A]"
                >
                  <span>Tasks Recovered</span>
                  <span className="tabular-nums text-[#2563EB]">
                    {recoveredAssignments} / {student.missingAssignments}
                  </span>
                </label>
                <input
                  id="sim-assignments"
                  type="range"
                  min={0}
                  max={Math.max(1, student.missingAssignments)}
                  disabled={student.missingAssignments === 0}
                  value={recoveredAssignments}
                  onChange={(e) => setRecoveredAssignments(Number(e.target.value))}
                  className="mt-2 w-full accent-[#2563EB] cursor-pointer disabled:opacity-50"
                />
              </div>
            </div>

            <p className="text-xs text-[#434655] tabular-nums">
              Simulated delta:{' '}
              <strong className="text-[#166534] font-semibold">
                {simulation.delta} points
              </strong>{' '}
              from current effective risk ({simulation.baselineScore} → {simulation.projectedScore}).
            </p>
          </section>

          {/* Advisor Case Notes */}
          <section className="space-y-3 pb-4">
            <h3 className="text-sm font-semibold text-[#0F172A]">
              Advisor Case Notes
            </h3>

            <form onSubmit={handleSubmitNote} className="space-y-2">
              <label htmlFor="case-note-input" className="sr-only">
                Add advisor case note
              </label>
              <textarea
                id="case-note-input"
                rows={3}
                value={noteInput}
                onChange={(e) => {
                  setNoteInput(e.target.value);
                  if (noteError) setNoteError('');
                }}
                placeholder="Log outreach summary, student context, or follow-up action..."
                className="w-full rounded-lg border border-[#CBD5E1] bg-white p-3 text-sm text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/20"
              />
              {noteError && (
                <p className="text-xs font-medium text-[#B91C1C]">{noteError}</p>
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  Save Case Note
                </button>
              </div>
            </form>

            {student.caseNotes.length === 0 ? (
              <p className="text-xs text-[#64748B] py-2">
                No case notes recorded yet for this term.
              </p>
            ) : (
              <ul className="space-y-3">
                {student.caseNotes.map((note) => (
                  <li
                    key={note.id}
                    className="rounded-lg border border-[#E2E8F0] bg-white p-3.5"
                  >
                    <div className="text-xs text-[#434655]">
                      <strong className="font-semibold text-[#0F172A]">
                        {note.author}
                      </strong>{' '}
                      · {note.role} · {note.createdAt}
                    </div>
                    <p className="mt-1.5 text-sm text-[#0F172A] leading-relaxed max-w-[68ch]">
                      {note.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
